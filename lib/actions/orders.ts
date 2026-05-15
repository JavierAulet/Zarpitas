'use server'
import { revalidatePath, unstable_noStore as noStore } from 'next/cache'
import { createServiceClient as createServerClient } from '@/lib/supabase/server'
import { sendShippingNotification } from '@/lib/email'
import type { OrderInsert, OrderStatus, OrderRow } from '@/lib/supabase/types'

export async function linkGuestOrders(userId: string, email: string): Promise<void> {
  const db = createServerClient()
  await db
    .from('orders')
    .update({ user_id: userId, updated_at: new Date().toISOString() })
    .eq('customer_email', email)
    .is('user_id', null)
}

export async function saveOrder(order: OrderInsert) {
  const db = createServerClient()
  const { data, error } = await db
    .from('orders')
    .insert(order)
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id as string
}

export async function getOrders() {
  noStore()
  const db = createServerClient()
  const { data, error } = await db
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function updateOrderStatus(id: string, status: OrderStatus) {
  const db = createServerClient()
  const clearReview = ['processing', 'shipped', 'delivered'].includes(status)
  const { error } = await db
    .from('orders')
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...(clearReview ? { needs_manual_review: false } : {}),
    })
    .eq('id', id)
  if (error) throw new Error(error.message)

  if (status === 'shipped') {
    const { data: order } = await db.from('orders').select('*').eq('id', id).single()
    if (order) {
      const o = order as OrderRow
      void sendShippingNotification({
        id: o.id,
        customer_email: o.customer_email,
        customer_name: o.customer_name,
        shipping_address: o.shipping_address,
        items: o.items,
        subtotal: o.subtotal,
        shipping: o.shipping,
        total: o.total,
      })
    }
  }

  revalidatePath('/admin/pedidos')
}
