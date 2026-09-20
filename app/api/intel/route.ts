import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'
export const revalidate = 3600

// Static geopolitical risk summaries keyed by material category
const GEO_SUMMARIES: Record<string, { headline: string; detail: string; severity: string }> = {
  'superalloy': {
    headline: 'Nickel & cobalt supply under pressure',
    detail: 'Indonesian ore export restrictions and DRC political instability are tightening global cobalt supply. Nickel prices remain elevated following Philippines mine suspensions. Recommend qualifying alternate EU-based refined sources.',
    severity: 'high',
  },
  'refractory': {
    headline: 'Tungsten export controls tighten',
    detail: 'China announced new export licensing requirements for tungsten carbide powder. Secondary sources in Vietnam and Canada have 6–8 month qualification timelines. Stockpiling recommended for mission-critical applications.',
    severity: 'critical',
  },
  'specialty-steel': {
    headline: 'Ferro-chrome markets stabilize',
    detail: 'South African power availability has improved; Kazakh output recovering. Spot premiums for 17-4 PH and 15-5 PH bar have eased 8–12% from Q1 peaks. Lead times trending flat to slightly down.',
    severity: 'medium',
  },
  'rare-earth': {
    headline: 'Rare earth processing bottleneck persists',
    detail: 'Despite new Australian mining capacity, separation and processing remains 85% China-controlled. US DoD-funded MP Materials expansion not expected online until late 2026. Critical defense supply risk remains elevated.',
    severity: 'critical',
  },
  'precious-metal': {
    headline: 'Platinum group metals tightening',
    detail: 'South African load-shedding reduced PGM output by ~6% in H1. Palladium substitution with platinum continues in automotive, adding demand pressure. Recycling supply partially offsetting primary shortfalls.',
    severity: 'high',
  },
  'titanium': {
    headline: 'Titanium sponge supply diversifying',
    detail: 'Russian VSMPO-AVISMA sanctions have accelerated qualification of Japanese (TOHO, Osaka Titanium) and US (TIMET, ATI) sources. Lead times for Grade 5 bar remain elevated at 22–30 weeks. Japanese sources currently best availability.',
    severity: 'high',
  },
  'copper': {
    headline: 'Copper supply broadly adequate',
    detail: 'Chilean output recovering after Codelco operational issues in 2023. Demand headwinds from China construction slowdown. Beryllium-copper alloys remain tight due to limited beryllium processing outside US (NGK Japan is main alternative).',
    severity: 'low',
  },
}

// Supplier health signals (simulated job posting / capacity indicators)
const SUPPLIER_SIGNALS: Array<{
  supplier: string
  signal: string
  type: 'positive' | 'negative' | 'neutral'
  detail: string
  timestamp: string
}> = [
  {
    supplier: 'Carpenter Technology',
    signal: '23 open engineering roles',
    type: 'positive',
    detail: 'Significant hiring in melt shop operations and quality engineering suggests capacity expansion underway. Strong indicator of increased throughput within 6–12 months.',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    supplier: 'Haynes International',
    signal: 'Lead times extended 4–6 weeks',
    type: 'negative',
    detail: 'Customer reports on ImportYeti show Haynes quoting 28–36 weeks on HASTELLOY C-276 plate vs. historical 22–28 weeks. Alloyed to order only for quantities under 500 lbs.',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    supplier: 'Special Metals (PCC)',
    signal: 'New VIM furnace commissioned',
    type: 'positive',
    detail: 'PCC announced commissioning of a second VIM furnace at Huntington, WV facility. Expected to add 15% Inconel 718 billet capacity by Q3. Favorable signal for aerospace supply availability.',
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    supplier: 'VSMPO-AVISMA',
    signal: 'Sanctions enforcement tightening',
    type: 'negative',
    detail: 'EU and UK tightening enforcement of secondary sanctions on Russian titanium. Spot material transshipped via UAE now subject to enhanced scrutiny. Recommend full supply chain audit for any Ti-6Al-4V material sourced 2022–present.',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    supplier: 'ATI Inc.',
    signal: 'Titanium capacity fully booked Q3',
    type: 'neutral',
    detail: 'ATI reported in earnings call that aerospace titanium is sold out through Q3. Medical and industrial slots available. New orders quoting Q4+ delivery. Existing LTAs being honored.',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    supplier: 'Materion',
    signal: '6 new job postings in Ohio facility',
    type: 'positive',
    detail: 'Materion (beryllium, beryllium-copper) posting for furnace operators and process engineers at Elmore, OH. Typically precedes capacity increases by 3–6 months.',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
]

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json({
    geo_summaries: Object.entries(GEO_SUMMARIES).map(([category, data]) => ({
      category,
      ...data,
    })),
    supplier_signals: SUPPLIER_SIGNALS,
    updated_at: new Date().toISOString(),
  })
}
