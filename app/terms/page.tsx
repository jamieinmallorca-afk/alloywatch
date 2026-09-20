import Link from 'next/link'

export const metadata = { title: 'Terms of Service — AlloyWatch' }

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#080c0a] text-[#d4e0d8]">
      <nav className="border-b border-[#1a2e22] px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <Link href="/" className="text-lg font-bold text-[#30d98a]">AlloyWatch</Link>
        <Link href="/dashboard" className="text-sm text-[#6b8f7d] hover:text-[#d4e0d8] transition-colors">Dashboard</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-[#e8f0eb] mb-2">Terms of Service</h1>
        <p className="text-sm text-[#6b8f7d] mb-12">Last updated: September 2026</p>

        <div className="space-y-10 text-sm leading-relaxed text-[#9ab8a6]">

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">1. Agreement</h2>
            <p>By accessing or using AlloyWatch ("Service"), you agree to these Terms of Service. AlloyWatch is operated by AlloyWatch Ltd ("we", "us", "our"). If you do not agree, do not use the Service.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">2. What AlloyWatch provides</h2>
            <p>AlloyWatch is a data aggregation and intelligence platform covering aerospace and industrial material lead times, supplier signals, and commodity pricing. Data is sourced from public sources, scraped feeds, and crowdsourced submissions from our user community. All data is provided for informational purposes only and does not constitute procurement advice, financial advice, or any guarantee of accuracy.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">3. Accounts</h2>
            <p>You must provide accurate information when creating an account. You are responsible for maintaining the confidentiality of your login credentials. You may not share your account with others or use another person&apos;s account. Notify us immediately at <a href="mailto:info@alloywatch.io" className="text-[#30d98a] hover:underline">info@alloywatch.io</a> if you suspect unauthorised access.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">4. Subscriptions and billing</h2>
            <p>Paid plans are billed monthly in advance via Stripe. By subscribing, you authorise us to charge your payment method on a recurring basis. You may cancel at any time; cancellation takes effect at the end of the current billing period and no partial refunds are issued. See our <Link href="/refund" className="text-[#30d98a] hover:underline">Refund Policy</Link> for details.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">5. Acceptable use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Resell, redistribute, or sublicense AlloyWatch data or reports without written permission</li>
              <li>Scrape or systematically download data beyond your API plan limits</li>
              <li>Submit false or misleading lead time data to the crowdsource network</li>
              <li>Attempt to gain unauthorised access to other users&apos; data or our systems</li>
              <li>Use the Service in any way that violates applicable laws or regulations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">6. Data accuracy</h2>
            <p>We make reasonable efforts to ensure data accuracy but cannot guarantee it. Lead times, prices, and supplier signals are aggregated from multiple sources and may not reflect current real-world conditions. Do not make sole procurement decisions based on AlloyWatch data without independent verification. We accept no liability for decisions made in reliance on our data.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">7. Intellectual property</h2>
            <p>All software, design, compiled datasets, and written content on AlloyWatch are owned by AlloyWatch Ltd or our licensors. You retain ownership of data you submit. By submitting lead time data, you grant us a non-exclusive licence to include that data in our aggregated platform.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">8. Limitation of liability</h2>
            <p>To the fullest extent permitted by law, AlloyWatch Ltd shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the Service, including but not limited to procurement losses, stockouts, or supply chain disruptions. Our total liability to you shall not exceed the amount you paid us in the 3 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">9. Termination</h2>
            <p>We may suspend or terminate your account if you violate these Terms or for any other reason with reasonable notice. You may close your account at any time by emailing <a href="mailto:info@alloywatch.io" className="text-[#30d98a] hover:underline">info@alloywatch.io</a>.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">10. Changes to these terms</h2>
            <p>We may update these Terms from time to time. We will notify you of material changes by email or in-app notice. Continued use after the effective date constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">11. Governing law</h2>
            <p>These Terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">12. Contact</h2>
            <p>For any questions about these Terms, contact us at <a href="mailto:info@alloywatch.io" className="text-[#30d98a] hover:underline">info@alloywatch.io</a>.</p>
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
