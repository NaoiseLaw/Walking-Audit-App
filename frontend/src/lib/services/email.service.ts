import { logger } from '@/lib/logger'

// Stub email service — configure SendGrid when ready.
// Emails are logged to console in development.
class EmailService {
  async sendVerificationEmail(userId: string, email: string, token: string) {
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`
    logger.info(`[EMAIL] Verification email for ${email}: ${verifyUrl}`)
    // TODO: integrate SendGrid when SENDGRID_API_KEY is set
  }

  async sendPasswordResetEmail(userId: string, email: string, token: string) {
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`
    logger.info(`[EMAIL] Password reset email for ${email}: ${resetUrl}`)
    // TODO: integrate SendGrid when SENDGRID_API_KEY is set
  }
}

export const emailService = new EmailService()
