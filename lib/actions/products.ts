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

// Columns that may not exist yet if migrations haven't run
const OPTIONAL_COLUMNS = ['sku'] as const
type OptionalColumn = typeof OPTIONAL_COLUMNS[number]

function stripOptional<T extends Record<string, unknown>>(obj: T): Omit<T, OptionalColumn> {
  const copy = { ...obj }
  for (const col of OPTIONAL_COLUMNS) delete (copy as Record<string, unknown>)[col]
  return copy as Omit<T, OptionalColumn>
}

// Returns true if the error is a PostgREST "column does not exist" for an optional column
function isMissingColumnError(msg: string): boolean {
  return OPTIONAL_COLUMNS.some((col) => msg.includes(`"${col}"`) || msg.includes(`'${col}'`) || msg.includes(` ${col} `))
}

export async function createProduct(product: ProductInsert) {
  const db = createServerClient()
  let { error } = await db.from('products').insert(product)
  if (error && isMissingColumnError(error.message)) {
    // Migration not run yet — retry without optional columns
    const { error: e2 } = await db.from('products').insert(stripOptional(product))
    error = e2
  }
  if (error) throw new Error(error.message)
  revalidatePath('/admin/productos')
  revalidatePath('/productos')
}

export async function updateProduct(id: string, product: ProductUpdate) {
  const db = createServerClient()
  const update = { ...product, updated_at: new Date().toISOString() }
  let { error } = await db.from('products').update(update).eq('id', id)
  if (error && isMissingColumnError(error.message)) {
    // Migration not run yet — retry without optional columns
    const { error: e2 } = await db.from('products').update(stripOptional(update)).eq('id', id)
    error = e2
  }
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
