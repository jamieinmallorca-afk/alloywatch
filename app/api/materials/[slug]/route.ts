import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const revalidate = 1800

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const supabase = createSupabaseServiceClient()

  const { data: material, error: materialError } = await supabase
    .from('materials')
    .select('id,slug,name,category,subcategory,description,risk_level,baseline_lead_wks_min,baseline_lead_wks_max,primary_applications,primary_countries,uns_number')
    .eq('slug', params.slug)
    .single()

  if (materialError || !material) {
    return NextResponse.json({ error: 'Material not found' }, { status: 404 })
  }

  const [leadTimesRes, alertsRes] = await Promise.all([
    supabase
      .from('lead_times')
      .select('id,weeks_min,weeks_max,weeks_avg,source,confidence,form,notes,recorded_at')
      .eq('material_id', material.id)
      .order('recorded_at', { ascending: true }),

    supabase
      .from('alerts')
      .select('id,alert_type,severity,title,summary,source_url,created_at')
      .eq('material_id', material.id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  return NextResponse.json({
    material,
    leadTimes: leadTimesRes.data ?? [],
    alerts: alertsRes.data ?? [],
  })
}
