import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { supabase, toCamel } from '@/lib/supabase-admin'
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

    const { data: existing } = await supabase
      .from('users')
      .select('id, deleted_at')
      .eq('email', email)
      .maybeSingle()

    if (existing && !existing.deleted_at) {
      throw new ApiError('Email already registered', 409)
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpires = new Date()
    verificationExpires.setHours(verificationExpires.getHours() + 24)

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        role,
        organization,
        county,
        verification_token: verificationToken,
        verification_expires: verificationExpires.toISOString(),
        email_verified: process.env.ENABLE_EMAIL_VERIFICATION !== 'true',
      })
      .select('id, email, name, role, email_verified, created_at')
      .single()

    if (error) {
      console.error('[auth.service] Supabase insert error:', JSON.stringify(error))
      throw new ApiError(`Failed to create user: ${error.message}`, 500)
    }

    if (process.env.ENABLE_EMAIL_VERIFICATION === 'true') {
      try {
        const { emailService } = await import('./email.service')
        await emailService.sendVerificationEmail(user.id, email, verificationToken)
      } catch (err) {
        logger.error(`Failed to send verification email: ${err}`)
      }
    }

    logger.info(`User registered: ${user.email}`)
    return toCamel(user)
  }

  async login(data: LoginData) {
    const { email, password } = data

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle()

    if (userError) {
      logger.error(`Login DB error: ${JSON.stringify(userError)}`)
      throw new ApiError('Invalid email or password', 401)
    }

    if (!user || user.deleted_at) {
      logger.warn(`Login: user not found for email ${email}`)
      throw new ApiError('Invalid email or password', 401)
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    if (!isValidPassword) {
      logger.warn(`Login: invalid password for ${email} (hash prefix: ${user.password_hash?.slice(0,7)})`)
      throw new ApiError('Invalid email or password', 401)
    }

    if (!user.email_verified && process.env.ENABLE_EMAIL_VERIFICATION === 'true') {
      throw new ApiError('Email not verified', 403)
    }

    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', user.id)

    const accessToken = this.generateAccessToken(user.id, user.email, user.role)
    const refreshToken = this.generateRefreshToken(user.id)

    logger.info(`User logged in: ${user.email}`)

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.email_verified,
      },
      tokens: { accessToken, refreshToken },
    }
  }

  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET) as { userId: string }

      const { data: user } = await supabase
        .from('users')
        .select('id, email, role')
        .eq('id', decoded.userId)
        .is('deleted_at', null)
        .maybeSingle()

      if (!user) throw new ApiError('User not found', 401)

      const accessToken = this.generateAccessToken(user.id, user.email, user.role)
      return { accessToken }
    } catch {
      throw new ApiError('Invalid refresh token', 401)
    }
  }

  async forgotPassword(email: string) {
    const { data: user } = await supabase
      .from('users')
      .select('id, email, deleted_at')
      .eq('email', email)
      .maybeSingle()

    if (!user || user.deleted_at) {
      return { message: 'If the email exists, a password reset link has been sent' }
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetExpires = new Date()
    resetExpires.setHours(resetExpires.getHours() + 1)

    await supabase
      .from('users')
      .update({ reset_token: resetToken, reset_expires: resetExpires.toISOString() })
      .eq('id', user.id)

    try {
      const { emailService } = await import('./email.service')
      await emailService.sendPasswordResetEmail(user.id, email, resetToken)
    } catch (err) {
      logger.error(`Failed to send password reset email: ${err}`)
    }

    return { message: 'If the email exists, a password reset link has been sent' }
  }

  async resetPassword(token: string, newPassword: string) {
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('reset_token', token)
      .gt('reset_expires', new Date().toISOString())
      .maybeSingle()

    if (!user) throw new ApiError('Invalid or expired reset token', 400)

    const passwordHash = await bcrypt.hash(newPassword, 12)

    await supabase
      .from('users')
      .update({ password_hash: passwordHash, reset_token: null, reset_expires: null })
      .eq('id', user.id)

    logger.info(`Password reset for user: ${user.email}`)
    return { message: 'Password reset successfully' }
  }

  async loginWithGoogle(data: {
    googleId: string;
    email: string;
    name: string;
    avatarUrl?: string;
  }) {
    const { googleId, email, name, avatarUrl } = data;

    const { data: existing } = await supabase
      .from('users')
      .select('*')
      .or(`google_id.eq.${googleId},email.eq.${email}`)
      .is('deleted_at', null)
      .maybeSingle();

    let user = existing;

    if (user) {
      const updates: Record<string, unknown> = { last_login: new Date().toISOString() };
      if (!user.google_id) updates.google_id = googleId;
      if (avatarUrl && !user.avatar_url) updates.avatar_url = avatarUrl;
      await supabase.from('users').update(updates).eq('id', user.id);
    } else {
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          email,
          name,
          role: 'auditor',
          google_id: googleId,
          avatar_url: avatarUrl ?? null,
          email_verified: true,
          last_login: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (error) {
        logger.error(`Google signup error: ${JSON.stringify(error)}`);
        throw new ApiError(`Failed to create user: ${error.message}`, 500);
      }
      user = newUser;
    }

    const accessToken = this.generateAccessToken(user.id, user.email, user.role);
    const refreshToken = this.generateRefreshToken(user.id);

    logger.info(`Google login: ${user.email}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.email_verified,
        avatarUrl: user.avatar_url ?? null,
      },
      tokens: { accessToken, refreshToken },
    };
  }

  async verifyEmail(token: string) {
    const { data: user } = await supabase
      .from('users')
      .select('id, email')
      .eq('verification_token', token)
      .gt('verification_expires', new Date().toISOString())
      .maybeSingle()

    if (!user) throw new ApiError('Invalid or expired verification token', 400)

    await supabase
      .from('users')
      .update({ email_verified: true, verification_token: null, verification_expires: null })
      .eq('id', user.id)

    logger.info(`Email verified for user: ${user.email}`)
    return { message: 'Email verified successfully' }
  }

  async resendVerification(email: string) {
    const { data: user } = await supabase
      .from('users')
      .select('id, email_verified, deleted_at')
      .eq('email', email)
      .maybeSingle()

    if (!user || user.deleted_at) throw new ApiError('User not found', 404)
    if (user.email_verified) throw new ApiError('Email already verified', 400)

    const verificationToken = crypto.randomBytes(32).toString('hex')
    const verificationExpires = new Date()
    verificationExpires.setHours(verificationExpires.getHours() + 24)

    await supabase
      .from('users')
      .update({
        verification_token: verificationToken,
        verification_expires: verificationExpires.toISOString(),
      })
      .eq('id', user.id)

    try {
      const { emailService } = await import('./email.service')
      await emailService.sendVerificationEmail(user.id, email, verificationToken)
    } catch (err) {
      logger.error(`Failed to send verification email: ${err}`)
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
