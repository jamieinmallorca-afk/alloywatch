import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
  })

  export const PRICE_IDS = {
    pro:        process.env.STRIPE_PRO_PRICE_ID!,
      enterprise: process.env.STRIPE_ENTERPRISE_PRICE_ID!,
      } as const

      export type Plan = 'free' | 'pro' | 'enterprise'
      
