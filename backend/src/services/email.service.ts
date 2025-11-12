import { prisma } from '../config/database.config';
import { logger } from '../utils/logger.util';
import * as sgMail from '@sendgrid/mail';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export class EmailService {
  /**
   * Send email
   */
  async sendEmail(
    to: string,
    subject: string,
    html: string,
    text?: string,
    from?: string
  ) {
    const fromEmail = from || process.env.FROM_EMAIL || 'noreply@walkingaudit.ie';
    const fromName = process.env.FROM_NAME || 'Walking Audit App';

    const msg = {
      to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject,
      text: text || this.htmlToText(html),
      html,
    };

    try {
      await sgMail.send(msg);
      logger.info(`Email sent to ${to}: ${subject}`);
      return { success: true };
    } catch (error) {
      logger.error(`Failed to send email to ${to}:`, error);
      throw error;
    }
  }

  /**
   * Queue email
   */
  async queueEmail(
    recipientEmail: string,
    subject: string,
    bodyHtml: string,
    bodyText?: string,
    recipientUserId?: string,
    templateName?: string,
    templateData?: Record<string, any>,
    emailType?: string,
    priority: string = 'normal'
  ) {
    return prisma.emailQueue.create({
      data: {
        recipientEmail,
        recipientName: recipientUserId
          ? (
              await prisma.user.findUnique({
                where: { id: recipientUserId },
                select: { name: true },
              })
            )?.name || null
          : null,
        recipientUserId,
        subject,
        bodyText: bodyText || this.htmlToText(bodyHtml),
        bodyHtml,
        templateName,
        templateData: templateData || {},
        emailType,
        status: 'pending',
        priority,
      },
    });
  }

  /**
   * Process email queue
   */
  async processEmailQueue() {
    const emails = await prisma.emailQueue.findMany({
      where: {
        status: 'pending',
        OR: [
          { sendAfter: null },
          { sendAfter: { lte: new Date() } },
        ],
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
      take: 50,
    });

    const results = [];

    for (const email of emails) {
      try {
        await this.sendEmail(
          email.recipientEmail,
          email.subject,
          email.bodyHtml || '',
          email.bodyText || undefined
        );

        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
          },
        });

        results.push({
          id: email.id,
          status: 'success',
        });
      } catch (error) {
        logger.error(`Failed to send queued email ${email.id}:`, error);

        await prisma.emailQueue.update({
          where: { id: email.id },
          data: {
            status: email.attempts >= email.maxAttempts ? 'failed' : 'pending',
            attempts: {
              increment: 1,
            },
            lastError: error instanceof Error ? error.message : 'Unknown error',
            lastAttemptAt: new Date(),
          },
        });

        results.push({
          id: email.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(userId: string, email: string, token: string) {
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/verify-email?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Verify Your Email</title>
        </head>
        <body>
          <h1>Verify Your Email</h1>
          <p>Thank you for registering with Walking Audit App!</p>
          <p>Please click the link below to verify your email address:</p>
          <p><a href="${verificationUrl}">Verify Email</a></p>
          <p>Or copy and paste this URL into your browser:</p>
          <p>${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
        </body>
      </html>
    `;

    return this.queueEmail(
      email,
      'Verify Your Email',
      html,
      undefined,
      userId,
      'verification',
      { token, verificationUrl },
      'verification'
    );
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(userId: string, email: string, token: string) {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/auth/reset-password?token=${token}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Reset Your Password</title>
        </head>
        <body>
          <h1>Reset Your Password</h1>
          <p>You requested to reset your password.</p>
          <p>Please click the link below to reset your password:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>Or copy and paste this URL into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you did not request this, please ignore this email.</p>
        </body>
      </html>
    `;

    return this.queueEmail(
      email,
      'Reset Your Password',
      html,
      undefined,
      userId,
      'password-reset',
      { token, resetUrl },
      'password-reset'
    );
  }

  /**
   * Convert HTML to text
   */
  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
  }
}

export const emailService = new EmailService();

