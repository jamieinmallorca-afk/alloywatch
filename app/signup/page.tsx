'use client'
export const dynamic = 'force-dynamic'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

export default function SignupPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [company, setCompany] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { company },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // If email confirmation is disabled in Supabase, sign in immediately
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    if (!loginError) {
      router.push('/dashboard')
      router.refresh()
      return
    }

    // Otherwise show "check your email" state
    setDone(true)
    setLoading(false)
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#080c0a] text-[#d4e0d8] flex flex-col">
        <nav className="border-b border-[#1a2e22] px-6 py-4">
          <Link href="/" className="text-lg font-bold text-[#30d98a]">AlloyWatch</Link>
        </nav>
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center max-w-sm">
            <div className="w-12 h-12 rounded-full bg-[#30d98a]/10 border border-[#30d98a]/30 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-[#30d98a]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#e8f0eb] mb-2">Check your email</h2>
            <p className="text-sm text-[#6b8f7d]">
              We sent a confirmation link to <span className="text-[#d4e0d8]">{email}</span>.
              Click it to activate your account and access the dashboard.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080c0a] text-[#d4e0d8] flex flex-col">
      {/* Nav */}
      <nav className="border-b border-[#1a2e22] px-6 py-4">
        <Link href="/" className="text-lg font-bold text-[#30d98a]">
          AlloyWatch
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#e8f0eb] mb-1">Create your account</h1>
            <p className="text-sm text-[#6b8f7d]">
              Already have an account?{' '}
              <Link href="/login" className="text-[#30d98a] hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#6b8f7d] uppercase tracking-wide mb-1.5">
                Work email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3 py-2.5 rounded-lg bg-[#0d1a12] border border-[#1a2e22] text-[#d4e0d8] placeholder-[#3a5a45] text-sm focus:outline-none focus:border-[#30d98a] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6b8f7d] uppercase tracking-wide mb-1.5">
                Company <span className="normal-case text-[#3a5a45]">(optional)</span>
              </label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Acme Aerospace"
                className="w-full px-3 py-2.5 rounded-lg bg-[#0d1a12] border border-[#1a2e22] text-[#d4e0d8] placeholder-[#3a5a45] text-sm focus:outline-none focus:border-[#30d98a] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6b8f7d] uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters"
                className="w-full px-3 py-2.5 rounded-lg bg-[#0d1a12] border border-[#1a2e22] text-[#d4e0d8] placeholder-[#3a5a45] text-sm focus:outline-none focus:border-[#30d98a] transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-[#30d98a] text-[#080c0a] text-sm font-bold hover:bg-[#25c477] transition-colors disabled:opacity-60"
            >
              {loading ? 'Creating account…' : 'Get started free'}
            </button>

            <p className="text-xs text-center text-[#3a5a45]">
              Free plan — no credit card required
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
