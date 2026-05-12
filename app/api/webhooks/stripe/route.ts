export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe/server'
import { createServiceClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const sig = req.headers.get('stripe-signature')
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret)
  } catch (err) {
    console.error('[Webhook] Signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  console.log(`[Webhook] Received event: ${event.type}`)

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object as Stripe.PaymentIntent
    const orderId = pi.metadata?.order_id

    if (!orderId) {
      console.log('[Webhook] payment_intent.succeeded — no order_id in metadata, skipping')
      return NextResponse.json({ received: true })
    }

    const db = createServiceClient()

    // Check order exists and isn't already confirmed
    const { data: order } = await db
      .from('orders')
      .select('id, status, stripe_payment_intent_id')
      .eq('id', orderId)
      .single()

    if (!order) {
      console.error(`[Webhook] Order ${orderId} not found`)
      return NextResponse.json({ received: true })
    }

    if (order.status !== 'pending') {
      console.log(`[Webhook] Order ${orderId} already at status "${order.status}", skipping`)
      return NextResponse.json({ received: true })
    }

    console.log(`[Webhook] Triggering fulfillment for order ${orderId}`)

    // Update stripe payment intent ID on order
    await db
      .from('orders')
      .update({
        stripe_payment_intent_id: pi.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    // Trigger fulfillment — same as client-side but from server as backup
    try {
      const confirmRes = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/api/orders/confirm`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: orderId }),
        }
      )
      console.log(`[Webhook] Fulfillment response: ${confirmRes.status}`)
    } catch (err) {
      console.error('[Webhook] Fulfillment trigger failed:', err)
    }
  }

  if (event.type === 'payment_intent.payment_failed') {
    const pi = event.data.object as Stripe.PaymentIntent
    const orderId = pi.metadata?.order_id
    console.log(`[Webhook] Payment failed for order ${orderId ?? 'unknown'}:`, pi.last_payment_error?.message)

    if (orderId) {
      const db = createServiceClient()
      await db
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', orderId)
        .eq('status', 'pending')
    }
  }

  return NextResponse.json({ received: true })
}

