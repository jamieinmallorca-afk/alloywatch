'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'
import { ArrowLeft, Pin, PinOff, Download, AlertTriangle, ExternalLink } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Material {
  id: string
  slug: string
  name: string
  category: string
  subcategory: string | null
  description: string | null
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  baseline_lead_wks_min: number | null
  baseline_lead_wks_max: number | null
  primary_applications: string[] | null
  primary_countries: string[] | null
  uns_number: string | null
}

interface LeadTime {
  id: string
  weeks_min: number
  weeks_max: number
  weeks_avg: number | null
  source: string
  confidence: string | null
  form: string | null
  notes: string | null
  recorded_at: string
}

interface Alert {
  id: string
  alert_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  summary: string | null
  source_url: string | null
  created_at: string
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const RISK_COLORS: Record<string, string> = {
  low:      'bg-green-900/60 text-green-300 border border-green-700',
  medium:   'bg-yellow-900/60 text-yellow-300 border border-yellow-700',
  high:     'bg-orange-900/60 text-orange-300 border border-orange-700',
  critical: 'bg-red-900/60 text-red-300 border border-red-700',
}

const SEVERITY_COLORS: Record<string, string> = {
  low:      'text-green-400',
  medium:   'text-yellow-400',
  high:     'text-orange-400',
  critical: 'text-red-400',
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function extractSupplier(notes: string | null): string {
  if (!notes) return '—'
  const match = notes.match(/^Supplier:\s*([^.]+)/)
  return match ? match[1].trim() : '—'
}

// ── Sparkline chart ────────────────────────────────────────────────────────────

function LeadTimeChart({ data }: { data: LeadTime[] }) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center h-40 text-zinc-500 text-sm">
        Not enough data points to render a trend chart yet.
      </div>
    )
  }

  const W = 800
  const H = 160
  const PAD = { top: 16, right: 16, bottom: 32, left: 40 }

  const avgValues = data.map(d => d.weeks_avg ?? ((d.weeks_min + d.weeks_max) / 2))
  const minVals   = data.map(d => d.weeks_min)
  const maxVals   = data.map(d => d.weeks_max)

  const allVals = [...avgValues, ...minVals, ...maxVals]
  const yMin = Math.floor(Math.min(...allVals) * 0.9)
  const yMax = Math.ceil(Math.max(...allVals) * 1.1)
  const yRange = yMax - yMin || 1

  const xScale = (i: number) => PAD.left + (i / (data.length - 1)) * (W - PAD.left - PAD.right)
  const yScale = (v: number) => PAD.top + (1 - (v - yMin) / yRange) * (H - PAD.top - PAD.bottom)

  const bandTop    = data.map((d, i) => `${xScale(i).toFixed(1)},${yScale(d.weeks_max).toFixed(1)}`).join(' ')
  const bandBottom = [...data].reverse().map((d, i) => `${xScale(data.length - 1 - i).toFixed(1)},${yScale(d.weeks_min).toFixed(1)}`).join(' ')
  const bandPoly   = bandTop + ' ' + bandBottom

  const avgLine = avgValues.map((v, i) => `${xScale(i).toFixed(1)},${yScale(v).toFixed(1)}`).join(' ')

  const ticks = 4
  const yTicks = Array.from({ length: ticks + 1 }, (_, i) => yMin + (yRange * i) / ticks)
  const xLabels = [0, Math.floor((data.length - 1) / 2), data.length - 1]

  const trend = avgValues[avgValues.length - 1] - avgValues[0]
  const lineColor = trend > 2 ? '#f87171' : trend < -2 ? '#34d399' : '#60a5fa'
  const bandColor = trend > 2 ? '#f8717115' : trend < -2 ? '#34d39915' : '#60a5fa15'

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '160px' }} aria-label="Lead time trend chart">
      {yTicks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.left} y1={yScale(t).toFixed(1)} x2={W - PAD.right} y2={yScale(t).toFixed(1)} stroke="#2a2a2a" strokeWidth="1" />
          <text x={PAD.left - 6} y={yScale(t)} fill="#71717a" fontSize="10" textAnchor="end" dominantBaseline="middle">{Math.round(t)}w</text>
        </g>
      ))}
      <polygon points={bandPoly} fill={bandColor} />
      <polyline points={avgLine} fill="none" stroke={lineColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {avgValues.map((v, i) => (<circle key={i} cx={xScale(i)} cy={yScale(v)} r="3" fill={lineColor} />))}
      {xLabels.map(i => (
        <text key={i} x={xScale(i)} y={H - 4} fill="#71717a" fontSize="10" textAnchor="middle">{formatDate(data[i].recorded_at)}</text>
      ))}
    </svg>
  )
}

// ── CSV export ─────────────────────────────────────────────────────────────────

function exportCSV(material: Material, leadTimes: LeadTime[]) {
  const headers = ['Supplier', 'Form', 'Min Weeks', 'Max Weeks', 'Avg Weeks', 'Confidence', 'Source', 'Date', 'Notes']
  const rows = leadTimes.map(lt => [
    extractSupplier(lt.notes),
    lt.form ?? '',
    lt.weeks_min,
    lt.weeks_max,
    lt.weeks_avg?.toFixed(1) ?? ((lt.weeks_min + lt.weeks_max) / 2).toFixed(1),
    lt.confidence ?? '',
    lt.source,
    formatDate(lt.recorded_at),
    (lt.notes ?? '').replace(/^Supplier:[^.]+\.\s*/, '').replace(/,/g, ';'),
  ])
  const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `alloywatch-${material.slug}-lead-times.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function MaterialDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
  )

  const [material, setMaterial]     = useState<Material | null>(null)
  const [leadTimes, setLeadTimes]   = useState<LeadTime[]>([])
  const [alerts, setAlerts]         = useState<Alert[]>([])
  const [loading, setLoading]       = useState(true)
  const [pinned, setPinned]         = useState(false)
  const [pinLoading, setPinLoading] = useState(false)
  const [isPro, setIsPro]           = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }

    const [detailRes, profileRes, watchlistRes] = await Promise.all([
      fetch(`/api/materials/${slug}`).then(r => r.json()),
      fetch('/api/profile').then(r => r.json()),
      fetch('/api/watchlist').then(r => r.json()),
    ])

    if (detailRes.error) { router.replace('/dashboard'); return }

    setMaterial(detailRes.material)
    setLeadTimes(detailRes.leadTimes ?? [])
    setAlerts(detailRes.alerts ?? [])
    setIsPro(profileRes.plan === 'pro' || profileRes.plan === 'enterprise')

    const watchedIds = new Set((watchlistRes.watchlist ?? []).map((w: { material_id: string }) => w.material_id))
    setPinned(watchedIds.has(detailRes.material.id))
    setLoading(false)
  }, [slug]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load() }, [load])

  async function togglePin() {
    if (!material) return
    setPinLoading(true)
    if (pinned) {
      await fetch('/api/watchlist', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ material_id: material.id }) })
      setPinned(false)
    } else {
      const res = await fetch('/api/watchlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ material_id: material.id }) })
      if (res.ok) setPinned(true)
    }
    setPinLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-500 text-sm animate-pulse">Loading…</div>
      </div>
    )
  }

  if (!material) return null

  const avgLeadTime = leadTimes.length > 0
    ? Math.round(leadTimes.reduce((s, lt) => s + (lt.weeks_avg ?? (lt.weeks_min + lt.weeks_max) / 2), 0) / leadTimes.length)
    : null

  const latestLt = [...leadTimes].sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0]

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2 text-zinc-400 hover:text-zinc-100 text-sm transition-colors">
            <ArrowLeft size={16} />Dashboard
          </button>
          <span className="text-zinc-700">|</span>
          <span className="text-zinc-300 font-medium">{material.name}</span>
        </div>
        <div className="flex items-center gap-3">
          {isPro && (
            <button onClick={() => exportCSV(material, leadTimes)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm transition-colors">
              <Download size={14} />Export CSV
            </button>
          )}
          <button onClick={togglePin} disabled={pinLoading} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${pinned ? 'bg-emerald-900/40 text-emerald-400 hover:bg-emerald-900/60' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100'}`}>
            {pinned ? <Pin size={14} /> : <PinOff size={14} />}
            {pinned ? 'Watching' : 'Watch'}
          </button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-zinc-500 uppercase tracking-widest">{material.category}</span>
            {material.uns_number && (<span className="text-xs text-zinc-600 font-mono">UNS {material.uns_number}</span>)}
          </div>
          <h1 className="text-3xl font-bold text-zinc-50">{material.name}</h1>
          {material.description && (<p className="text-zinc-400 text-sm leading-relaxed max-w-2xl">{material.description}</p>)}
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${RISK_COLORS[material.risk_level]}`}>
              {material.risk_level.charAt(0).toUpperCase() + material.risk_level.slice(1)} Risk
            </span>
            {material.primary_countries?.map(c => (
              <span key={c} className="px-2.5 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-400 border border-zinc-700">⚑ {c}</span>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-xs text-zinc-500 mb-1">Baseline Range</div>
            <div className="text-xl font-bold text-zinc-100">{material.baseline_lead_wks_min ?? '?'}–{material.baseline_lead_wks_max ?? '?'}<span className="text-sm font-normal text-zinc-400 ml-1">wks</span></div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-xs text-zinc-500 mb-1">Current Avg</div>
            <div className="text-xl font-bold text-zinc-100">{avgLeadTime ?? '—'}{avgLeadTime && <span className="text-sm font-normal text-zinc-400 ml-1">wks</span>}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-xs text-zinc-500 mb-1">Data Points</div>
            <div className="text-xl font-bold text-zinc-100">{leadTimes.length}</div>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="text-xs text-zinc-500 mb-1">Last Updated</div>
            <div className="text-sm font-medium text-zinc-100">{latestLt ? formatDate(latestLt.recorded_at) : '—'}</div>
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-zinc-300">Lead Time Trend</h2>
            <span className="text-xs text-zinc-600">Shaded band = min–max range</span>
          </div>
          <LeadTimeChart data={leadTimes} />
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-semibold text-zinc-300">Lead Time Data</h2>
            {!isPro && (<span className="text-xs text-zinc-500"><a href="/pricing" className="text-emerald-400 hover:underline">Upgrade to Pro</a> to export CSV</span>)}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Supplier</th>
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Form</th>
                  <th className="text-right px-4 py-3 text-xs text-zinc-500 font-medium">Min</th>
                  <th className="text-right px-4 py-3 text-xs text-zinc-500 font-medium">Max</th>
                  <th className="text-right px-4 py-3 text-xs text-zinc-500 font-medium">Avg</th>
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Confidence</th>
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Source</th>
                  <th className="text-left px-4 py-3 text-xs text-zinc-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {[...leadTimes].sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()).map((lt, i) => (
                  <tr key={lt.id} className={`border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${i % 2 === 0 ? '' : 'bg-zinc-900/50'}`}>
                    <td className="px-4 py-3 text-zinc-300 font-medium">{extractSupplier(lt.notes)}</td>
                    <td className="px-4 py-3 text-zinc-400 capitalize">{lt.form ?? '—'}</td>
                    <td className="px-4 py-3 text-zinc-300 text-right">{lt.weeks_min}w</td>
                    <td className="px-4 py-3 text-zinc-300 text-right">{lt.weeks_max}w</td>
                    <td className="px-4 py-3 text-zinc-400 text-right">{lt.weeks_avg ? `${lt.weeks_avg.toFixed(0)}w` : `${((lt.weeks_min + lt.weeks_max) / 2).toFixed(0)}w`}</td>
                    <td className="px-4 py-3">
                      <span className={`capitalize text-xs font-medium ${lt.confidence === 'high' ? 'text-green-400' : lt.confidence === 'medium' ? 'text-yellow-400' : 'text-zinc-500'}`}>{lt.confidence ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500 capitalize text-xs">{lt.source}</td>
                    <td className="px-4 py-3 text-zinc-500 text-xs whitespace-nowrap">{formatDate(lt.recorded_at)}</td>
                  </tr>
                ))}
                {leadTimes.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-8 text-center text-zinc-600 text-sm">No lead time data yet — be the first to <button onClick={() => router.push('/dashboard?tab=submit')} className="text-emerald-400 hover:underline">submit intel</button>.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {material.primary_applications && material.primary_applications.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-sm font-semibold text-zinc-300 mb-3">Primary Applications</h2>
            <div className="flex flex-wrap gap-2">
              {material.primary_applications.map(app => (
                <span key={app} className="px-3 py-1 rounded-full bg-zinc-800 text-zinc-400 text-xs border border-zinc-700">{app}</span>
              ))}
            </div>
          </div>
        )}
        {alerts.length > 0 && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-zinc-800"><h2 className="text-sm font-semibold text-zinc-300">Supply Alerts</h2></div>
            <div className="divide-y divide-zinc-800">
              {alerts.map(alert => (
                <div key={alert.id} className="px-6 py-4 hover:bg-zinc-800/30 transition-colors">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={14} className={`mt-0.5 flex-shrink-0 ${SEVERITY_COLORS[alert.severity]}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-semibold uppercase ${SEVERITY_COLORS[alert.severity]}`}>{alert.severity}</span>
                        <span className="text-xs text-zinc-600">{formatDate(alert.created_at)}</span>
                      </div>
                      <p className="text-sm font-medium text-zinc-200">{alert.title}</p>
                      {alert.summary && (<p className="text-xs text-zinc-500 mt-1 leading-relaxed">{alert.summary}</p>)}
                      {alert.source_url && (
                        <a href={alert.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:underline mt-1">
                          Source <ExternalLink size={10} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
