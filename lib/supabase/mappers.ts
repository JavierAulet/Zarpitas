import type { ProductRow } from './types'
import type { Product } from '@/types'

export function rowToProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    originalPrice: row.original_price ?? undefined,
    image: row.image,
    images: row.images ?? [],
    category: row.category,
    subcategory: row.subcategory ?? '',
    badge: row.badge ?? undefined,
    rating: row.rating,
    reviews: row.reviews,
    description: row.description ?? '',
    features: row.features ?? [],
    aliexpressId: row.aliexpress_id ?? undefined,
    stock: row.stock,
    showInBoth: row.show_in_both,
  }
}
