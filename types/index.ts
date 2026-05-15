export interface Product {
  id: string
  name: string
  price: number
  originalPrice?: number
  image: string | null
  images?: string[]
  category: 'perros' | 'gatos'
  subcategory: string
  badge?: 'nuevo' | 'oferta' | 'mas-vendido'
  rating: number
  reviews: number
  description: string
  features?: string[]
  aliexpressId?: string
  stock?: number
  showInBoth?: boolean
}

export interface VariantProperty {
  name: string
  value: string
}

export interface ProductVariant {
  id: string
  name: string
  priceModifier: number
  stock: number
  aliexpressSkuId?: string
  sku_attr?: string
  properties?: VariantProperty[]
}

export interface CartItem {
  id: string          // composite: productId or `${productId}_${variantId}`
  productId: string   // real product id
  name: string
  price: number
  originalPrice?: number
  image: string | null
  images?: string[]
  category: 'perros' | 'gatos'
  subcategory: string
  badge?: 'nuevo' | 'oferta' | 'mas-vendido'
  rating: number
  reviews: number
  description: string
  features?: string[]
  aliexpressId?: string
  stock?: number
  quantity: number
  variantId?: string
  variantName?: string
  aliexpressSkuId?: string
  sku_attr?: string
}

export interface Testimonial {
  id: string
  name: string
  pet: string
  petType: 'perro' | 'gato'
  text: string
  rating: number
  avatar: string
  location: string
}

export interface Category {
  id: string
  name: string
  slug: string
  image: string
  description: string
  count: number
}

export type FilterCategory = 'todos' | 'perros' | 'gatos'
export type SortOption = 'relevancia' | 'precio-asc' | 'precio-desc' | 'valoracion'
export type PriceRange = 'todos' | 'menos-30' | '30-60' | 'mas-60'
