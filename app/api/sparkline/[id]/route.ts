import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServiceClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const revalidate = 3600 // 1 hour

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServiceClient()

  // Fetch last 12 lead_time records for this material, ordered by date
  const { data, error } = await supabase
    .from('lead_times')
    .select('weeks_avg, weeks_min, weeks_max, recorded_at')
    .eq('material_id', params.id)
    .order('recorded_at', { ascending: true })
    .limit(12)

  if (error || !data || data.length === 0) {
    // Return a flat line placeholder SVG
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="24" viewBox="0 0 80 24">
      <line x1="4" y1="12" x2="76" y2="12" stroke="#2d4a3a" stroke-width="1.5" stroke-linecap="round"/>
    </svg>`
    return new NextResponse(svg, {
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' },
    })
  }

  const values = data.map(d => Number(d.weeks_avg ?? ((Number(d.weeks_min) + Number(d.weeks_max)) / 2)))
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)
  const range = maxVal - minVal || 1

  const W = 80
  const H = 24
  const PAD = 3

  // Map values to SVG coordinates
  const points = values.map((v, i) => {
    const x = PAD + (i / (values.length - 1)) * (W - PAD * 2)
    const y = H - PAD - ((v - minVal) / range) * (H - PAD * 2)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const polyline = points.join(' ')

  // Color based on trend: compare first vs last
  const trend = values[values.length - 1] - values[0]
  const lineColor = trend > 1 ? '#f87171' : trend < -1 ? '#34d399' : '#60a5fa'
  const fillColor = trend > 1 ? '#f8717120' : trend < -1 ? '#34d39920' : '#60a5fa20'

  // Build fill polygon (close below the line)
  const firstPoint = points[0].split(',')
  const lastPoint = points[points.length - 1].split(',')
  const fillPoly = `${polyline} ${lastPoint[0]},${H - PAD} ${firstPoint[0]},${H - PAD}`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <polygon points="${fillPoly}" fill="${fillColor}" stroke="none"/>
  <polyline points="${polyline}" fill="none" stroke="${lineColor}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="${lastPoint[0]}" cy="${lastPoint[1]}" r="2" fill="${lineColor}"/>
</svg>`

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
