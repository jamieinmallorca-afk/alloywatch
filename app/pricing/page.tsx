'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Zap, Building2, Shield } from 'lucide-react'
import Link from 'next/link'

const PRO_FEATURES = [
  'Unlimited watchlist materials',
  'Real-time lead time alerts (email + in-app)',
  'Sparkline trend charts for all materials',
  'Lead time submission & crowdsourced intel',
  'Supplier health scoring',
  'Geopolitical risk summaries',
  'CSV data export',
  'API access (100 req/day)',
]

const ENTERPRISE_FEATURES = [
  'Everything in Pro',
  'Unlimited API access',
  'Custom material tracking',
  'Dedicated supply chain analyst',
  'White-glove onboarding',
  'SSO / SAML support',
  'SLA guarantee (99.9% uptime)',
  'Custom alert logic & webhooks',
]

const FREE_FEATURES = [
  '5 materials on watchlist',
  'Weekly digest alerts',
  'Basic lead time data',
]

export default function PricingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState<'pro' | 'enterprise' | null>(null)

  async function handleUpgrade(plan: 'pro' | 'enterprise') {
    setLoading(plan)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.error === 'Unauthorized') {
        router.push('/login?next=/pricing')
      }
    } catch (err) {
      console.error('Checkout error:', err)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#080c0a] text-[#d4e0d8]">
      {/* Nav */}
      <nav className="border-b border-[#1a2e22] px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold text-[#30d98a]">
          AlloyWatch
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-[#6b8f7d] hover:text-[#d4e0d8] transition-colors">
            Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-[#e8f0eb] mb-4">
            Supply chain intel at every scale
          </h1>
          <p className="text-lg text-[#6b8f7d] max-w-xl mx-auto">
            Start free, upgrade when your procurement team needs real-time lead time intelligence.
          </p>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free */}
          <div className="rounded-xl border border-[#1a2e22] bg-[#0d1a12] p-6 flex flex-col">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Shield size={18} className="text-[#6b8f7d]" />
                <span className="text-sm font-semibold text-[#6b8f7d] uppercase tracking-wide">Free</span>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-bold text-[#e8f0eb]">$0</span>
                <span className="text-[#6b8f7d] mb-1">/mo</span>
              </div>
              <p className="text-sm text-[#6b8f7d]">For individuals exploring supply risk</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {FREE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#9ab8a6]">
                  <Check size={14} className="text-[#6b8f7d] mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/dashboard"
              className="block text-center py-2.5 rounded-lg border border-[#2d4a3a] text-sm font-medium text-[#6b8f7d] hover:text-[#d4e0d8] hover:border-[#4a7a5c] transition-colors"
            >
              Go to dashboard
            </Link>
          </div>

          {/* Pro */}
          <div className="rounded-xl border border-[#30d98a] bg-[#0d1a12] p-6 flex flex-col relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="text-xs font-bold bg-[#30d98a] text-[#080c0a] px-3 py-1 rounded-full uppercase tracking-wide">
                Most popular
              </span>
            </div>
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Zap size={18} className="text-[#30d98a]" />
                <span className="text-sm font-semibold text-[#30d98a] uppercase tracking-wide">Pro</span>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-bold text-[#e8f0eb]">$799</span>
                <span className="text-[#6b8f7d] mb-1">/mo</span>
              </div>
              <p className="text-sm text-[#6b8f7d]">For procurement teams that need real-time intel</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {PRO_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#9ab8a6]">
                  <Check size={14} className="text-[#30d98a] mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade('pro')}
              disabled={loading === 'pro'}
              className="w-full py-2.5 rounded-lg bg-[#30d98a] text-[#080c0a] text-sm font-bold hover:bg-[#25c477] transition-colors disabled:opacity-60"
            >
              {loading === 'pro' ? 'Redirecting…' : 'Get started with Pro'}
            </button>
          </div>

          {/* Enterprise */}
          <div className="rounded-xl border border-[#1a2e22] bg-[#0d1a12] p-6 flex flex-col">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Building2 size={18} className="text-[#60a5fa]" />
                <span className="text-sm font-semibold text-[#60a5fa] uppercase tracking-wide">Enterprise</span>
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-4xl font-bold text-[#e8f0eb]">Custom</span>
              </div>
              <p className="text-sm text-[#6b8f7d]">For large procurement orgs &amp; OEMs</p>
            </div>
            <ul className="space-y-3 mb-8 flex-1">
              {ENTERPRISE_FEATURES.map(f => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-[#9ab8a6]">
                  <Check size={14} className="text-[#60a5fa] mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleUpgrade('enterprise')}
              disabled={loading === 'enterprise'}
              className="w-full py-2.5 rounded-lg border border-[#60a5fa] text-[#60a5fa] text-sm font-bold hover:bg-[#60a5fa10] transition-colors disabled:opacity-60"
            >
              {loading === 'enterprise' ? 'Redirecting…' : 'Contact sales'}
            </button>
          </div>
        </div>

        {/* FAQ / trust section */}
        <div className="mt-20 text-center">
          <p className="text-sm text-[#6b8f7d]">
            All plans include a 14-day free trial. No credit card required to start.
            Questions? Email{' '}
            <a href="mailto:hello@alloywatch.io" className="text-[#30d98a] hover:underline">
              hello@alloywatch.io
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
