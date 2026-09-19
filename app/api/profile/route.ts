import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient, createSupabaseServiceClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const service = createSupabaseServiceClient()
  const { data } = await service
    .from('profiles')
    .select('plan, alert_email, stripe_customer_id')
    .eq('id', user.id)
    .single()

  // Auto-create profile if missing (race condition on first login)
  if (!data) {
    await service.from('profiles').upsert({ id: user.id })
    return NextResponse.json({ plan: 'free', alert_email: true })
  }

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const body = (await req.json()) as Record<string, unknown>

  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Whitelist patchable fields from client
  const ALLOWED: (keyof typeof body)[] = ['alert_email']
  const update = Object.fromEntries(
    Object.entries(body).filter(([k]) => ALLOWED.includes(k))
  )
  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
  }

  const service = createSupabaseServiceClient()
  const { error } = await service
    .from('profiles')
    .upsert({ id: user.id, ...update })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
