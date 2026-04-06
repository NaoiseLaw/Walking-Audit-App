import { supabase, toCamel } from '@/lib/supabase-admin'
import { logger } from '@/lib/logger'
import { ApiError } from '@/lib/api-error'

// Note: PDF generation via Puppeteer is not available on Vercel serverless.
// Reports are generated as HTML and uploaded to Supabase Storage.

const REPORT_BUCKET = 'reports'

export class ReportService {
  async generateReport(auditId: string) {
    const { data: audit } = await supabase
      .from('audits')
      .select(`
        *,
        route:routes(*),
        coordinator:users!coordinator_id(*),
        participants:audit_participants(*, abilities:participant_abilities(*)),
        sections:audit_sections(*),
        issues(*),
        recommendations(*)
      `)
      .eq('id', auditId)
      .maybeSingle()

    if (!audit) throw new ApiError('Audit not found', 404)

    // Filter soft-deleted nested records
    const auditWithFiltered = {
      ...audit,
      issues: (audit.issues || []).filter((i: any) => !i.deleted_at),
      recommendations: (audit.recommendations || []).filter((r: any) => !r.deleted_at),
    }

    // Return existing report if recent (< 24h)
    if (audit.report_pdf_url && audit.report_generated_at) {
      const hoursSince = (Date.now() - new Date(audit.report_generated_at).getTime()) / (1000 * 60 * 60)
      if (hoursSince < 24) {
        return { url: audit.report_pdf_url, generatedAt: audit.report_generated_at }
      }
    }

    const html = this.generateReportHTML(toCamel(auditWithFiltered))

    let reportUrl = audit.report_pdf_url

    try {
      const fileName = `reports/${auditId}/${Date.now()}-report.html`
      const { error: uploadError } = await supabase.storage
        .from(REPORT_BUCKET)
        .upload(fileName, Buffer.from(html, 'utf8'), {
          contentType: 'text/html',
          upsert: true,
        })

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage
          .from(REPORT_BUCKET)
          .getPublicUrl(fileName)
        reportUrl = publicUrl
      }
    } catch (error) {
      logger.error(`Failed to upload report to Supabase Storage: ${error}`)
    }

    if (reportUrl) {
      await supabase.from('audits').update({
        report_pdf_url: reportUrl,
        report_generated_at: new Date().toISOString(),
        report_version: (audit.report_version || 0) + 1,
      }).eq('id', auditId)
    }

    logger.info(`Report generated for audit: ${auditId}`)
    return { url: reportUrl || null, generatedAt: new Date(), html }
  }

  async getReportUrl(auditId: string) {
    const { data: audit } = await supabase
      .from('audits')
      .select('report_pdf_url, report_generated_at')
      .eq('id', auditId)
      .maybeSingle()

    if (!audit) throw new ApiError('Audit not found', 404)
    if (!audit.report_pdf_url) throw new ApiError('Report not yet generated', 404)

    return { url: audit.report_pdf_url, generatedAt: audit.report_generated_at }
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
      ${(audit.sections || []).map((s: any) => `<tr><td>${s.section.replace(/_/g, ' ')}</td><td>${s.score}/5</td></tr>`).join('')}
    </table>

    <h2>Issues (${(audit.issues || []).length})</h2>
    <table>
      <tr><th>Category</th><th>Severity</th><th>Title</th></tr>
      ${(audit.issues || []).map((i: any) => `<tr><td>${i.category}</td><td>${i.severity}</td><td>${i.title}</td></tr>`).join('')}
    </table>

    <h2>Recommendations (${(audit.recommendations || []).length})</h2>
    ${(audit.recommendations || []).map((r: any) => `
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
