'use server'
import { revalidatePath } from 'next/cache'
import { createServiceClient as createServerClient } from '@/lib/supabase/server'
import type { OrderInsert, OrderStatus } from '@/lib/supabase/types'

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
  revalidatePath('/admin/pedidos')
}
