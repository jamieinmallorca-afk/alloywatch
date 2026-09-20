import Link from 'next/link'

const materials = [
  { name: 'Inconel 718', category: 'Superalloy', leadTime: '28–32 wks', trend: '↑', risk: 'HIGH', price: '$42.80/kg' },
  { name: 'Ti-6Al-4V', category: 'Titaium', leadTime: '16–20 wks', trend: '↑', risk: 'MED', price: '$38.20/kg' },
  { name: 'Toray T700 CF', category: 'Carbon Fibre', leadTime: '12–18 wks', trend: '→', risk: 'MED', price: '$28.50/kg' },
  { name: 'Inconel 625', category: 'Superalloy', leadTime: '22–26 wks', trend: '↑', risk: 'HIGH', price: '$39.60/kg' },
  { name: 'Maraging 300', category: 'Steel', leadTime: '10–14 wks', trend: '→', risk: 'LOW', price: '$18.40/kg' },
]

const features = [
  {
    icon: '⏱',
    title: 'Real-Time Lead Time Tracker',
    desc: 'Crowdsourced + scraped lead times for 30 exotic aerospace materials, updated continuously. Know today, not next quarter.',
  },
  {
    icon: '📡',
    title: 'Supplier Health Scores',
    desc: 'Job posting signals, shipping volume, force majeures, and news sentiment — aggregated into a live health score per supplier.',
  },
  {
    icon: '🌍',
    title: 'Geopolitical Disruption Alerts',
    desc: 'Titanium exposure to Russia. Nickel exposure to Indonesia. When something moves, you get an alert within the hour.',
  },
  {
    icon: '💰',
    title: 'Commodity Price Feed',
    desc: 'LME and CME prices for nickel, titanium, cobalt, and propellant feedstocks. Historical trends and forward indicators.',
  },
  {
    icon: '🤝',
    title: 'Submit & Get Intel',
    desc: 'Submit your current quoted lead time from a supplier. Instantly see the aggregated network average. Give to get.',
  },
  {
    icon: '📋',
    title: 'SLA-Grade Reporting',
    desc: 'Monthly PDF reports showing lead time trends across your watchlist. Ready to drop into a board pack or procurement review.',
  },
]

const tiers = [
  {
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Explore 5 materials with 30-day lagged data.',
    features: ['5 materials', '30-day lagged lead times', 'Commodity price charts', 'Weekly digest email'],
    cta: 'Start free',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$799',
    period: '/month',
    desc: 'Full intelligence for procurement teams.',
    features: ['All 30 materials', 'Real-time lead times', 'Supplier health scores', 'Geopolitical alerts', 'Crowdsource network access', 'Monthly PDF reports'],
    cta: 'Start Pro trial',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: '$2,500',
    period: '/month',
    desc: 'For teams, APIs, and custom tracking.',
    features: ['Everything in Pro', 'API access', 'Custom supplier tracking', '20 team seats', 'Quarterly analyst briefing', 'Custom alert thresholds'],
    cta: 'Contact us',
    highlight: false,
  },
]

const faqs = [
  {
    section: 'Data & Accuracy',
    items: [
      {
        q: 'Where does the data come from?',
        a: "AlloyWatch aggregates lead time data from three sources: manual research and direct supplier enquiries, crowdsourced submissions from procurement professionals in the field, and scraping of trade press and supplier bulletins. Every data point shows its source type and confidence rating so you know exactly what you're looking at.",
      },
      {
        q: 'How often is it updated?',
        a: 'Lead time data is reviewed and refreshed on a rolling basis as new submissions come in and market conditions change. Each data point carries a "valid as of" date. Major disruption events — like a new allocation announcement from a primary mill — trigger a manual review within 24–48 hours.',
      },
      {
        q: 'How do you define "lead time"?',
        a: 'Lead time on AlloyWatch means order placement to material ready-to-ship from the supplier — not delivery to your door. Transit time varies too much by destination to be meaningful at this level. All lead times assume standard aerospace-certified grade with full CMTRs unless noted otherwise.',
      },
      {
        q: "What's the geographic scope?",
        a: 'We track suppliers globally — US, EU, UK, Japan, and key emerging sources. Where lead times differ significantly by region, we break them out by supplier so you can compare directly. Russian-origin material (e.g. VSMPO-AVISMA titanium) is flagged separately given the post-2022 compliance landscape.',
      },
    ],
  },
  {
    section: 'Credibility',
    items: [
      {
        q: "Who's behind AlloyWatch?",
        a: "AlloyWatch was built by James Barnard, who got burned by opaque supply chains firsthand. The platform exists because real lead time intelligence was locked inside distributor relationships and expensive analyst subscriptions — and the rest of the market was flying blind. We're not a market research firm producing quarterly PDFs. This is a live tool built for people who need to make procurement decisions today.",
      },
      {
        q: 'How is this different from calling my distributor?',
        a: "Your distributor gives you their lead time, for their stock, on that day. AlloyWatch shows you lead times across multiple suppliers simultaneously, with historical trend data so you can see whether things are getting better or worse — and geopolitical flags so you understand why. It doesn't replace your distributor relationship; it means you go into that call knowing what a fair lead time looks like.",
      },
      {
        q: "Is this the same data that's in the trade press?",
        a: "Trade press reports on supply chain disruptions weeks or months after they happen. AlloyWatch tracks lead times as they move, with crowdsourced data from people placing actual orders. When Inconel 718 billet started hitting 52-week quotes in late 2024, that didn't make the trade press until Q1 2025. Our users knew in real time.",
      },
    ],
  },
  {
    section: 'Coverage',
    items: [
      {
        q: "My critical material isn't listed — can you add it?",
        a: "Yes. Use the request form on the dashboard or email us at info@alloywatch.io. We prioritise additions based on demand — if multiple users request the same material it moves to the top of the queue. We're adding new materials regularly.",
      },
      {
        q: 'Do you track form-specific lead times (bar vs. sheet vs. billet)?',
        a: 'Yes. Where we have sufficient data, lead times are broken out by form — bar, sheet, plate, billet, tube, powder, and prepreg are the most common. The form is shown on each individual data point so you can filter to what's relevant to your program.",
      },
      {
        q: 'Do you track aerospace-certified grade specifically?',
        a: 'Yes. Where data is available, we distinguish between aerospace-certified material (with full CMTRs, AS9100 supplier qualification, and traceability) and commercial-grade. Most of our core dataset is aerospace-certified. Commercial-grade data is labelled as such.',
      },
    ],
  },
  {
    section: 'Commercial',
    items: [
      {
        q: "What does Pro give me that Free doesn't?",
        a: 'The free tier shows 5 materials with basic lead time ranges. Pro unlocks the full material library (30+ materials), real-time lead times, historical trend charts, geopolitical risk intelligence, supplier health scores, and email alerts when lead times move on your watchlist.',
      },
      {
        q: 'Can I export the data?',
        a: "CSV export for your watchlist materials is available on Pro. API access for ERP integration is on the roadmap — contact info@alloywatch.io if that's a priority for your team.",
      },
      {
        q: 'Do you offer team or enterprise accounts?',
        a: 'Yes. Enterprise accounts include team watchlists, custom material coverage, dedicated data refresh on your key materials, and API access. Email info@alloywatch.io to discuss pricing.',
      },
      {
        q: 'Is there an API?',
        a: "In development and on our roadmap. If you have a specific integration use case — ERP, internal dashboard, procurement system — email info@alloywatch.io and we'll scope it with you. Enterprise customers get early access.",
      },
    ],
  },
  {
    section: 'Trust & Privacy',
    items: [
      {
        q: 'If I submit lead time data, does my company name get shared?',
        a: "No. Submissions are anonymised before they're published. We show the source type (crowdsourced vs. manual vs. scraped) and a confidence score, but never the submitting company or individual. Your competitive intelligence stays yours.",
      },
      {
        q: "Can my competitors see what materials I'm tracking on my watchlist?",
        a: "No. Your watchlist is private. We use aggregated, anonymised watchlist data internally to understand which materials matter most to our users — that's it. No individual watchlist is visible to anyone other than you.",
      },
    ],
  },
]

export default function Home() {
  return (
    <main className="min-h-screen bg-[#080c0a] text-white">
      {/* Nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-brand-500">◈</span>
          <span className="font-bold text-lg tracking-tight">AlloyWatch</span>
          <span className="text-xs text-white/30 font-mono ml-1">MATERIALS INTELLIGENCE</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors">Pricing</Link>
          <Link href="#faq" className="text-sm text-white/60 hover:text-white transition-colors">FAQ</Link>
          <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">Sign in</Link>
          <Link href="/signup" className="btn-primary text-sm px-4 py-2">
            Get started free
          </Link>
        </div>
      </nav>

      {/* Alert banner */}
      <div className="bg-danger-500/10 border-b border-danger-500/20 px-6 py-2.5 text-center">
        <p className="text-sm text-danger-500 font-mono">
          ⚠ LIVE ALERT — Inconel 718 lead times have crossed 30 weeks across 3 major suppliers ·{' '}
          <Link href="/dashboard" className="underline hover:no-underline">See full analysis →</Link>
        </p>
      </div>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-500/10 border border-brand-500/20 rounded-full px-4 py-1.5 text-sm text-brand-500 font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          Real-time intelligence for aerospace procurement
        </div>
        <h1 className="text-5xl md:text-6xl font-extrabold leading-tight mb-6 tracking-tight">
          Inconel 718 is at<br />
          <span className="text-danger-500 font-mono">32-week lead times.</span><br />
          <span className="text-white/80">Do you know what&apos;s next?</span>
        </h1>
        <p className="text-xl text-white/60 max-w-2xl mx-auto mb-10 leading-relaxed">
          AlloyWatch tracks lead times, commodity prices, and supply disruptions across
          30 exotic aerospace materials in real time. The Bloomberg Terminal your procurement team doesn&apos;t have.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/dashboard" className="btn-primary text-base">
            View live dashboard →
          </Link>
          <Link href="#features" className="btn-secondary text-base">
            See what we track
          </Link>
        </div>
        <p className="mt-4 text-sm text-white/40">Free for 5 materials · No credit card required</p>
      </section>

      {/* Live data preview */}
      <section className="max-w-5xl mx-auto px-6 pb-20">
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
              <span className="text-sm text-white/50 font-mono">LIVE FEED · Updated 4 min ago</span>
            </div>
            <Link href="/dashboard" className="text-sm text-brand-500 hover:underline">Full dashboard →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 text-white/40 font-medium">Material</th>
                  <th className="text-left py-2 text-white/40 font-medium">Category</th>
                  <th className="text-left py-2 text-white/40 font-medium">Lead Time</th>
                  <th className="text-left py-2 text-white/40 font-medium">Trend</th>
                  <th className="text-left py-2 text-white/40 font-medium">Risk</th>
                  <th className="text-right py-2 text-white/40 font-medium">Spot Price</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((m) => (
                  <tr key={m.name} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-3 font-semibold font-mono">{m.name}</td>
                    <td className="py-3 text-white/50">{m.category}</td>
                    <td className="py-3 font-mono text-white/90">{m.leadTime}</td>
                    <td className={`py-3 font-mono font-bold ${m.trend === '↑' ? 'text-danger-500' : m.trend === '↓' ? 'text-brand-500' : 'text-white/50'}`}>
                      {m.trend}
                    </td>
                    <td className="py-3">
                      <span className={
                        m.risk === 'HIGH' ? 'risk-high' :
                        m.risk === 'MED' ? 'risk-medium' : 'risk-low'
                      }>
                        {m.risk}
                      </span>
                    </td>
                    <td className="py-3 text-right font-mono text-white/70">{m.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-white/30 mt-3 font-mono">Showing 5 of 30 materials · Subscribe for full access</p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-center mb-4">What AlloyWatch tracks</h2>
        <p className="text-white/50 text-center mb-16 max-w-xl mx-auto">
          Built for procurement managers, supply chain directors, and materials engineers at aerospace and space companies.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="card hover:border-white/20 transition-colors">
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="max-w-5xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-center mb-4">Intelligence that pays for itself</h2>
        <p className="text-white/50 text-center mb-16">One avoided stockout covers a year of Pro.</p>
        <div className="grid md:grid-cols-3 gap-6">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`rounded-2xl p-6 border ${
                t.highlight
                  ? 'border-brand-500 bg-brand-500/10'
                  : 'border-white/10 bg-white/5'
              }`}
            >
              {t.highlight && (
                <div className="text-xs font-semibold text-brand-500 bg-brand-500/20 rounded-full px-3 py-1 inline-block mb-4">
                  Most popular
                </div>
              )}
              <div className="mb-2">
                <span className="text-3xl font-bold font-mono">{t.price}</span>
                <span className="text-white/50 text-sm">{t.period}</span>
              </div>
              <p className="text-white/60 text-sm mb-6">{t.desc}</p>
              <ul className="space-y-2 mb-8">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <span className="text-brand-500 mt-0.5">✓</span>
                    <span className="text-white/70">{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href={
                  t.name === 'Enterprise'
                    ? 'mailto:info@alloywatch.io'
                    : t.name === 'Pro'
                    ? '/pricing'
                    : '/signup'
                }
                className={`block text-center font-semibold py-3 rounded-xl transition-all ${
                  t.highlight
                    ? 'bg-brand-500 hover:bg-brand-600 text-white'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {t.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-3xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-bold text-center mb-4">Frequently asked questions</h2>
        <p className="text-white/50 text-center mb-16">
          Can&apos;t find the answer you need?{' '}
          <a href="mailto:info@alloywatch.io" className="text-brand-500 hover:underline">
            Email us directly.
          </a>
        </p>

        <div className="space-y-8">
          {faqs.map((group) => (
            <div key={group.section}>
              <h3 className="text-xs font-semibold text-brand-500 uppercase tracking-widest mb-4 font-mono">
                {group.section}
              </h3>
              <div className="space-y-1">
                {group.items.map((item) => (
                  <details
                    key={item.q}
                    className="group border border-white/10 rounded-xl overflow-hidden bg-white/5 hover:border-white/20 transition-colors"
                  >
                    <summary className="flex items-center justify-between gap-4 px-5 py-4 cursor-pointer list-none text-sm font-medium text-white/90 hover:text-white transition-colors select-none">
                      {item.q}
                      <span className="shrink-0 text-white/40 text-lg leading-none transition-transform group-open:rotate-45">+</span>
                    </summary>
                    <div className="px-5 pb-5 text-sm text-white/60 leading-relaxed border-t border-white/10 pt-4">
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 text-center text-sm text-white/30 font-mono">
        <p className="mb-3">© 2026 AlloyWatch · Aerospace Materials Intelligence · info@alloywatch.io</p>
        <div className="flex items-center justify-center gap-6 text-xs text-white/20">
          <Link href="/terms" className="hover:text-white/50 transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
          <Link href="/refund" className="hover:text-white/50 transition-colors">Refund Policy</Link>
        </div>
      </footer>
    </main>
  )
}
