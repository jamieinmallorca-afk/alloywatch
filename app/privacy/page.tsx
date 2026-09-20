import Link from 'next/link'

export const metadata = { title: 'Privacy Policy — AlloyWatch' }

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#080c0a] text-[#d4e0d8]">
      <nav className="border-b border-[#1a2e22] px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <Link href="/" className="text-lg font-bold text-[#30d98a]">AlloyWatch</Link>
        <Link href="/dashboard" className="text-sm text-[#6b8f7d] hover:text-[#d4e0d8] transition-colors">Dashboard</Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-[#e8f0eb] mb-2">Privacy Policy</h1>
        <p className="text-sm text-[#6b8f7d] mb-12">Last updated: September 2026</p>

        <div className="space-y-10 text-sm leading-relaxed text-[#9ab8a6]">

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">1. Who we are</h2>
            <p>AlloyWatch Ltd operates alloywatch.io. This policy explains how we collect, use, and protect your personal data. Our contact email is <a href="mailto:hello@alloywatch.io" className="text-[#30d98a] hover:underline">hello@alloywatch.io</a>.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">2. What we collect</h2>
            <ul className="space-y-3">
              <li><span className="text-[#d4e0d8] font-medium">Account data:</span> Your email address and password (hashed) when you sign up.</li>
              <li><span className="text-[#d4e0d8] font-medium">Usage data:</span> Which materials you watch, alerts you view, and features you use — used to personalise your experience and improve the platform.</li>
              <li><span className="text-[#d4e0d8] font-medium">Submitted data:</span> Lead time reports you voluntarily submit to the crowdsource network, including optional supplier name and notes.</li>
              <li><span className="text-[#d4e0d8] font-medium">Billing data:</span> Payment is handled entirely by Stripe. We store only your Stripe Customer ID — we never see or store your card details.</li>
              <li><span className="text-[#d4e0d8] font-medium">Technical data:</span> IP address, browser type, and access logs for security and debugging purposes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">3. How we use your data</h2>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>To provide and operate your AlloyWatch account</li>
              <li>To send alerts you have opted into (email notifications for materials on your watchlist)</li>
              <li>To process payments and manage your subscription</li>
              <li>To aggregate anonymised lead time submissions into the platform data</li>
              <li>To improve the product and diagnose technical issues</li>
              <li>To comply with legal obligations</li>
            </ul>
            <p className="mt-3">We do not sell your personal data to third parties. We do not use your data for advertising.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">4. Third-party services</h2>
            <ul className="space-y-2">
              <li><span className="text-[#d4e0d8] font-medium">Supabase</span> — database and authentication hosting. Data stored on EU servers.</li>
              <li><span className="text-[#d4e0d8] font-medium">Stripe</span> — payment processing. Governed by <a href="https://stripe.com/privacy" target="_blank" rel="noopener noreferrer" className="text-[#30d98a] hover:underline">Stripe&apos;s Privacy Policy</a>.</li>
              <li><span className="text-[#d4e0d8] font-medium">Resend</span> — transactional email delivery (alerts, account emails).</li>
              <li><span className="text-[#d4e0d8] font-medium">Vercel</span> — application hosting and edge delivery.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">5. Your rights (GDPR)</h2>
            <p className="mb-3">If you are in the European Economic Area or UK, you have the right to:</p>
            <ul className="space-y-1.5 list-disc list-inside">
              <li>Access the personal data we hold about you</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your account and data</li>
              <li>Object to or restrict how we process your data</li>
              <li>Data portability — receive a copy of your data in a machine-readable format</li>
              <li>Withdraw consent at any time where processing is based on consent</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, email <a href="mailto:hello@alloywatch.io" className="text-[#30d98a] hover:underline">hello@alloywatch.io</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">6. Data retention</h2>
            <p>We retain your account data for as long as your account is active. If you close your account, we delete your personal data within 30 days, except where retention is required for legal or tax purposes. Anonymised aggregated lead time data may be retained indefinitely.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">7. Cookies</h2>
            <p>AlloyWatch uses only functional cookies necessary to keep you logged in. We do not use tracking, advertising, or analytics cookies.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">8. Security</h2>
            <p>We use industry-standard practices to protect your data, including encrypted connections (HTTPS), hashed passwords, and access controls. No method of transmission over the internet is 100% secure; we cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">9. Changes to this policy</h2>
            <p>We may update this policy. We will notify you of material changes by email. The "Last updated" date at the top reflects the most recent revision.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#d4e0d8] mb-3">10. Contact</h2>
            <p>For privacy-related questions or requests, contact <a href="mailto:hello@alloywatch.io" className="text-[#30d98a] hover:underline">hello@alloywatch.io</a>.</p>
          </section>

        </div>
      </div>

      <footer className="border-t border-[#1a2e22] py-8 text-center text-xs text-[#4a6e58]">
        <div className="flex items-center justify-center gap-6">
          <Link href="/terms" className="hover:text-[#6b8f7d] transition-colors">Terms</Link>
          <Link href="/privacy" className="hover:text-[#6b8f7d] transition-colors">Privacy</Link>
          <Link href="/refund" className="hover:text-[#6b8f7d] transition-colors">Refund Policy</Link>
          <Link href="mailto:hello@alloywatch.io" className="hover:text-[#6b8f7d] transition-colors">hello@alloywatch.io</Link>
        </div>
      </footer>
    </div>
  )
}
