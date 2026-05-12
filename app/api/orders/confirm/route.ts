export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createAliExpressOrder } from '@/lib/aliexpress/client'
import { sendOrderConfirmation, sendAdminNewOrder } from '@/lib/email'
import type { OrderRow, AliExpressOrderRef } from '@/lib/supabase/types'

function buildLogisticsAddress(order: OrderRow) {
  const addr = order.shipping_address
  return {
    country: 'ES',
    province: addr.province,
    city: addr.city,
    zip: addr.postalCode,
    address: addr.address,
    contact_person: `${addr.firstName} ${addr.lastName}`.trim(),
    mobile_no: order.customer_phone ?? '',
    phone_country_code: '34',
  }
}

export async function POST(req: NextRequest) {
  const { order_id } = await req.json()
  if (!order_id) {
    return NextResponse.json({ error: 'Missing order_id' }, { status: 400 })
  }

  const db = createServiceClient()

  const { data: order, error: fetchError } = await db
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single()

  if (fetchError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const typedOrder = order as OrderRow

  // Idempotency guard
  if (typedOrder.status === 'processing' || typedOrder.status === 'shipped' || typedOrder.status === 'delivered') {
    return NextResponse.json({ success: true, already_confirmed: true })
  }

  const logistics_address = buildLogisticsAddress(typedOrder)
  const aliexpressRefs: AliExpressOrderRef[] = []
  let anyFailed = false

  // Mark confirmed
  await db
    .from('orders')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', order_id)

  // Send confirmation email + admin alert (in parallel, non-blocking)
  void Promise.all([
    sendOrderConfirmation({
      id: typedOrder.id,
      customer_email: typedOrder.customer_email,
      customer_name: typedOrder.customer_name,
      shipping_address: typedOrder.shipping_address,
      items: typedOrder.items,
      subtotal: typedOrder.subtotal,
      shipping: typedOrder.shipping,
      total: typedOrder.total,
    }),
    sendAdminNewOrder({
      id: typedOrder.id,
      customer_email: typedOrder.customer_email,
      customer_name: typedOrder.customer_name,
      shipping_address: typedOrder.shipping_address,
      items: typedOrder.items,
      subtotal: typedOrder.subtotal,
      shipping: typedOrder.shipping,
      total: typedOrder.total,
    }),
  ])

  // Place AliExpress orders
  for (const item of typedOrder.items) {
    const aliexpressProductId = (item as { aliexpress_id?: string }).aliexpress_id

    if (!aliexpressProductId) {
      console.log(`[AliExpress] Skipping item "${item.name}" — no aliexpress_id, needs manual fulfillment`)
      anyFailed = true
      continue
    }

    try {
      const result = await createAliExpressOrder({
        out_order_id: `${order_id}-${item.id}`,
        logistics_address,
        product_items: [{ product_id: parseInt(aliexpressProductId, 10), product_count: item.quantity }],
      })

      if (result.success && result.order_list?.length) {
        for (const ref of result.order_list) {
          aliexpressRefs.push({ product_id: item.id, aliexpress_order_id: ref.order_id })
        }
      } else {
        console.error(`[AliExpress] Order failed for "${item.name}":`, result.error)
        anyFailed = true
      }
    } catch (err) {
      console.error(`[AliExpress] Exception for "${item.name}":`, err)
      anyFailed = true
    }
  }

  const allFulfilled = aliexpressRefs.length > 0 && !anyFailed
  const newStatus = allFulfilled ? 'processing' : 'confirmed'

  const updatePayload: Record<string, unknown> = {
    status: newStatus,
    aliexpress_order_ids: aliexpressRefs,
    needs_manual_review: anyFailed,
    updated_at: new Date().toISOString(),
  }

  if (aliexpressRefs.length > 0) {
    updatePayload.aliexpress_order_id = String(aliexpressRefs[0].aliexpress_order_id)
  }

  await db.from('orders').update(updatePayload).eq('id', order_id)

  return NextResponse.json({ success: true, status: newStatus, aliexpress_orders: aliexpressRefs, needs_manual_review: anyFailed })
}

