import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'
import { ApiError } from '@/lib/api-error'

// Note: PDF generation via Puppeteer is not available on Vercel serverless.
// Reports are generated as HTML and uploaded to Firebase Storage.
// To enable PDF generation, use a dedicated service (e.g., DocRaptor, Gotenberg).

export class ReportService {
  async generateReport(auditId: string) {
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      include: {
        route: true,
        coordinator: true,
        participants: { include: { abilities: true } },
        sections: true,
        issues: { where: { deletedAt: null }, include: { photos: { where: { deletedAt: null }, take: 1 } } },
        recommendations: { where: { deletedAt: null } },
        reportMetrics: true,
      },
    })

    if (!audit) throw new ApiError('Audit not found', 404)

    // Return existing report if recent (< 24h)
    if (audit.reportPdfUrl && audit.reportGeneratedAt) {
      const hoursSince = (Date.now() - audit.reportGeneratedAt.getTime()) / (1000 * 60 * 60)
      if (hoursSince < 24) {
        return { url: audit.reportPdfUrl, generatedAt: audit.reportGeneratedAt }
      }
    }

    // Generate HTML report content
    const html = this.generateReportHTML(audit)

    // Upload HTML to Firebase if configured, otherwise return inline
    let reportUrl = audit.reportPdfUrl

    try {
      const { default: admin } = await import('firebase-admin')
      if (process.env.FIREBASE_STORAGE_BUCKET && admin.apps.length > 0) {
        const bucket = admin.storage().bucket()
        const fileName = `reports/${auditId}/${Date.now()}-report.html`
        const file = bucket.file(fileName)
        await file.save(Buffer.from(html, 'utf8'), {
          metadata: { contentType: 'text/html' },
          public: true,
        })
        reportUrl = file.publicUrl()
      }
    } catch (error) {
      logger.error(`Failed to upload report to Firebase: ${error}`)
      // Fall through — still update the record without a URL
    }

    if (reportUrl) {
      await prisma.audit.update({
        where: { id: auditId },
        data: {
          reportPdfUrl: reportUrl,
          reportGeneratedAt: new Date(),
          reportVersion: { increment: 1 },
        },
      })
    }

    logger.info(`Report generated for audit: ${auditId}`)
    return { url: reportUrl || null, generatedAt: new Date(), html }
  }

  async getReportUrl(auditId: string) {
    const audit = await prisma.audit.findUnique({
      where: { id: auditId },
      select: { reportPdfUrl: true, reportGeneratedAt: true },
    })

    if (!audit) throw new ApiError('Audit not found', 404)
    if (!audit.reportPdfUrl) throw new ApiError('Report not yet generated', 404)

    return { url: audit.reportPdfUrl, generatedAt: audit.reportGeneratedAt }
  }

  private generateReportHTML(audit: any): string {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <title>Walking Audit Report — ${audit.route.name}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
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
    <p><strong>Audit Date:</strong> ${new Date(audit.auditDate).toLocaleDateString()}</p>
    <p><strong>Coordinator:</strong> ${audit.coordinator.name}</p>

    <h2>Overall Score</h2>
    <div class="score">${audit.normalizedScore ? (Number(audit.normalizedScore) * 100).toFixed(1) : 'N/A'}%</div>
    <p><strong>Walkability Rating:</strong> ${audit.walkabilityRating || 'N/A'}</p>

    <h2>Section Scores</h2>
    <table>
      <tr><th>Section</th><th>Score</th></tr>
      ${audit.sections.map((s: any) => `<tr><td>${s.section.replace(/_/g, ' ')}</td><td>${s.score}/5</td></tr>`).join('')}
    </table>

    <h2>Issues (${audit.issues.length})</h2>
    <table>
      <tr><th>Category</th><th>Severity</th><th>Title</th></tr>
      ${audit.issues.map((i: any) => `<tr><td>${i.category}</td><td>${i.severity}</td><td>${i.title}</td></tr>`).join('')}
    </table>

    <h2>Recommendations (${audit.recommendations.length})</h2>
    ${audit.recommendations.map((r: any) => `
      <div class="section">
        <h3>${r.title}</h3>
        <p>${r.description}</p>
        <p><strong>Priority:</strong> ${r.priority} | <strong>Status:</strong> ${r.laStatus}</p>
      </div>
    `).join('')}
  </body>
</html>`
  }
}

export const reportService = new ReportService()
