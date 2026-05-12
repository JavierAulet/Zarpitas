export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'

export async function POST(req: NextRequest) {
  const { amount, currency = 'eur', customer_email, metadata } = await req.json()

  if (!amount || amount < 50) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // already in cents
      currency,
      automatic_payment_methods: { enabled: true },
      receipt_email: customer_email ?? undefined,
      metadata: {
        source: 'zarpitas',
        ...metadata,
      },
    })

    return NextResponse.json({
      client_secret: paymentIntent.client_secret,
      payment_intent_id: paymentIntent.id,
    })
  } catch (err) {
    console.error('[Stripe] PaymentIntent creation failed:', err)
    const message = err instanceof Error ? err.message : 'Stripe error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

