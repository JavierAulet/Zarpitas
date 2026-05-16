'use server'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/server'
import type { ProductVariantRow, ProductVariantInsert } from '@/lib/supabase/types'

export async function getProductVariants(productId: string): Promise<ProductVariantRow[]> {
  const db = createServiceClient()
  const { data } = await db
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order')
  return data ?? []
}

export async function createVariant(variant: ProductVariantInsert): Promise<void> {
  const db = createServiceClient()
  const { error } = await db.from('product_variants').insert(variant)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/productos/${variant.product_id}`)
  revalidatePath(`/productos/${variant.product_id}`)
}

export async function updateVariant(id: string, variant: Partial<ProductVariantInsert> & { active?: boolean; display_name?: string | null }): Promise<void> {
  const db = createServiceClient()
  const { error } = await db.from('product_variants').update(variant).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function deleteVariant(id: string, productId: string): Promise<void> {
  const db = createServiceClient()
  const { error } = await db.from('product_variants').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(`/admin/productos/${productId}`)
  revalidatePath(`/productos/${productId}`)
}

export async function deleteVariantsByProductId(productId: string): Promise<void> {
  const db = createServiceClient()
  const { error } = await db.from('product_variants').delete().eq('product_id', productId)
  if (error) throw new Error(error.message)
}
