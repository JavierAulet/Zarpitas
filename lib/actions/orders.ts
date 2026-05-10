'use server'
import { revalidatePath } from 'next/cache'
import { createServiceClient as createServerClient } from '@/lib/supabase/server'
import { sendShippingNotification } from '@/lib/email'
import type { OrderInsert, OrderStatus, OrderRow } from '@/lib/supabase/types'

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
  const { error } = await db
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
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
