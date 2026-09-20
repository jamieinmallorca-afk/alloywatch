import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export const runtime = 'nodejs'

const PRICE_IDS: Record<string, string> = {
  pro: process.env.STRIPE_PRO_PRICE_ID!,
  enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { plan } = await req.json()
  const priceId = PRICE_IDS[plan]

  if (!priceId) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      managed_payments: { enabled: false },
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { user_id: user.id, plan },
      success_url: `${req.nextUrl.origin}/dashboard?upgrade=success`,
      cancel_url: `${req.nextUrl.origin}/dashboard?upgrade=cancelled`,
    })
    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Stripe error:', err?.message)
    return NextResponse.json(
      { error: err?.message || 'Stripe error' },
      { status: 500 }
    )
  }
}
