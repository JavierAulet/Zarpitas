import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { createAliExpressOrder } from '@/lib/aliexpress/client'
import type { OrderRow, AliExpressOrderRef } from '@/lib/supabase/types'

// Maps a Zarpitas province name to a 2-letter ISO country subdivision code
// AliExpress expects province as the local name or code — we send as-is for ES
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

  // Fetch the full order
  const { data: order, error: fetchError } = await db
    .from('orders')
    .select('*')
    .eq('id', order_id)
    .single()

  if (fetchError || !order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  const typedOrder = order as OrderRow

  // Already processed — idempotency guard
  if (typedOrder.status === 'processing' || typedOrder.status === 'shipped' || typedOrder.status === 'delivered') {
    return NextResponse.json({ success: true, already_confirmed: true })
  }

  const logistics_address = buildLogisticsAddress(typedOrder)
  const aliexpressRefs: AliExpressOrderRef[] = []
  let anyFailed = false

  // First, mark order as confirmed
  await db
    .from('orders')
    .update({
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', order_id)

  // Place one AliExpress order per item that has an aliexpress_id
  for (const item of typedOrder.items) {
    const aliexpressProductId = (item as { aliexpress_id?: string }).aliexpress_id

    if (!aliexpressProductId) {
      console.log(`[AliExpress] Skipping item "${item.name}" — no aliexpress_id, needs manual fulfillment`)
      anyFailed = true
      continue
    }

    console.log(`[AliExpress] Placing order for product ${aliexpressProductId} x${item.quantity}`)

    try {
      const result = await createAliExpressOrder({
        out_order_id: `${order_id}-${item.id}`,
        logistics_address,
        product_items: [
          {
            product_id: parseInt(aliexpressProductId, 10),
            product_count: item.quantity,
          },
        ],
      })

      console.log(`[AliExpress] Order result for ${item.name}:`, JSON.stringify(result))

      if (result.success && result.order_list?.length) {
        for (const ref of result.order_list) {
          aliexpressRefs.push({
            product_id: item.id,
            aliexpress_order_id: ref.order_id,
          })
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

  // Determine final status
  const allFulfilled = aliexpressRefs.length > 0 && !anyFailed
  const newStatus = allFulfilled ? 'processing' : 'confirmed'

  const updatePayload: Record<string, unknown> = {
    status: newStatus,
    aliexpress_order_ids: aliexpressRefs,
    needs_manual_review: anyFailed,
    updated_at: new Date().toISOString(),
  }

  // Back-compat: store first AliExpress order ID in legacy column too
  if (aliexpressRefs.length > 0) {
    updatePayload.aliexpress_order_id = String(aliexpressRefs[0].aliexpress_order_id)
  }

  const { error: updateError } = await db
    .from('orders')
    .update(updatePayload)
    .eq('id', order_id)

  if (updateError) {
    console.error('[Orders] Failed to update order after AliExpress fulfillment:', updateError)
  }

  return NextResponse.json({
    success: true,
    status: newStatus,
    aliexpress_orders: aliexpressRefs,
    needs_manual_review: anyFailed,
  })
}
