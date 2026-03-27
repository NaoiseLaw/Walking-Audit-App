import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { ApiError } from '@/lib/api-error'

const JWT_SECRET = process.env.JWT_SECRET!
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!
const JWT_EXPIRY = (process.env.JWT_EXPIRY || '24h') as any
const JWT_REFRESH_EXPIRY = (process.env.JWT_REFRESH_EXPIRY || '30d') as any

interface RegisterData {
  email: string
  password: string
  name: string
  role?: string
  organization?: string
  county?: string
}

interface LoginData {
  email: string
  password: string
}

export class AuthService {
  async register(data: RegisterData) {
    const { email, password, name, role = 'auditor', organization, county } = data

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser && !existingUser.deletedAt) {
      throw new ApiError('Email already registered', 409)
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpires = new Date()
    verificationExpires.setHours(verificationExpires.getHours() + 24)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        role: role as any,
        organization,
        county,
        verificationToken,
        verificationExpires,
        emailVerified: process.env.ENABLE_EMAIL_VERIFICATION !== 'true',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    })

    if (process.env.ENABLE_EMAIL_VERIFICATION === 'true') {
      try {
        const { emailService } = await import('./email.service')
        await emailService.sendVerificationEmail(user.id, email, verificationToken)
      } catch (error) {
        logger.error(`Failed to send verification email: ${error}`)
      }
    }

    logger.info(`User registered: ${user.email}`)
    return user
  }

  async login(data: LoginData) {
    const { email, password } = data

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || user.deletedAt) {
      throw new ApiError('Invalid email or password', 401)
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash)
    if (!isValidPassword) {
      throw new ApiError('Invalid email or password', 401)
    }

    if (!user.emailVerified && process.env.ENABLE_EMAIL_VERIFICATION === 'true') {
      throw new ApiError('Email not verified', 403)
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    })

    const accessToken = this.generateAccessToken(user.id, user.email, user.role)
    const refreshToken = this.generateRefreshToken(user.id)

    logger.info(`User logged in: ${user.email}`)

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.emailVerified,
      },
      tokens: { accessToken, refreshToken },
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId, deletedAt: null },
      })

      if (!user) throw new ApiError('User not found', 401)

      const accessToken = this.generateAccessToken(user.id, user.email, user.role)
      return { accessToken }
    } catch (error) {
      throw new ApiError('Invalid refresh token', 401)
    }
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || user.deletedAt) {
      return { message: 'If the email exists, a password reset link has been sent' }
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date()
    resetExpires.setHours(resetExpires.getHours() + 1)

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken, resetExpires },
    })

    try {
      const { emailService } = await import('./email.service')
      await emailService.sendPasswordResetEmail(user.id, email, resetToken)
    } catch (error) {
      logger.error(`Failed to send password reset email: ${error}`)
    }

    return { message: 'If the email exists, a password reset link has been sent' }
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: { resetToken: token, resetExpires: { gt: new Date() } },
    })

    if (!user) throw new ApiError('Invalid or expired reset token', 400)

    const passwordHash = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetExpires: null },
    })

    logger.info(`Password reset for user: ${user.email}`)
    return { message: 'Password reset successfully' }
  }

  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: { verificationToken: token, verificationExpires: { gt: new Date() } },
    })

    if (!user) throw new ApiError('Invalid or expired verification token', 400)

    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, verificationToken: null, verificationExpires: null },
    })

    logger.info(`Email verified for user: ${user.email}`)
    return { message: 'Email verified successfully' }
  }

  async resendVerification(email: string) {
    const user = await prisma.user.findUnique({ where: { email } })

    if (!user || user.deletedAt) throw new ApiError('User not found', 404)
    if (user.emailVerified) throw new ApiError('Email already verified', 400)

    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpires = new Date()
    verificationExpires.setHours(verificationExpires.getHours() + 24)

    await prisma.user.update({
      where: { id: user.id },
      data: { verificationToken, verificationExpires },
    })

    try {
      const { emailService } = await import('./email.service')
      await emailService.sendVerificationEmail(user.id, email, verificationToken)
    } catch (error) {
      logger.error(`Failed to send verification email: ${error}`)
    }

    return { message: 'Verification email sent' }
  }

  private generateAccessToken(userId: string, email: string, role: string): string {
    return jwt.sign({ userId, email, role }, JWT_SECRET, { expiresIn: JWT_EXPIRY })
  }

  private generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRY })
  }
}

export const authService = new AuthService()
