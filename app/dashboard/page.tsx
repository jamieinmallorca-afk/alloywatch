'use client'

import { useEffect, useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import { Bell, BellOff, Pin, PinOff, AlertTriangle, ChevronDown, LogOut, Zap, Send } from 'lucide-react'

// ââ Types ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

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

// ââ Helpers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

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
  if (min == null && max == null) return 'â'
  if (min == null) return `â¤${max}w`
  if (max == null) return `${min}w+`
  return `${min}â${max}w`
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const h = Math.floor(diff / 3_600_000)
  if (h < 1) return 'just now'
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ââ Component ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

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

  // ââ Supplier intel âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
  const [intelData, setIntelData] = useState<{
    geo_summaries: Array<{ category: string; headline: string; detail: string; severity: string }>
    supplier_signals: Array<{ supplier: string; signal: string; type: string; detail: string; timestamp: string }>
    updated_at: string
  } | null>(null)
  const [intelLoading, setIntelLoading] = useState(false)

  // ââ Lead time submission form âââââââââââââââââââââââââââââââââââââââââââââââââ
  const [submitMaterialId, setSubmitMaterialId] = useState('')
  const [submitMin, setSubmitMin]   = useState('')
  const [submitMax, setSubmitMax]   = useState('')
  const [submitSupplier, setSubmitSupplier] = useState('')
  const [submitForm, setSubmitForm] = useState('')
  const [submitNotes, setSubmitNotes] = useState('')
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')

  // ââ Auth âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/login'); return }
      setUserEmail(user.email ?? null)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ââ Upgraded / cancelled banner âââââââââââââââââââââââââââââââââââââââââââââââ

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const upgradeParam = params.get('upgrade')
    if (upgradeParam === 'success') {
      setUpgradeMsg('ð You\'re now upgraded â unlimited watchlist & priority alerts!')
      window.history.replaceState({}, '', '/dashboard')
    } else if (upgradeParam === 'cancelled') {
      setUpgradeMsg('Upgrade cancelled â you\'re still on your current plan.')
      window.history.replaceState({}, '', '/dashboard')
    }
  }, [])

  // ââ Data loading ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

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

  // ââ Derived state âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

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

  // ââ Actions âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

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

  // ââ Render helpers ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

  const isFree = !profile || profile.plan === 'free'

  const displayedMaterials = tab === 'watchlist'
    ? materials.filter(m => watchedIds.has(m.id))
    : materials

  // ââ Render ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080c0a] flex items-center justify-center">
        <div className="text-[#a3b3a8] animate-pulse">Loadingâ¦</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080c0a] text-[#d4e0d8]">
      {/* ââ Header ââ */}
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

      {/* ââ Banners ââ */}
      {upgradeMsg && (
        <div className={`px-6 py-3 text-sm flex items-center justify-between gap-4 ${
           upgradeMsg.startsWith('ð')
            ? 'bg-[#0d3d24] text-[#30d98a]'
            : 'bg-[#3d1a0d] text-[#ea580c]'
        }`}>
          <span>{upgradeMsg}</span>
          <button onClick={() => setUpgradeMsg(null)} className="text-inherit opacity-60 hover:opacity-100">â</button>
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
              Upgrade to Pro â $799/mo
            </button>
            <button
              onClick={() => startUpgrade('enterprise')}
              className="text-xs text-[#6b8f7d] hover:text-[#d4e0d8] transition-colors"
            >
              Enterprise â
            </button>
          </div>
        </div>
      )}

      {/* ââ Tabs ââ */}
      <div className="px-6 pt-6 pb-0 flex gap-1 border-b border-[#1e2e28]">
        {('[watchlist', 'all', 'alerts', 'intel', 'submit'] as const).map(t => (
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

      {/* ââ Main content ââ */}
      <main className="px-6 py-6">

        {/* )H)HÆW'G2F")H)H¢÷Ð¢·F"ÓÓÒvÆW'G2rbb¢ÆFcà¢²ò¢6WfW&GfÇFW"¢÷Ð¢ÆFb6Æ74æÖSÒ&fÆWFV×2Ö6VçFW"vÓ"Ö"ÓR#à¢Ç7â6Æ74æÖSÒ'FWB×2FWBÕ²3f#cvEÒ#äfÇFW#£Â÷7ãà¢²²vÆÂrÂv7&F6ÂrÂvvuÒ26öç7BæÖbÓâ¢Æ'WGFöà¢¶W×¶gÐ¢öä6Æ6³×²Óâ6WE6WfW&GfÇFW"bÐ¢6Æ74æÖS×¶FWB×2Ó2Ó&÷VæFVBÖgVÆÂ6FÆ¦RG&ç6FöâÖ6öÆ÷'2G°¢6WfW&GfÇFW"ÓÓÒ`¢òv&rÕ²3S&S#ÒFWBÕ²6CFSCÒp¢¢wFWBÕ²3f#cvEÒ÷fW#§FWBÕ²66#6Òp¢ÖÐ¢à¢¶gÐ¢Âö'WGFöãà¢Ð¢Ä6Wg&öäF÷vâ6¦S×³'Ò6Æ74æÖSÒ'FWBÕ²3f#cvEÒÖÂÖWFò"óà¢ÂöFcà ¢·f6&ÆTÆW'G2æÆVæwFÓÓÒò¢ÆFb6Æ74æÖSÒ'FWBÖ6VçFW"Ó#FWBÕ²3f#cvEÒ#à¢·vF6VDG2ç6¦RÓÓÒ ¢òuâÖFW&Ç2Fò÷W"vF6Æ7BFò6VRÆW'G2W&Râp¢¢tæò7FfRÆW'G2f÷"÷W"vF6Æ7B(	BÆÂ6ÆV"âwÐ¢ÂöFcà¢¢¢ÆFb6Æ74æÖSÒ'76R×Ó2#à¢·f6&ÆTÆW'G2æÖÆW'BÓâ¢ÆFb¶W×¶ÆW'BæGÒ6Æ74æÖSÒ&&rÕ²3CEÒ&÷&FW"&÷&FW"Õ²3S&S#Ò&÷VæFVB×ÂÓB#à¢ÆFb6Æ74æÖSÒ&fÆWFV×2×7F'B§W7FgÖ&WGvVVâvÓB#à¢ÆFb6Æ74æÖSÒ&fÆWÓÖâ×rÓ#à¢ÆFb6Æ74æÖSÒ&fÆWFV×2Ö6VçFW"vÓ"Ö"ÓãR#à¢Ç7â6Æ74æÖS×¶FWB×2föçB×6VÖ&öÆBÓ"ÓãR&÷VæFVBÖgVÆÂWW&66RGµ$4µô4ôÄõ%5¶ÆW'Bç6WfW&G×ÖÓà¢¶ÆW'Bç6WfW&GÐ¢Â÷7ãà¢¶ÆW'BæÖFW&Ç3òææÖRbb¢Ç7â6Æ74æÖSÒ'FWB×2FWBÕ²3f#cvEÒ#ç¶ÆW'BæÖFW&Ç2ææÖWÓÂ÷7ãà¢Ð¢ÂöFcà¢Ç6Æ74æÖSÒ'FWB×6ÒföçBÖÖVFVÒFWBÕ²6CFSCÒÆVFær×6çVr#ç¶ÆW'BçFFÆWÓÂ÷à¢¶ÆW'Bç7VÖÖ'bb¢Ç6Æ74æÖSÒ'FWB×2FWBÕ²3f#cvEÒ×BÓÆæRÖ6Æ×Ó"#ç¶ÆW'Bç7VÖÖ'ÓÂ÷à¢Ð¢ÂöFcà¢ÆFb6Æ74æÖSÒ&fÆW×6&æ²ÓFWB×&vB#à¢Ç7â6Æ74æÖSÒ'FWB×2FWBÕ²3f#cvEÒ#ç·&VÆFfUFÖRÆW'Bæ7&VFVEöBÓÂ÷7ãà¢¶ÆW'Bç6÷W&6U÷W&Âbb¢Æ¢&Vc×¶ÆW'Bç6÷W&6U÷W&ÇÐ¢F&vWCÒ%ö&Ææ² ¢&VÃÒ&æö÷VæW"æ÷&VfW'&W" ¢6Æ74æÖSÒ&&Æö6²FWB×2FWBÕ²33CÒ×BÓ÷fW#§VæFW&ÆæR ¢à¢6÷W&6R(ip¢Âöà¢Ð¢ÂöFcà¢ÂöFcà¢ÂöFcà¢Ð¢ÂöFcà¢Ð¢ÂöFcà¢Ð ¢²ò¢)H)HÖFW&Ç2w&BvF6Æ7B²ÆÂF'2)H)H¢÷Ð¢²F"ÓÓÒwvF6Æ7BrÇÂF"ÓÓÒvÆÂrbb¢Ãà¢·F"ÓÓÒwvF6Æ7BrbbvF6VDG2ç6¦RÓÓÒò¢ÆFb6Æ74æÖSÒ'FWBÖ6VçFW"Ó#FWBÕ²3f#cvEÒ#à¢Åâ6¦S×³3'Ò6Æ74æÖSÒ&×ÖWFòÖ"Ó2÷6GÓ3"óà¢Ç6Æ74æÖSÒ'FWB×6Ò#å7vF6FòFRÇ7G&öær6Æ74æÖSÒ'FWBÕ²66#6Ò#äÆÃÂ÷7G&öæsâF"æBâÖFW&Ç2FòG&6²ãÂ÷à¢ÂöFcà¢¢¢ÆFb6Æ74æÖSÒ&w&Bw&BÖ6öÇ2Ó6Ó¦w&BÖ6öÇ2Ó"Æs¦w&BÖ6öÇ2Ó2Ã¦w&BÖ6öÇ2ÓBvÓB#à¢¶F7ÆVDÖFW&Ç2æÖÖFW&ÂÓâ°¢6öç7B5ææVBÒvF6VDG2æ2ÖFW&ÂæB¢6öç7BÆW'D6÷VçBÒÆW'D6÷VçD'ÖFW&Å¶ÖFW&ÂæEÒóò ¢6öç7B4ÆöFærÒäÆöFærÓÓÒÖFW&Âæ@ ¢&WGW&â¢ÆF`¢¶W×¶ÖFW&ÂæGÐ¢6Æ74æÖS×¶&rÕ²3CEÒ&÷&FW"&÷VæFVB×ÂÓBfÆWfÆWÖ6öÂvÓ2G&ç6FöâÖ6öÆ÷'2G°¢5ææVBòv&÷&FW"Õ²3&6S3EÒr¢v&÷&FW"Õ²3#c#Òp¢ÖÐ¢à¢²ò¢ÖFW&ÂVFW"¢÷Ð¢ÆFb6Æ74æÖSÒ&fÆWFV×2×7F'B§W7FgÖ&WGvVVâvÓ"#à¢ÆFb6Æ74æÖSÒ&fÆWÓÖâ×rÓ#à¢Ç6Æ74æÖSÒ'FWB×6ÒföçB×6VÖ&öÆBFWBÕ²6CFSCÒG'Væ6FR#ç¶ÖFW&ÂææÖWÓÂ÷à¢Ç6Æ74æÖSÒ'FWB×2FWBÕ²3f#cvEÒ6FÆ¦R×BÓãR#ç¶ÖFW&Âæ6FVv÷'ÓÂ÷à¢ÂöFcà¢Æ'WGFöà¢öä6Æ6³×²ÓâFövvÆUâÖFW&ÂæBÐ¢F6&ÆVC×¶4ÆöFæwÐ¢FFÆS×¶5ææVBòuVçâr¢uâFòvF6Æ7BwÐ¢6Æ74æÖS×¶fÆW×6&æ²ÓÓãR&÷VæFVBÖÆrG&ç6FöâÖ6öÆ÷'2F6&ÆVC¦÷6GÓCG°¢5ææV@¢òwFWBÕ²33CÒ÷fW#¦&rÕ²3S&S#Òp¢¢wFWBÕ²3f#cvEÒ÷fW#§FWBÕ²33CÒ÷fW#¦&rÕ²3S&S#Òp¢ÖÐ¢à¢¶5ææVBòÅâ6¦S×³GÒfÆÃÒ&7W'&VçD6öÆ÷""óâ¢Åäöfb6¦S×³GÒóçÐ¢Âö'WGFöãà¢ÂöFcà ¢²ò¢&6²²ÆVBFÖR¢÷Ð¢ÆFb6Æ74æÖSÒ&fÆWFV×2Ö6VçFW"vÓ"#à¢Ç7â6Æ74æÖS×¶FWB×2föçBÖÖVFVÒÓ"ÓãR&÷VæFVBÖgVÆÂGµ$4µô4ôÄõ%5¶ÖFW&Âç&6µöÆWfVÅ×ÖÓà¢·&6´Æ&VÂÖFW&Âç&6µöÆWfVÂÐ¢Â÷7ãà¢Ç7â6Æ74æÖSÒ'FWB×2FWBÕ²3f#cvEÒ#à¢¶ÆVE&ævRÖFW&Âæ&6VÆæUöÆVE÷v·5öÖâÂÖFW&Âæ&6VÆæUöÆVE÷v·5öÖÒÆVBFÖP¢Â÷7ãà¢ÂöFcà ¢²ò¢7&¶ÆæRG&VæB¢÷Ð¢ÆFb6Æ74æÖSÒ&fÆWFV×2Ö6VçFW"§W7FgÖ&WGvVVâ#à¢ÆÖp¢7&3×¶ö÷7&¶ÆæRòG¶ÖFW&ÂæGÖÐ¢ÇCÒ&ÆVBFÖRG&VæB ¢vGF×³Ð¢VvC×³#GÐ¢6Æ74æÖSÒ&÷6GÓ ¢óà¢Ç7â6Æ74æÖSÒ'FWBÕ³ÒFWBÕ²3FfSSÒ#ã"×v²G&VæCÂ÷7ãà¢ÂöFcà ¢²ò¢ÆW'B6÷VçB¢÷Ð¢¶ÆW'D6÷VçBâbb¢ÆF`¢6Æ74æÖSÒ&fÆWFV×2Ö6VçFW"vÓãRFWB×2FWBÕ²6VS5Ò7W'6÷"×öçFW"÷fW#§FWBÕ²6cs3eÒ ¢öä6Æ6³×²Óâ²6WEF"vÆW'G2r×Ð¢à¢ÄÆW'EG&ævÆR6¦S×³'Òóà¢¶ÆW'D6÷VçGÒ7FfRÆW'G¶ÆW'D6÷VçBÓÒòw2r¢rwÐ¢ÂöFcà¢Ð¢ÂöFcà¢¢ÒÐ¢ÂöFcà¢Ð¢Âóà¢Ð ¢²ò¢)H)HÖ&¶WBçFVÂF")H)H¢÷Ð¢·F"ÓÓÒvçFVÂrbb¢ÆFb6Æ74æÖSÒ'76R×Ó#à¢¶çFVÄÆöFærbb¢ÆFb6Æ74æÖSÒ'FWBÖ6VçFW"ÓbFWBÕ²3f#cvEÒFWB×6Ò#äÆöFærçFVÎ(
cÂöFcà¢Ð¢¶çFVÄFFbb¢Ãà¢²ò¢vV÷öÆF6Â&6²7VÖÖ&W2¢÷Ð¢Ç6V7Föãà¢Æ"6Æ74æÖSÒ'FWB×6ÒföçB×6VÖ&öÆBFWBÕ²3#eÒWW&66RG&6¶ær×vFW"Ö"ÓB#ävV÷öÆF6Â&6³Âö#à¢ÆFb6Æ74æÖSÒ&w&Bw&BÖ6öÇ2ÓÖC¦w&BÖ6öÇ2Ó"vÓB#à¢¶çFVÄFFævVõ÷7VÖÖ&W2æÖrÓâ¢ÆFb¶W×¶ræ6FVv÷'Ò6Æ74æÖSÒ&&rÕ²3CEÒ&÷&FW"&÷&FW"Õ²3#c#Ò&÷VæFVB×ÂÓB#à¢ÆFb6Æ74æÖSÒ&fÆWFV×2×7F'B§W7FgÖ&WGvVVâvÓ"Ö"Ó"#à¢Ç6Æ74æÖSÒ'FWB×6ÒföçB×6VÖ&öÆBFWBÕ²6CFSCÒÆVFær×6çVr#ç¶ræVFÆæWÓÂ÷à¢Ç7â6Æ74æÖS×¶6&æ²ÓFWB×2föçBÖÖVFVÒÓ"ÓãR&÷VæFVBÖgVÆÂG°¢rç6WfW&GÓÓÒv7&F6Âròv&r×&VBÓFWB×&VBÓ3r ¢rç6WfW&GÓÓÒvvròv&rÖ÷&ævRÓFWBÖ÷&ævRÓ3r ¢rç6WfW&GÓÓÒvÖVFVÒròv&r×VÆÆ÷rÓFWB×VÆÆ÷rÓ3r ¢v&rÖw&VVâÓFWBÖw&VVâÓ3p¢ÖÓç¶rç6WfW&GÓÂ÷7ãà¢ÂöFcà¢Ç6Æ74æÖSÒ'FWB×2FWBÕ²3f#cvEÒÆVFær×&VÆVB#ç¶ræFWFÇÓÂ÷à¢Ç6Æ74æÖSÒ'FWB×2FWBÕ²3FfSSÒ×BÓ"6FÆ¦R#ç¶ræ6FVv÷'ç&WÆ6RrÒrÂrrÓÂ÷à¢ÂöFcà¢Ð¢ÂöFcà¢Â÷6V7Föãà ¢²ò¢7WÆW"VÇF6væÇ2¢÷Ð¢Ç6V7Föãà¢Æ"6Æ74æÖSÒ'FWB×6ÒföçB×6VÖ&öÆBFWBÕ²3#eÒWW&66RG&6¶ær×vFW"Ö"ÓB#å7WÆW"VÇF6væÇ3Âö#à¢ÆFb6Æ74æÖSÒ'76R×Ó2#à¢¶çFVÄFFç7WÆW%÷6væÇ2æÖ2ÂÓâ¢ÆFb¶W×¶Ò6Æ74æÖSÒ&&rÕ²3CEÒ&÷&FW"&÷&FW"Õ²3#c#Ò&÷VæFVB×ÂÓBfÆWvÓB#à¢ÆFb6Æ74æÖS×¶rÓ"Ó"&÷VæFVBÖgVÆÂ×BÓãR6&æ²ÓG°¢2çGRÓÓÒw÷6FfRròv&rÕ²33CÒr ¢2çGRÓÓÒvæVvFfRròv&r×&VBÓCr ¢v&r×VÆÆ÷rÓCp¢ÖÒóà¢ÆFb6Æ74æÖSÒ&fÆWÓÖâ×rÓ#à¢ÆFb6Æ74æÖSÒ&fÆWFV×2Ö6VçFW"§W7FgÖ&WGvVVâvÓ"Ö"Ó#à¢Ç6Æ74æÖSÒ'FWB×6ÒföçB×6VÖ&öÆBFWBÕ²6CFSCÒ#ç·2ç7WÆW'ÓÂ÷à¢Ç7â6Æ74æÖS×¶FWB×2föçBÖÖVFVÒG°¢2çGRÓÓÒw÷6FfRròwFWBÕ²33CÒr ¢2çGRÓÓÒvæVvFfRròwFWB×&VBÓCr ¢wFWB×VÆÆ÷rÓCp¢ÖÓç·2ç6væÇÓÂ÷7ãà¢ÂöFcà¢Ç6Æ74æÖSÒ'FWB×2FWBÕ²3f#cvEÒÆVFær×&VÆVB#ç·2æFWFÇÓÂ÷à¢Ç6Æ74æÖSÒ'FWB×2FWBÕ²3FfSSÒ×BÓãR#à¢¶æWrFFR2çFÖW7F×çFôÆö6ÆTFFU7G&ærvVâÕU2rÂ²ÖöçF¢w6÷'BrÂF¢vçVÖW&2rÒÐ¢Â÷à¢ÂöFcà¢ÂöFcà¢Ð¢ÂöFcà¢Â÷6V7Föãà ¢Ç6Æ74æÖSÒ'FWB×2FWBÕ²3FfSSÒ#à¢Æ7BWFFVB¶æWrFFRçFVÄFFçWFFVEöBçFôÆö6ÆU7G&ærÒâçFVÂ27W&FVBg&öÒV&Æ26÷W&6W2æB6öÖ×VæG7V&Ö76öç2à¢Â÷à¢Âóà¢Ð¢ÂöFcà¢Ð ¢²ò¢)H)H7V&ÖBçFVÂF")H)H¢÷Ð¢·F"ÓÓÒw7V&ÖBrbb¢ÆFb6Æ74æÖSÒ&Ö×rÖÆr×ÖWFòÓB#à¢ÆFb6Æ74æÖSÒ&Ö"Ób#à¢Æ"6Æ74æÖSÒ'FWBÖ&6RföçB×6VÖ&öÆBFWBÕ²6ScV%ÒÖ"Ó#å7V&ÖBÆVBFÖRçFVÃÂö#à¢Ç6Æ74æÖSÒ'FWB×6ÒFWBÕ²3f#cvEÒ#à¢6&RvB÷Rf÷3·&R6VVærg&öÒ÷W"7WÆW'2âFF2&WfWvVB&Vf÷&R&VærFFVBFòFRÆFf÷&Òà¢Â÷à¢ÂöFcà ¢·7V&ÖE7FGW2ÓÓÒvö²rbb¢ÆFb6Æ74æÖSÒ&Ö"ÓBfÆWFV×2Ö6VçFW"vÓ"FWB×6ÒFWBÕ²33CÒ&rÕ²3C#CÒ&÷&FW"&÷&FW"Õ²3SC3Ò&÷VæFVBÖÆrÓBÓ2#à¢Å6VæB6¦S×³GÒóà¢Fæ·2(	B÷W"7V&Ö76öâ2VæFW"&WfWrà¢ÂöFcà¢Ð¢·7V&ÖE7FGW2ÓÓÒvW'"rbb¢ÆFb6Æ74æÖSÒ&Ö"ÓBFWB×6ÒFWBÕ²6cssÒ&rÕ²3&Ò&÷&FW"&÷&FW"Õ²3FÒ&÷VæFVBÖÆrÓBÓ2#à¢6öÖWFærvVçBw&öærâÆV6RG'vâà¢ÂöFcà¢Ð ¢Æf÷&Òöå7V&ÖC×¶æFÆU7V&ÖDÆVEFÖWÒ6Æ74æÖSÒ'76R×ÓB#à¢ÆFcà¢ÆÆ&VÂ6Æ74æÖSÒ&&Æö6²FWB×2föçBÖÖVFVÒFWBÕ²3#eÒÖ"ÓãR#äÖFW&Â£ÂöÆ&VÃà¢Ç6VÆV7@¢fÇVS×·7V&ÖDÖFW&ÄGÐ¢öä6ævS×¶RÓâ6WE7V&ÖDÖFW&ÄBRçF&vWBçfÇVRÐ¢&WV&V@¢6Æ74æÖSÒ'rÖgVÆÂ&rÕ²3CEÒ&÷&FW"&÷&FW"Õ²3&6S3EÒ&÷VæFVBÖÆrÓ2Ó"FWB×6ÒFWBÕ²6CFSCÒfö7W3¦÷WFÆæRÖæöæRfö7W3¦&÷&FW"Õ²33CÒ ¢à¢Æ÷FöâfÇVSÒ"#å6VÆV7BÖFW&Î(
cÂö÷Föãà¢¶ÖFW&Ç2æÖÒÓâ¢Æ÷Föâ¶W×¶ÒæGÒfÇVS×¶ÒæGÓç¶ÒææÖWÓÂö÷Föãà¢Ð¢Â÷6VÆV7Cà¢ÂöFcà ¢ÆFb6Æ74æÖSÒ&w&Bw&BÖ6öÇ2Ó"vÓ2#à¢ÆFcà¢ÆÆ&VÂ6Æ74æÖSÒ&&Æö6²FWB×2föçBÖÖVFVÒFWBÕ²3#eÒÖ"ÓãR#äÖâvVV·2£ÂöÆ&VÃà¢ÆçW@¢GSÒ&çVÖ&W""ÖãÒ#"ÖÒ#B ¢fÇVS×·7V&ÖDÖçÐ¢öä6ævS×¶RÓâ6WE7V&ÖDÖâRçF&vWBçfÇVRÐ¢&WV&V@¢Æ6VöÆFW#Ò&Rærâ" ¢6Æ74æÖSÒ'rÖgVÆÂ&rÕ²3CEÒ&÷&FW"&÷&FW"Õ²3&6S3EÒ&÷VæFVBÖÆrÓ2Ó"FWB×6ÒFWBÕ²6CFSCÒÆ6VöÆFW#§FWBÕ²3FfSSÒfö7W3¦÷WFÆæRÖæöæRfö7W3¦&÷&FW"Õ²33CÒ ¢óà¢ÂöFcà¢ÆFcà¢ÆÆ&VÂ6Æ74æÖSÒ&&Æö6²FWB×2föçBÖÖVFVÒFWBÕ²3#eÒÖ"ÓãR#äÖvVV·2£ÂöÆ&VÃà¢ÆçW@¢GSÒ&çVÖ&W""ÖãÒ#"ÖÒ#B ¢fÇVS×·7V&ÖDÖÐ¢öä6ævS×¶RÓâ6WE7V&ÖDÖRçF&vWBçfÇVRÐ¢&WV&V@¢Æ6VöÆFW#Ò&Rærâ# ¢6Æ74æÖSÒ'rÖgVÆÂ&rÕ²3CEÒ&÷&FW"&÷&FW"Õ²3&6S3EÒ&÷VæFVBÖÆrÓ2Ó"FWB×6ÒFWBÕ²6CFSCÒÆ6VöÆFW#§FWBÕ²3FfSSÒfö7W3¦÷WFÆæRÖæöæRfö7W3¦&÷&FW"Õ²33CÒ ¢óà¢ÂöFcà¢ÂöFcà ¢ÆFcà¢ÆÆ&VÂ6Æ74æÖSÒ&&Æö6²FWB×2föçBÖÖVFVÒFWBÕ²3#eÒÖ"ÓãR#å7WÆW"æÖRÇ7â6Æ74æÖSÒ'FWBÕ²3FfSSÒ#â÷FöæÂÂ÷7ããÂöÆ&VÃà¢ÆçW@¢GSÒ'FWB ¢fÇVS×·7V&ÖE7WÆW'Ð¢öä6ævS×¶RÓâ6WE7V&ÖE7WÆW"RçF&vWBçfÇVRÐ¢Æ6VöÆFW#Ò&Rærâ6'VçFW"FV6æöÆöw ¢6Æ74æÖSÒ'rÖgVÆÂ&rÕ²3CEÒ&÷&FW"&÷&FW"Õ²3&6S3EÒ&÷VæFVBÖÆrÓ2Ó"FWB×6ÒFWBÕ²6CFSCÒÆ6VöÆFW#§FWBÕ²3FfSSÒfö7W3¦÷WFÆæRÖæöæRfö7W3¦&÷&FW"Õ²33CÒ ¢óà¢ÂöFcà ¢ÆFcà¢ÆÆ&VÂ6Æ74æÖSÒ&&Æö6²FWB×2föçBÖÖVFVÒFWBÕ²3#eÒÖ"ÓãR#äÖFW&Âf÷&ÒÇ7â6Æ74æÖSÒ'FWBÕ²3FfSSÒ#â÷FöæÂÂ÷7ããÂöÆ&VÃà¢Ç6VÆV7@¢fÇVS×·7V&ÖDf÷&×Ð¢öä6ævS×¶RÓâ6WE7V&ÖDf÷&ÒRçF&vWBçfÇVRÐ¢6Æ74æÖSÒ'rÖgVÆÂ&rÕ²3CEÒ&÷&FW"&÷&FW"Õ²3&6S3EÒ&÷VæFVBÖÆrÓ2Ó"FWB×6ÒFWBÕ²6CFSCÒfö7W3¦÷WFÆæRÖæöæRfö7W3¦&÷&FW"Õ²33CÒ ¢à¢Æ÷FöâfÇVSÒ"#äçf÷&ÓÂö÷Föãà¢Æ÷FöâfÇVSÒ&&ÆÆWB#ä&ÆÆWCÂö÷Föãà¢Æ÷FöâfÇVSÒ&&"#ä&"ò&öCÂö÷Föãà¢Æ÷FöâfÇVSÒ'6VWB#å6VWBòÆFSÂö÷Föãà¢Æ÷FöâfÇVSÒ'GV&R#åGV&RòSÂö÷Föãà¢Æ÷FöâfÇVSÒ'v&R#åv&SÂö÷Föãà¢Æ÷FöâfÇVSÒ'÷vFW"#å÷vFW#Âö÷Föãà¢Æ÷FöâfÇVSÒ&f÷&vær#äf÷&væsÂö÷Föãà¢Æ÷FöâfÇVSÒ&67Fær#ä67FæsÂö÷Föãà¢Â÷6VÆV7Cà¢ÂöFcà ¢ÆFcà¢ÆÆ&VÂ6Æ74æÖSÒ&&Æö6²FWB×2föçBÖÖVFVÒFWBÕ²3#eÒÖ"ÓãR#äæ÷FW2Ç7â6Æ74æÖSÒ'FWBÕ²3FfSSÒ#â÷FöæÂÂ÷7ããÂöÆ&VÃà¢ÇFWF&V¢fÇVS×·7V&ÖDæ÷FW7Ð¢öä6ævS×¶RÓâ6WE7V&ÖDæ÷FW2RçF&vWBçfÇVRÐ¢&÷w3×³7Ð¢Æ6VöÆFW#Ò$ç6öçFWB&÷WBF2V÷FR(	B&VvöâÂföÇVÖRÂÆÆ÷w&FRÂWF2â ¢6Æ74æÖSÒ'rÖgVÆÂ&rÕ²3CEÒ&÷&FW"&÷&FW"Õ²3&6S3EÒ&÷VæFVBÖÆrÓ2Ó"FWB×6ÒFWBÕ²6CFSCÒÆ6VöÆFW#§FWBÕ²3FfSSÒfö7W3¦÷WFÆæRÖæöæRfö7W3¦&÷&FW"Õ²33CÒ&W6¦RÖæöæR ¢óà¢ÂöFcà ¢Æ'WGFöà¢GSÒ'7V&ÖB ¢F6&ÆVC×·7V&ÖE7FGW2ÓÓÒw6VæFærwÐ¢6Æ74æÖSÒ'rÖgVÆÂfÆWFV×2Ö6VçFW"§W7FgÖ6VçFW"vÓ"Ó"ãR&rÕ²33CÒFWBÕ²33ÒFWB×6ÒföçBÖ&öÆB&÷VæFVBÖÆr÷fW#¦&rÕ²3#V3CsuÒG&ç6FöâÖ6öÆ÷'2F6&ÆVC¦÷6GÓc ¢à¢Å6VæB6¦S×³GÒóà¢·7V&ÖE7FGW2ÓÓÒw6VæFærròu7V&ÖGFæ~(
br¢u7V&ÖBÆVBFÖRwÐ¢Âö'WGFöãà¢Âöf÷&Óà¢ÂöFcà¢Ð¢ÂöÖãà¢ÂöFcà¢§Ð 
