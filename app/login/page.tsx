'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push(next)
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-[#080c0a] text-[#d4e0d8] flex flex-col">
      {/* Nav */}
      <nav className="border-b border-[#1a2e22] px-6 py-4">
        <Link href="/" className="text-lg font-bold text-[#30d08a]">
          AlloyWatch
        </Link>
      </nav>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-bold mb-2">Sign in</h1>
          <p className="text-sm text-[#3a5a45] mb-8">
            Don&apos;t have an account?{' '}
            <Link href="/signup" className="text-[#30d08a] hover:text-[#25c477] transition-colors">
              Sign up free
            </Link>
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#6b8f7d] uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full px-3 py-2.5 rounded-lg bg-[#0d1a12] border border-[#1a2e22] text-[#d4e0d8] placeholder-[#3a5a45] focus:outline-none focus:border-[#30d08a] transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#6b8f7d] uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 rounded-lg bg-[#0d1a12] border border-[#1a2e22] text-[#d4e0d8] placeholder-[#3a5a45] focus:outline-none focus:border-[#30d08a] transition-colors"
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
              className="w-full py-2.5 rounded-lg bg-[#30d98a] text-[#080c0a] text-sm font-bold hover:bg-[#25c477] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-[#3a5a45]">
            <Link href="/pricing" className="hover:text-[#6b8f7d] transition-colors">
              View pricing
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080c0a]" />}>
      <LoginForm />
    </Suspense>
  )
}
