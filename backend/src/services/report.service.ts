import { prisma } from '../config/database.config';
import { redis } from '../config/redis.config';
import { logger } from '../utils/logger.util';
import { ApiError } from '../middleware/error.middleware';
import * as admin from 'firebase-admin';

function getFirebaseAdminBucket() {
  if (!admin.apps.length) {
    try {
      admin.initializeApp({
        credential: admin.credential.cert(
          process.env.FIREBASE_SERVICE_ACCOUNT
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
            : require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json')
        ),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      });
    } catch (error) {
      logger.warn('Firebase Admin not initialized. Report uploads will fail.');
      return null;
    }
  }
  return admin.storage().bucket();
}

export class ReportService {
  /**
   * Generate PDF report for audit
   */
  async generateReport(auditId: string) {
    // Get audit with all related data
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        route: true,
        coordinator: true,
        participants: {
          include: {
            abilities: true,
          },
        },
        sections: true,
        issues: {
          where: { deletedAt: null },
          include: {
            photos: {
              where: { deletedAt: null },
              take: 1,
            },
          },
        },
        recommendations: {
          where: { deletedAt: null },
        },
        reportMetrics: true,
      },
    });

    if (!audit) {
      throw new ApiError('Audit not found', 404);
    }

    // Check if report already exists and is recent
    if (audit.reportPdfUrl && audit.reportGeneratedAt) {
      const hoursSinceGeneration = (Date.now() - audit.reportGeneratedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceGeneration < 24) {
        // Report is less than 24 hours old, return existing
        return {
          url: audit.reportPdfUrl,
          generatedAt: audit.reportGeneratedAt,
        };
      }
    }

    // Generate HTML content
    const html = this.generateReportHTML(audit);

    // Generate PDF
    const pdfBuffer = await this.generatePDF(html);

    // Upload to storage
    const reportUrl = await this.uploadReport(pdfBuffer, auditId);

    // Update audit with report URL
    await prisma.audit.update({
      where: { id: auditId },
      data: {
        reportPdfUrl: reportUrl,
        reportGeneratedAt: new Date(),
        reportVersion: {
          increment: 1,
        },
      },
    });

    logger.info(`Report generated for audit: ${auditId}`);

    return {
      url: reportUrl,
      generatedAt: new Date(),
    };
  }

  /**
   * Get report URL
   */
  async getReportUrl(auditId: string) {
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      select: {
        reportPdfUrl: true,
        reportGeneratedAt: true,
      },
    });

    if (!audit) {
      throw new ApiError('Audit not found', 404);
    }

    if (!audit.reportPdfUrl) {
      throw new ApiError('Report not generated', 404);
    }

    return {
      url: audit.reportPdfUrl,
      generatedAt: audit.reportGeneratedAt,
    };
  }

  /**
   * Generate report HTML
   */
  private generateReportHTML(audit: any): string {
    // This is a simplified version - in production, use a template engine like Handlebars
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <title>Walking Audit Report - ${audit.route.name}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 40px;
              color: #333;
            }
            h1 { color: #0ea5e9; }
            h2 { color: #0369a1; margin-top: 30px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background-color: #f0f9ff; }
            .score { font-size: 24px; font-weight: bold; color: #0ea5e9; }
            .section { margin: 20px 0; padding: 15px; background-color: #f8fafc; }
          </style>
        </head>
        <body>
          <h1>Walking Audit Report</h1>
          <h2>Route: ${audit.route.name}</h2>
          <p><strong>Location:</strong> ${audit.route.townCity}, ${audit.route.county}</p>
          <p><strong>Audit Date:</strong> ${audit.auditDate.toLocaleDateString()}</p>
          <p><strong>Coordinator:</strong> ${audit.coordinator.name}</p>
          
          <h2>Overall Score</h2>
          <div class="score">${audit.normalizedScore ? (audit.normalizedScore * 100).toFixed(1) : 'N/A'}%</div>
          <p><strong>Walkability Rating:</strong> ${audit.walkabilityRating || 'N/A'}</p>
          
          <h2>Section Scores</h2>
          <table>
            <tr>
              <th>Section</th>
              <th>Score</th>
            </tr>
            ${audit.sections.map((section: any) => `
              <tr>
                <td>${section.section.replace(/_/g, ' ')}</td>
                <td>${section.score}/5</td>
              </tr>
            `).join('')}
          </table>
          
          <h2>Issues</h2>
          <p>Total Issues: ${audit.issues.length}</p>
          <table>
            <tr>
              <th>Category</th>
              <th>Severity</th>
              <th>Title</th>
            </tr>
            ${audit.issues.map((issue: any) => `
              <tr>
                <td>${issue.category}</td>
                <td>${issue.severity}</td>
                <td>${issue.title}</td>
              </tr>
            `).join('')}
          </table>
          
          <h2>Recommendations</h2>
          <p>Total Recommendations: ${audit.recommendations.length}</p>
          ${audit.recommendations.map((rec: any) => `
            <div class="section">
              <h3>${rec.title}</h3>
              <p>${rec.description}</p>
              <p><strong>Priority:</strong> ${rec.priority}</p>
              <p><strong>Status:</strong> ${rec.laStatus}</p>
            </div>
          `).join('')}
        </body>
      </html>
    `;
  }

  /**
   * Generate PDF from HTML
   */
  private async generatePDF(html: string): Promise<Buffer> {
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdf = await page.pdf({
        format: 'A4',
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px',
        },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  /**
   * Upload report to storage
   */
  private async uploadReport(pdfBuffer: Buffer, auditId: string): Promise<string> {
    try {
      const bucket = getFirebaseAdminBucket();
      if (!bucket) throw new ApiError('Firebase Storage not configured', 503);
      const fileName = `reports/${auditId}/${Date.now()}-report.pdf`;
      const file = bucket.file(fileName);

      await file.save(pdfBuffer, {
        metadata: {
          contentType: 'application/pdf',
        },
        public: true,
      });

      return file.publicUrl();
    } catch (error) {
      if (error instanceof ApiError) throw error;
      logger.error(`Failed to upload report: ${error}`);
      throw new ApiError('Failed to upload report', 500);
    }
  }
}

export const reportService = new ReportService();

