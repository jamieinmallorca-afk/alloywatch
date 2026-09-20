import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { material_id, weeks_min, weeks_max, supplier_name, form, notes, confidence } = body

  if (!material_id || !weeks_min || !weeks_max) {
    return NextResponse.json(
      { error: 'material_id, weeks_min, and weeks_max are required' },
      { status: 400 }
    )
  }

  if (Number(weeks_min) > Number(weeks_max)) {
    return NextResponse.json(
      { error: 'weeks_min must be ≤ weeks_max' },
      { status: 400 }
    )
  }

  // Try user_submissions first (actual live table per session context),
  // fall back to crowdsource_submissions (schema.sql reference)
  const insertData = {
    material_id,
    weeks_min: Number(weeks_min),
    weeks_max: Number(weeks_max),
    supplier_name: supplier_name?.trim() || null,
    form: form || null,
    notes: notes?.trim() || null,
    confidence: confidence || 'medium',
    user_id: user.id,
    status: 'pending',
  }

  let { error } = await supabase.from('user_submissions').insert(insertData)

  if (error) {
    // Fallback: try crowdsource_submissions with its column names
    const fallback = await supabase.from('crowdsource_submissions').insert({
      material_id,
      supplier_name: supplier_name?.trim() || '(anonymous)',
      lead_time_min_weeks: Number(weeks_min),
      lead_time_max_weeks: Number(weeks_max),
      submitter_id: user.id,
      submitter_company: notes?.trim() || null,
    })
    if (fallback.error) {
      console.error('Failed to insert submission:', fallback.error.message)
      return NextResponse.json({ error: fallback.error.message }, { status: 500 })
    }
  }

  return NextResponse.json({ ok: true })
}
