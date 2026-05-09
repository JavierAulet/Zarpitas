'use server'
import { revalidatePath } from 'next/cache'
import { createServiceClient as createServerClient } from '@/lib/supabase/server'
import type { ProductInsert, ProductUpdate } from '@/lib/supabase/types'
import type { Product } from '@/types'
import { rowToProduct } from '@/lib/supabase/mappers'

export async function getProducts() {
  const db = createServerClient()
  const { data, error } = await db
    .from('products')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data
}

export async function getActiveProducts(): Promise<Product[]> {
  const db = createServerClient()
  const { data, error } = await db
    .from('products')
    .select('*')
    .eq('active', true)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return (data ?? []).map(rowToProduct)
}

export async function getProduct(id: string) {
  const db = createServerClient()
  const { data, error } = await db
    .from('products')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function getActiveProduct(id: string): Promise<Product | null> {
  const db = createServerClient()
  const { data, error } = await db
    .from('products')
    .select('*')
    .eq('id', id)
    .eq('active', true)
    .single()
  if (error) return null
  return rowToProduct(data)
}

export async function createProduct(product: ProductInsert) {
  const db = createServerClient()
  const { error } = await db.from('products').insert(product)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/productos')
  revalidatePath('/productos')
}

export async function updateProduct(id: string, product: ProductUpdate) {
  const db = createServerClient()
  const { error } = await db
    .from('products')
    .update({ ...product, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/productos')
  revalidatePath('/productos')
  revalidatePath(`/productos/${id}`)
}

export async function toggleProductActive(id: string, active: boolean) {
  const db = createServerClient()
  const { error } = await db
    .from('products')
    .update({ active, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/productos')
  revalidatePath('/productos')
}

export async function deleteProduct(id: string) {
  const db = createServerClient()
  const { error } = await db.from('products').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath('/admin/productos')
  revalidatePath('/productos')
}
