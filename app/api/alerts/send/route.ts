import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'
import { resend, buildAlertEmail } from '@/lib/resend'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  // Auth: Vercel Cron sets Authorization: Bearer <CRON_SECRET>
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET ?? process.env.SCRAPER_CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = createSupabaseServiceClient()

  // 1. Fetch alerts from the last 24 hours (high + critical, active)
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: recentAlerts, error: alertsError } = await service
    .from('alerts')
    .select('id, material_id, alert_type, severity, title, summary, source_url, created_at')
    .in('severity', ['high', 'critical'])
    .eq('is_active', true)
    .gte('created_at', since)

  if (alertsError) {
    console.error('Failed to fetch alerts:', alertsError.message)
    return NextResponse.json({ error: alertsError.message }, { status: 500 })
  }

  if (!recentAlerts || recentAlerts.length === 0) {
    console.log('No high/critical alerts in last 24h — nothing to send')
    return NextResponse.json({ sent: 0, reason: 'no_alerts' })
  }

  // 2. Get all profiles with alert_email = true
  const { data: profiles, error: profilesError } = await service
    .from('profiles')
    .select('id')
    .eq('alert_email', true)

  if (profilesError) {
    console.error('Failed to fetch profiles:', profilesError.message)
    return NextResponse.json({ error: profilesError.message }, { status: 500 })
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0, reason: 'no_subscribers' })
  }

  // 3. For each profile, load their watchlist and send filtered alerts
  let sent = 0
  for (const profile of profiles) {
    try {
      // Get this user's watched material IDs
      const { data: watchlist } = await service
        .from('watchlists')
        .select('material_id')
        .eq('user_id', profile.id)

      if (!watchlist || watchlist.length === 0) continue

      const watchedIds = new Set(watchlist.map((w) => w.material_id))

      // Filter alerts to only those on this user's watchlist
      const userAlerts = recentAlerts.filter((a) => watchedIds.has(a.material_id))
      if (userAlerts.length === 0) continue

      // Get user's email via admin API
      const { data: { user }, error: userError } = await service.auth.admin.getUserById(profile.id)
      if (userError || !user?.email) {
        console.warn(`Could not get email for user ${profile.id}:`, userError?.message)
        continue
      }

      const emailPayload = buildAlertEmail(userAlerts)
      const { error: sendError } = await resend.emails.send({
        from: 'AlloyWatch Alerts <alerts@alloywatch.io>',
        to: user.email,
        subject: emailPayload.subject,
        html: emailPayload.html,
      })

      if (sendError) {
        console.error(`Failed to send to ${user.email}:`, sendError)
      } else {
        sent++
        console.log(`Sent ${userAlerts.length} alerts to ${user.email}`)
      }
    } catch (err) {
      console.error(`Error processing profile ${profile.id}:`, err)
    }
  }

  return NextResponse.json({ sent })
}
