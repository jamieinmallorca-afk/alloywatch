import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createSupabaseServiceClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')
  if (!sig) return NextResponse.json({ error: 'Missing signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Webhook error'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const service = createSupabaseServiceClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.CheckoutSession
      const userId = session.metadata?.user_id
      const plan   = session.metadata?.plan
      if (userId && plan) {
        await service.from('profiles').upsert({ id: userId, plan, stripe_customer_id: session.customer as string })
      }
      break
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const { data: profile } = await service.from('profiles').select('id').eq('stripe_customer_id', customerId).single()
      if (profile) await service.from('profiles').update({ plan: 'free' }).eq('id', profile.id)
      break
    }
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const customerId = sub.customer as string
      const priceId = sub.items.data[0]?.price.id
      const planMap: Record<string, string> = {
        [process.env.STRIPE_PRO_PRICE_ID!]: 'pro',
        [process.env.STRIPE_ENTERPRISE_PRICE_ID!]: 'enterprise',
      }
      const newPlan = planMap[priceId]
      if (newPlan) {
        const { data: profile } = await service.from('profiles').select('id').eq('stripe_customer_id', customerId).single()
        if (profile) await service.from('profiles').update({ plan: newPlan }).eq('id', profile.id)
      }
      break
    }
    default: break
  }

  return NextResponse.json({ received: true })
      }
