'use client'

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { Bell, BellOff, Pin, PinOff, AlertTriangle, ChevronDown, LogOut, Zap, Send } from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Material {
  id: string
  slug: string
  name: string
  category: string
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  baseline_lead_wks_min: number | null
  baseline_lead_wks_max: number | null
}

interface WatchlistEntry {
  material_id: string
  alert_threshold_weeks: number | null
  materials: Material
}

interface Alert {
  id: string
  material_id: string
  alert_type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  summary: string | null
  source_url: string | null
  created_at: string
  materials?: { name: string }
}

interface Profile {
  plan: 'free' | 'pro' | 'enterprise'
  alert_email: boolean
  stripe_customer_id: string | null
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const RISK_COLORS: Record<string, string> = {
  low:      'bg-green-900 text-green-300',
  medium:   'bg-yellow-900 text-yellow-300',
  high:     'bg-orange-900 text-orange-300',
  critical: 'bg-red-900 text-red-300',
}

const FREE_LIMIT = 5

function riskLabel(r: string) {
  return r.charAt(0).toUpperCase() + r.slice(1)
}

function leadRange(min: number | null, max: number | null) {
  if (min == null && max == null) return '—'
  if (min == null) return `≤${max}w`
  if (max == null) return `${min}w+`
  return `${min}–${max}w`
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder_anon_key'
  )

  const [materials, setMaterials]   = useState<Material[]>([])
  const [watchlist, setWatchlist]   = useState<WatchlistEntry[]>([])
  const [alerts, setAlerts]         = useState<Alert[]>([])
  const [profile, setProfile]       = useState<Profile | null>(null)
  const [tab, setTab]               = useState<'watchlist' | 'all' | 'alerts' | 'submit' | 'intel'>('watchlist')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'high'>('all')
  const [loading, setLoading]       = useState(true)
  const [pinLoading, setPinLoading] = useState<string | null>(null)
  const [upgradeMsg, setUpgradeMsg] = useState<string | null>(null)
  const [userEmail, setUserEmail]   = useState<string | null>(null)

  // ── Supplier intel ───────────────────────────────────────────────────────────
  const [intelData, setIntelData] = useState<{
    geo_summaries: Array<{ category: string; headline: string; detail: string; severity: string }>
    supplier_signals: Array<{ supplier: string; signal: string; type: string; detail: string; timestamp: string }>
    updated_at: string
  } | null>(null)
  const [intelLoading, setIntelLoading] = useState(false)

  // ── Lead time submission form ─────────────────────────────────────────────────
  const [submitMaterialId, setSubmitMaterialId] = useState('')
  const [submitMin, setSubmitMin]   = useState('')
  const [submitMax, setSubmitMax]   = useState('')
  const [submitSupplier, setSubmitSupplier] = useState('')
  const [submitForm, setSubmitForm] = useState('')
  const [submitNotes, setSubmitNotes] = useState('')
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')

  // ── Auth ─────────────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }
      setUserEmail(user.email ?? null)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Upgraded / cancelled banner ───────────────────────────────────────────────

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const upgradeParam = params.get('upgrade')
    if (upgradeParam === 'success') {
      setUpgradeMsg('🎉 You\'re now upgraded — unlimited watchlist & priority alerts!')
      window.history.replaceState({}, '', '/dashboard')
    } else if (upgradeParam === 'cancelled') {
      setUpgradeMsg('Upgrade cancelled — you\'re still on your current plan.')
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [])

  // ── Data loading ──────────────────────────────────────────────────────────────

  const loadData = useCallback(async () => {
    setLoading(true)
    const [materialsRes, watchlistRes, alertsRes, profileRes] = await Promise.all([
      supabase.from('materials').select('id,slug,name,category,risk_level,baseline_lead_wks_min,baseline_lead_wks_max').order('name'),
      fetch('/api/watchlist').then(r => r.json()),
      supabase.from('alerts').select('id,material_id,alert_type,severity,title,summary,source_url,created_at,materials(name)').eq('is_active', true).order('created_at', { ascending: false }).limit(100),
      fetch('/api/profile').then(r => r.json()),
    ])

    if (materialsRes.data) setMaterials(materialsRes.data)
    if (watchlistRes.watchlist) setWatchlist(watchlistRes.watchlist)
    if (alertsRes.data) setAlerts(alertsRes.data as unknown as Alert[])
    if (profileRes.plan) setProfile(profileRes as Profile)
    setLoading(false)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { loadData() }, [loadData])

  // ── Derived state ─────────────────────────────────────────────────────────────

  const watchedIds = new Set(watchlist.map(w => w.material_id))

  // Deduplicate alerts by title + material_id (guard against scraper inserting duplicates)
  const deduplicatedAlerts = alerts.filter((a, idx, arr) =>
    arr.findIndex(x => x.title === a.title && x.material_id === a.material_id) === idx
  )

  const alertCountByMaterial = deduplicatedAlerts.reduce<Record<string, number>>((acc, a) => {
    acc[a.material_id] = (acc[a.material_id] ?? 0) + 1
    return acc
  }, {})

  const visibleAlerts = deduplicatedAlerts.filter(a => {
    if (!watchedIds.has(a.material_id)) return false
    if (severityFilter === 'critical') return a.severity === 'critical'
    if (severityFilter === 'high') return ['critical', 'high'].includes(a.severity)
    return true
  })

  // ── Actions ───────────────────────────────────────────────────────────────────

  async function togglePin(materialId: string) {
    setPinLoading(materialId)
    setUpgradeMsg(null)
    try {
      if (watchedIds.has(materialId)) {
        await fetch('/api/watchlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ material_id: materialId }),
        })
      } else {
        const res = await fetch('/api/watchlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ material_id: materialId }),
        })
        if (res.status === 403) {
          const { error } = await res.json()
          setUpgradeMsg(error)
          return
        }
      }
      await loadData()
    } finally {
      setPinLoading(null)
    }
  }

  async function toggleAlertEmail() {
    if (!profile) return
    const next = !profile.alert_email
    setProfile({ ...profile, alert_email: next })
    await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alert_email: next }),
    })
  }

  async function startUpgrade(plan: 'pro' | 'enterprise') {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const { url, error } = await res.json()
    if (error) { setUpgradeMsg(error); return }
    if (url) window.location.href = url
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  async function loadIntel() {
    if (intelData || intelLoading) return
    setIntelLoading(true)
    try {
      const res = await fetch('/api/intel')
      if (res.ok) setIntelData(await res.json())
    } finally {
      setIntelLoading(false)
    }
  }

  async function handleSubmitLeadTime(e: React.FormEvent) {
    e.preventDefault()
    setSubmitStatus('sending')
    try {
      const res = await fetch('/api/submit-lead-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          material_id: submitMaterialId,
          weeks_min: Number(submitMin),
          weeks_max: Number(submitMax),
          supplier_name: submitSupplier,
          form: submitForm,
          notes: submitNotes,
          confidence: 'medium',
        }),
      })
      if (res.ok) {
        setSubmitStatus('ok')
        setSubmitMaterialId(''); setSubmitMin(''); setSubmitMax('')
        setSubmitSupplier(''); setSubmitForm(''); setSubmitNotes('')
        setTimeout(() => setSubmitStatus('idle'), 4000)
      } else {
        setSubmitStatus('err')
      }
    } catch {
      setSubmitStatus('err')
    }
  }

  // ── Render helpers ────────────────────────────────────────────────────────────

  const isFree = !profile || profile.plan === 'free'

  const displayedMaterials = tab === 'watchlist'
    ? materials.filter(m => watchedIds.has(m.id))
    : materials

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c0a] flex items-center justify-center">
        <div className="text-[#a3b3a8] animate-pulse">Loading…</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080c0a] text-[#d4e0d8]">
      {/* ── Header ── */}
      <header className="border-b border-[#1e2e28] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[#30d98a] font-bold text-xl tracking-tight">AlloyWatch</span>
          {profile && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase ${
              profile.plan === 'free'
                ? 'bg-[#1e2e28] text-[#6b8f7d]'
                : 'bg-[#0d3d24] text-[#30d98a]'
            }`}>
              {profile.plan}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {userEmail && <span className="text-xs text-[#6b8f7d] hidden sm:block">{userEmail}</span>}

          {/* Alert email toggle */}
          <button
            onClick={toggleAlertEmail}
            title={profile?.alert_email ? 'Email alerts on' : 'Email alerts off'}
            className="p-2 rounded-lg hover:bg-[#1e2e28] transition-colors"
          >
            {profile?.alert_email
              ? <Bell size={18} className="text-[#30d98a]" />
              : <BellOff size={18} className="text-[#6b8f7d]" />}
          </button>

          <button
            onClick={signOut}
            className="flex items-center gap-1.5 text-xs text-[#6b8f7d] hover:text-[#d4e0d8] transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </button>
        </div>
      </header>

      {/* ── Banners ── */}
      {upgradeMsg && (
        <div className={`px-6 py-3 text-sm flex items-center justify-between gap-4 ${
          upgradeMsg.startsWith('🎉')
            ? 'bg-[#0d3d24] text-[#30d98a]'
            : 'bg-[#3d1a0d] text-[#ea580c]'
        }`}>
          <span>{upgradeMsg}</span>
          <button onClick={() => setUpgradeMsg(null)} className="text-inherit opacity-60 hover:opacity-100">✕</button>
        </div>
      )}

      {isFree && profile?.stripe_customer_id && (
        <div className="bg-[#1f0d0d] border-b border-[#3d1a1a] px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-[#f87171]">
            <AlertTriangle size={14} className="shrink-0" />
            <span>Your subscription has ended. Update your payment to restore Pro access.</span>
          </div>
          <button
            onClick={() => startUpgrade('pro')}
            className="shrink-0 flex items-center gap-1.5 text-xs bg-[#f87171] text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-[#ef4444] transition-colors"
          >
            <Zap size={12} />
            Reactivate Pro
          </button>
        </div>
      )}

      {isFree && !profile?.stripe_customer_id && (
        <div className="bg-[#0d1f18] border-b border-[#1e2e28] px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-[#a3b3a8]">
            <AlertTriangle size={14} className="text-[#d97706]" />
            <span>
              <span className="text-[#d4e0d8] font-medium">{watchedIds.size}/{FREE_LIMIT}</span>
              {' '}materials on free plan
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => startUpgrade('pro')}
              className="flex items-center gap-1.5 text-xs bg-[#30d98a] text-[#080c0a] font-semibold px-3 py-1.5 rounded-lg hover:bg-[#25c477] transition-colors"
            >
              <Zap size={12} />
              Upgrade to Pro — $799/mo
            </button>
            <button
              onClick={() => startUpgrade('enterprise')}
              className="text-xs text-[#6b8f7d] hover:text-[#d4e0d8] transition-colors"
            >
              Enterprise ↗
            </button>
          </div>
        </div>
      )}

      {/* ── Tabs ── */}
      <div className="px-6 pt-6 pb-0 flex gap-1 border-b border-[#1e2e28]">
        {(['watchlist', 'all', 'alerts', 'intel', 'submit'] as const).map(t => (
          <button
            key={t}
            onClick={() => { setTab(t); if (t === 'intel') loadIntel() }}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors capitalize ${
              tab === t
                ? 'bg-[#1e2e28] text-[#30d98a] border border-b-0 border-[#2a3e34]'
                : 'text-[#6b8f7d] hover:text-[#a3b3a8]'
            }`}
          >
            {t === 'submit' ? '+ Submit Intel' : t === 'intel' ? 'Market Intel' : t}
            {t === 'watchlist' && watchedIds.size > 0 && (
              <span className="ml-1.5 text-xs text-[#6b8f7d]">({watchedIds.size})</span>
            )}
            {t === 'alerts' && visibleAlerts.length > 0 && (
              <span className="ml-1.5 text-xs bg-[#3d1a0d] text-[#ea580c] px-1.5 py-0.5 rounded-full">
                {visibleAlerts.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Main content ── */}
      <main className="px-6 py-6">

        {/* ── Alerts tab ── */}
        {tab === 'alerts' && (
          <div>
            {/* Severity filter */}
            <div className="flex items-center gap-2 mb-5">
              <span className="text-xs text-[#6b8f7d]">Filter:</span>
              {(['all', 'critical', 'high'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setSeverityFilter(f)}
                  className={`text-xs px-3 py-1 rounded-full capitalize transition-colors ${
                    severityFilter === f
                      ? 'bg-[#1e2e28] text-[#d4e0d8]'
                      : 'text-[#6b8f7d] hover:text-[#a3b3a8]'
                  }`}
                >
                  {f}
                </button>
              ))}
              <ChevronDown size={12} className="text-[#6b8f7d] ml-auto" />
            </div>

            {visibleAlerts.length === 0 ? (
              <div className="text-center py-20 text-[#6b8f7d]">
                {watchedIds.size === 0
                  ? 'Pin materials to your watchlist to see alerts here.'
                  : 'No active alerts for your watchlist — all clear.'}
              </div>
            ) : (
              <div className="space-y-3">
                {visibleAlerts.map(alert => (
                  <div key={alert.id} className="bg-[#0d1a14] border border-[#1e2e28] rounded-xl p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase ${RISK_COLORS[alert.severity]}`}>
                            {alert.severity}
                          </span>
                          {alert.materials?.name && (
                            <span className="text-xs text-[#6b8f7d]">{alert.materials.name}</span>
                          )}
                        </div>
                        <p className="text-sm font-medium text-[#d4e0d8] leading-snug">{alert.title}</p>
                        {alert.summary && (
                          <p className="text-xs text-[#6b8f7d] mt-1 line-clamp-2">{alert.summary}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <span className="text-xs text-[#6b8f7d]">{relativeTime(alert.created_at)}</span>
                        {alert.source_url && (
                          <a
                            href={alert.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-xs text-[#30d98a] mt-1 hover:underline"
                          >
                            Source ↗
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Materials grid (watchlist + all tabs) ── */}
        {(tab === 'watchlist' || tab === 'all') && (
          <>
            {tab === 'watchlist' && watchedIds.size === 0 ? (
              <div className="text-center py-20 text-[#6b8f7d]">
                <Pin size={32} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">Switch to the <strong className="text-[#a3b3a8]">All</strong> tab and pin materials to track.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {displayedMaterials.map(material => {
                  const isPinned = watchedIds.has(material.id)
                  const alertCount = alertCountByMaterial[material.id] ?? 0
                  const isLoading = pinLoading === material.id

                  return (
                    <div
                      key={material.id}
                      className={`bg-[#0d1a14] border rounded-xl p-4 flex flex-col gap-3 transition-colors ${
                        isPinned ? 'border-[#2a3e34]' : 'border-[#1a2620]'
                      }`}
                    >
                      {/* Material header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-[#d4e0d8] truncate">{material.name}</p>
                          <p className="text-xs text-[#6b8f7d] capitalize mt-0.5">{material.category}</p>
                        </div>
                        <button
                          onClick={() => togglePin(material.id)}
                          disabled={isLoading}
                          title={isPinned ? 'Unpin' : 'Pin to watchlist'}
                          className={`flex-shrink-0 p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                            isPinned
                              ? 'text-[#30d98a] hover:bg-[#1e2e28]'
                              : 'text-[#6b8f7d] hover:text-[#30d98a] hover:bg-[#1e2e28]'
                          }`}
                        >
                          {isPinned ? <Pin size={14} fill="currentColor" /> : <PinOff size={14} />}
                        </button>
                      </div>

                      {/* Risk + lead time */}
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${RISK_COLORS[material.risk_level]}`}>
                          {riskLabel(material.risk_level)}
                        </span>
                        <span className="text-xs text-[#6b8f7d]">
                          {leadRange(material.baseline_lead_wks_min, material.baseline_lead_wks_max)} lead time
                        </span>
                      </div>

                      {/* Sparkline trend */}
                      <div className="flex items-center justify-between">
                        <img
                          src={`/api/sparkline/${material.id}`}
                          alt="lead time trend"
                          width={80}
                          height={24}
                          className="opacity-90"
                        />
                        <span className="text-[10px] text-[#4a6e58]">12-wk trend</span>
                      </div>

                      {/* Alert count */}
                      {alertCount > 0 && (
                        <div
                          className="flex items-center gap-1.5 text-xs text-[#ea580c] cursor-pointer hover:text-[#f97316]"
                          onClick={() => { setTab('alerts') }}
                        >
                          <AlertTriangle size={12} />
                          {alertCount} active alert{alertCount !== 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ── Market Intel tab ── */}
        {tab === 'intel' && (
          <div className="space-y-8">
            {intelLoading && (
              <div className="text-center py-16 text-[#6b8f7d] text-sm">Loading intel…</div>
            )}
            {intelData && (
              <>
                {/* Geopolitical risk summaries */}
                <section>
                  <h2 className="text-sm font-semibold text-[#9ab8a6] uppercase tracking-wider mb-4">Geopolitical risk</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {intelData.geo_summaries.map(g => (
                      <div key={g.category} className="bg-[#0d1a14] border border-[#1a2620] rounded-xl p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-sm font-semibold text-[#d4e0d8] leading-snug">{g.headline}</p>
                          <span className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full ${
                            g.severity === 'critical' ? 'bg-red-900 text-red-300' :
                            g.severity === 'high'     ? 'bg-orange-900 text-orange-300' :
                            g.severity === 'medium'   ? 'bg-yellow-900 text-yellow-300' :
                                                        'bg-green-900 text-green-300'
                          }`}>{g.severity}</span>
                        </div>
                        <p className="text-xs text-[#6b8f7d] leading-relaxed">{g.detail}</p>
                        <p className="text-xs text-[#4a6e58] mt-2 capitalize">{g.category.replace('-', ' ')}</p>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Supplier health signals */}
                <section>
                  <h2 className="text-sm font-semibold text-[#9ab8a6] uppercase tracking-wider mb-4">Supplier health signals</h2>
                  <div className="space-y-3">
                    {intelData.supplier_signals.map((s, i) => (
                      <div key={i} className="bg-[#0d1a14] border border-[#1a2620] rounded-xl p-4 flex gap-4">
                        <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                          s.type === 'positive' ? 'bg-[#30d98a]' :
                          s.type === 'negative' ? 'bg-red-400' :
                                                  'bg-yellow-400'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-sm font-semibold text-[#d4e0d8]">{s.supplier}</p>
                            <span className={`text-xs font-medium ${
                              s.type === 'positive' ? 'text-[#30d98a]' :
                              s.type === 'negative' ? 'text-red-400' :
                                                      'text-yellow-400'
                            }`}>{s.signal}</span>
                          </div>
                          <p className="text-xs text-[#6b8f7d] leading-relaxed">{s.detail}</p>
                          <p className="text-xs text-[#4a6e58] mt-1.5">
                            {new Date(s.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <p className="text-xs text-[#4a6e58]">
                  Last updated {new Date(intelData.updated_at).toLocaleString()}. Intel is curated from public sources and community submissions.
                </p>
              </>
            )}
          </div>
        )}

        {/* ── Submit Intel tab ── */}
        {tab === 'submit' && (
          <div className="max-w-lg mx-auto py-4">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-[#e8f0eb] mb-1">Submit lead time intel</h2>
              <p className="text-sm text-[#6b8f7d]">
                Share what you&apos;re seeing from your suppliers. Data is reviewed before being added to the platform.
              </p>
            </div>

            {submitStatus === 'ok' && (
              <div className="mb-4 flex items-center gap-2 text-sm text-[#30d98a] bg-[#0d2418] border border-[#1e4030] rounded-lg px-4 py-3">
                <Send size={14} />
                Thanks — your submission is under review.
              </div>
            )}
            {submitStatus === 'err' && (
              <div className="mb-4 text-sm text-[#f87171] bg-[#2a0a0a] border border-[#4a1a1a] rounded-lg px-4 py-3">
                Something went wrong. Please try again.
              </div>
            )}

            <form onSubmit={handleSubmitLeadTime} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#9ab8a6] mb-1.5">Material *</label>
                <select
                  value={submitMaterialId}
                  onChange={e => setSubmitMaterialId(e.target.value)}
                  required
                  className="w-full bg-[#0d1a14] border border-[#2a3e34] rounded-lg px-3 py-2 text-sm text-[#d4e0d8] focus:outline-none focus:border-[#30d98a]"
                >
                  <option value="">Select a material…</option>
                  {materials.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#9ab8a6] mb-1.5">Min weeks *</label>
                  <input
                    type="number" min="1" max="104"
                    value={submitMin}
                    onChange={e => setSubmitMin(e.target.value)}
                    required
                    placeholder="e.g. 12"
                    className="w-full bg-[#0d1a14] border border-[#2a3e34] rounded-lg px-3 py-2 text-sm text-[#d4e0d8] placeholder:text-[#4a6e58] focus:outline-none focus:border-[#30d98a]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#9ab8a6] mb-1.5">Max weeks *</label>
                  <input
                    type="number" min="1" max="104"
                    value={submitMax}
                    onChange={e => setSubmitMax(e.target.value)}
                    required
                    placeholder="e.g. 20"
                    className="w-full bg-[#0d1a14] border border-[#2a3e34] rounded-lg px-3 py-2 text-sm text-[#d4e0d8] placeholder:text-[#4a6e58] focus:outline-none focus:border-[#30d98a]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#9ab8a6] mb-1.5">Supplier name <span className="text-[#4a6e58]">(optional)</span></label>
                <input
                  type="text"
                  value={submitSupplier}
                  onChange={e => setSubmitSupplier(e.target.value)}
                  placeholder="e.g. Carpenter Technology"
                  className="w-full bg-[#0d1a14] border border-[#2a3e34] rounded-lg px-3 py-2 text-sm text-[#d4e0d8] placeholder:text-[#4a6e58] focus:outline-none focus:border-[#30d98a]"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-[#9ab8a6] mb-1.5">Material form <span className="text-[#4a6e58]">(optional)</span></label>
                <select
                  value={submitForm}
                  onChange={e => setSubmitForm(e.target.value)}
                  className="w-full bg-[#0d1a14] border border-[#2a3e34] rounded-lg px-3 py-2 text-sm text-[#d4e0d8] focus:outline-none focus:border-[#30d98a]"
                >
                  <option value="">Any form</option>
                  <option value="billet">Billet</option>
                  <option value="bar">Bar / Rod</option>
                  <option value="sheet">Sheet / Plate</option>
                  <option value="tube">Tube / Pipe</option>
                  <option value="wire">Wire</option>
                  <option value="powder">Powder</option>
                  <option value="forging">Forging</option>
                  <option value="casting">Casting</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#9ab8a6] mb-1.5">Notes <span className="text-[#4a6e58]">(optional)</span></label>
                <textarea
                  value={submitNotes}
                  onChange={e => setSubmitNotes(e.target.value)}
                  rows={3}
                  placeholder="Any context about this quote — region, volume, alloy grade, etc."
                  className="w-full bg-[#0d1a14] border border-[#2a3e34] rounded-lg px-3 py-2 text-sm text-[#d4e0d8] placeholder:text-[#4a6e58] focus:outline-none focus:border-[#30d98a] resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitStatus === 'sending'}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#30d98a] text-[#080c0a] text-sm font-bold rounded-lg hover:bg-[#25c477] transition-colors disabled:opacity-60"
              >
                <Send size={14} />
                {submitStatus === 'sending' ? 'Submitting…' : 'Submit lead time'}
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
