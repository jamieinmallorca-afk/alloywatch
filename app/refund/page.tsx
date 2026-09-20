import Link from 'next/link'

export const metadata = { title: 'Refund Policy — AlloyWatch' }

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#080c0a] text-[#d4e0d8]">
      <nav className="border-b border-[#1a2e22] px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <Link href="/" className="text-lg font-bold text-[#30d98a]">AlloyWatch</Link>
        <Link href="/dashboard" className="text-sm text-[#6b8f7d] hover:text-[#d4e0d8] transition-colors">Dashboard</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-[#e8f0eb] mb-2">Refund Policy</h1>
        <p className="text-sm text-[#6b8f7d] mb-12">Last updated: September 2026</p>

        <div className="space-y-10 text-sm leading-relaxed text-[#9ab8a6]">

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">Subscriptions</h2>
            <p>AlloyWatch Pro and Enterprise plans are billed monthly. You may cancel your subscription at any time from your account settings or by emailing <a href="mailto:info@alloywatch.io" className="text-[#30d98a] hover:underline">info@alloywatch.io</a>.</p>
            <p className="mt-3">Cancellation takes effect at the end of your current billing period. You will retain full access until that date. <strong className="text-[#d4e0d8]">We do not issue pro-rated refunds</strong> for unused days within a billing period.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">Exceptions</h2>
            <p>We will issue a full refund within 7 days of your initial payment if:</p>
            <ul className="mt-3 space-y-2 list-disc list-inside">
              <li>You were charged in error (e.g. duplicate charge)</li>
              <li>A technical issue on our side prevented you from accessing the Service during a significant portion of your billing period and we were unable to resolve it</li>
            </ul>
            <p className="mt-3">To request an exception refund, email <a href="mailto:info@alloywatch.io" className="text-[#30d98a] hover:underline">info@alloywatch.io</a> with your account email and a brief description of the issue. We will respond within 3 business days.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">Failed payments</h2>
            <p>If a payment fails, Stripe will retry automatically. If payment cannot be collected after 3 attempts, your subscription will be cancelled and your account will revert to the free plan. You can reactivate at any time by updating your payment method and subscribing again.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">Free plan</h2>
            <p>The free plan is free — no payment is ever taken, and no refund is applicable.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">Contact</h2>
            <p>Questions about billing or refunds? Email <a href="mailto:info@alloywatch.io" className="text-[#30d98a] hover:underline">info@alloywatch.io</a> and we&apos;ll get back to you within one business day.</p>
          </section>

        </div>
      </div>

      <footer className="border-t border-[#1a2e22] py-8 text-center text-xs text-[#4a6e58]">
        <div className="flex items-center justify-center gap-6">
          <Link href="/terms" className="hover:text-[#6b8f7d] transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-[#6b8f7d] transition-colors">Privacy</Link>
          <Link href="/refund" className="hover:text-[#6b8f7d] transition-colors">Refund Policy</Link>
          <Link href="mailto:info@alloywatch.io" className="hover:text-[#6b8f7d] transition-colors">info@alloywatch.io</Link>
        </div>
      </footer>
    </div>
  )
}
