import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase-server'

const FREE_WATCHLIST_LIMIT = 5

export async function GET() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('watchlists')
    .select(`
      material_id,
      alert_threshold_weeks,
      materials (
        id, slug, name, category, risk_level,
        baseline_lead_wks_min, baseline_lead_wks_max
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ watchlist: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { material_id, alert_threshold_weeks } = (await req.json()) as {
    material_id: string
    alert_threshold_weeks?: number
  }

  if (!material_id) return NextResponse.json({ error: 'material_id required' }, { status: 400 })

  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Enforce free tier limit
  const service = createSupabaseServiceClient()
  const { data: profile } = await service
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (!profile || profile.plan === 'free') {
    const { count } = await supabase
      .from('watchlists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if ((count ?? 0) >= FREE_WATCHLIST_LIMIT) {
      return NextResponse.json(
        { error: `Free plan limited to ${FREE_WATCHLIST_LIMIT} materials — upgrade to Pro for unlimited` },
        { status: 403 }
      )
    }
  }

  const { error } = await supabase.from('watchlists').upsert(
    { user_id: user.id, material_id, alert_threshold_weeks: alert_threshold_weeks ?? null },
    { onConflict: 'user_id,material_id' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const { material_id } = (await req.json()) as { material_id: string }
  if (!material_id) return NextResponse.json({ error: 'material_id required' }, { status: 400 })

  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { error } = await supabase
    .from('watchlists')
    .delete()
    .eq('user_id', user.id)
    .eq('material_id', material_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
