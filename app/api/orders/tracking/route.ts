import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import type { OrderRow } from '@/lib/supabase/types'

export async function GET(req: NextRequest) {
  const order_id = req.nextUrl.searchParams.get('order_id')
  if (!order_id) {
    return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
  }

  const db = createServiceClient()

  const { data: order, error } = await db
    .from('orders')
    .select('aliexpress_order_id, aliexpress_order_ids, tracking_number, tracking_carrier, tracking_events, status')
    .eq('id', order_id)
    .single()

  if (error || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const typedOrder = order as Partial<OrderRow>

  // If we already have cached tracking events from today, return them
  if (typedOrder.tracking_events && (typedOrder.tracking_events as unknown[]).length > 0) {
    return NextResponse.json({
      tracking_number: typedOrder.tracking_number,
      carrier: typedOrder.tracking_carrier,
      events: typedOrder.tracking_events,
      status: typedOrder.status,
    })
  }

  // Determine which AliExpress order ID to query
  const refs = (typedOrder.aliexpress_order_ids as { aliexpress_order_id: number }[] | undefined) ?? []
  const primaryRef = refs[0]
  const legacyId = typedOrder.aliexpress_order_id

  const aliexpressOrderId = primaryRef
    ? String(primaryRef.aliexpress_order_id)
    : legacyId ?? null

  if (!aliexpressOrderId) {
    return NextResponse.json({
      tracking_number: null,
      carrier: null,
      events: [],
      status: typedOrder.status,
      message: 'No AliExpress order linked yet',
    })
  }

  console.log(`[Tracking] Fetching AliExpress tracking for order ${aliexpressOrderId}`)

  try {
    const apiUrl = process.env.ALIEXPRESS_API_URL
    if (!apiUrl) throw new Error('ALIEXPRESS_API_URL not configured')

    const res = await fetch(`${apiUrl}/tracking?order_id=${aliexpressOrderId}`)
    const tracking = await res.json()

    if (!res.ok || !tracking) {
      return NextResponse.json({ tracking_number: null, carrier: null, events: [], status: typedOrder.status })
    }

    // Cache tracking info back to the order row
    await db
      .from('orders')
      .update({
        tracking_number: tracking.logistics_no ?? tracking.tracking_number ?? null,
        tracking_carrier: tracking.carrier ?? null,
        tracking_events: tracking.events ?? [],
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id)

    return NextResponse.json({
      tracking_number: tracking.logistics_no ?? tracking.tracking_number ?? null,
      carrier: tracking.carrier ?? null,
      events: tracking.events ?? [],
      status: typedOrder.status,
    })
  } catch (err) {
    console.error('[Tracking] AliExpress tracking fetch failed:', err)
    return NextResponse.json({ error: 'Could not fetch tracking info' }, { status: 502 })
  }
}
