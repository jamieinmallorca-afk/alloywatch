import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

type AlertRow = {
  title: string
  severity: string
  summary?: string | null
  material_name?: string | null
}

export function buildAlertEmail(
  alerts: AlertRow[]
): { subject: string; html: string } {
  const critCount    = alerts.filter(a => a.severity === 'critical').length
  const highCount    = alerts.filter(a => a.severity === 'high').length
  const topSeverity  = critCount > 0 ? 'critical' : highCount > 0 ? 'high' : 'medium'

  const subject =
    topSeverity === 'critical'
      ? `[AlloyWatch] ${critCount} critical supply alert${critCount > 1 ? 's' : ''}`
      : `[AlloyWatch] ${alerts.length} supply alert${alerts.length > 1 ? 's' : ''} on your watchlist`

  const badge = (sev: string) => ({
    critical: '#dc2626', high: '#ea580c', medium: '#d97706', low: '#65a30d',
  }[sev] ?? '#6b7280')

  const rows = alerts
    .map(a => `<tr><td style="padding:14px 20px;border-bottom:1px solid #1f2937;vertical-align:top;">
      <div style="margin-bottom:6px;"><span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:700;color:#fff;background:${badge(a.severity)};text-transform:uppercase;">${a.severity}</span>${a.material_name ? `<span style="margin-left:8px;font-size:12px;color:#6b7280;">${a.material_name}</span>` : ''}</div>
      <div style="font-size:14px;font-weight:600;color:#e8f0eb;line-height:1.4;margin-bottom:4px;">${a.title}</div>
      ${a.summary ? `<div style="font-size:13px;color:#9ca3af;line-height:1.5;">${a.summary}</div>` : ''}
    </td></tr>`)
    .join('')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://alloywatch.io'

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>${subject}</title></head>
<body style="margin:0;padding:0;background:#080c0a;font-family:system-ui,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    <tr><td align="center" style="padding:40px 16px;">
      <table role="presentation" width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">
        <tr><td style="padding:0 0 28px;"><span style="font-size:20px;font-weight:700;color:#e8f0eb;">AlloyWatch</span><span style="font-size:12px;color:#6b7280;margin-left:8px;">Supply chain intelligence</span></td></tr>
        <tr><td style="padding:0 0 16px;"><h1 style="margin:0;font-size:22px;font-weight:700;color:#e8f0eb;">${alerts.length} new alert${alerts.length > 1 ? 's' : ''} on your watchlist</h1></td></tr>
        <tr><td><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0d1117;border-radius:10px;border:1px solid #1f2937;">${rows}</table></td></tr>
        <tr><td style="padding:28px 0 0;text-align:center;"><a href="${appUrl}/dashboard" style="display:inline-block;padding:13px 28px;background:#10b981;color:#fff;text-decoration:none;border-radius:7px;font-size:14px;font-weight:700;">View dashboard</a></td></tr>
        <tr><td style="padding:20px 0 0;text-align:center;font-size:12px;color:#4b5563;"><a href="${appUrl}/dashboard" style="color:#4b5563;">Manage alert preferences</a> &nbsp; AlloyWatch</td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`

  return { subject, html }
                                     }
