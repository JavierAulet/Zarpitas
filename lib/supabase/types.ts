export interface ProductRow {
  id: string
  sku: string | null
  name: string
  price: number
  original_price: number | null
  cost_price: number | null
  image: string | null
  images: string[]
  category: 'perros' | 'gatos'
  subcategory: string | null
  badge: 'nuevo' | 'oferta' | 'mas-vendido' | null
  rating: number
  reviews: number
  description: string | null
  features: string[]
  aliexpress_id: string | null
  stock: number
  active: boolean
  show_in_both: boolean
  created_at: string
  updated_at: string
}

export interface ProductInsert {
  id: string
  sku?: string | null
  name: string
  price: number
  original_price?: number | null
  cost_price?: number | null
  image?: string | null
  images?: string[]
  category: 'perros' | 'gatos'
  subcategory?: string | null
  badge?: 'nuevo' | 'oferta' | 'mas-vendido' | null
  rating?: number
  reviews?: number
  description?: string | null
  features?: string[]
  aliexpress_id?: string | null
  stock?: number
  active?: boolean
  show_in_both?: boolean
}

export interface ProductUpdate extends Partial<ProductInsert> {}

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled'

export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  image: string
  aliexpress_id?: string
  aliexpressSkuId?: string
}

export interface ShippingAddress {
  firstName: string
  lastName: string
  address: string
  city: string
  postalCode: string
  province: string
}

export interface AliExpressOrderRef {
  product_id: string
  aliexpress_order_id: number
}

export interface TrackingEvent {
  event_date: string
  event_desc: string
  address: string
}

export interface OrderRow {
  id: string
  customer_email: string
  customer_name: string
  customer_phone: string | null
  user_id: string | null
  shipping_address: ShippingAddress
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  status: OrderStatus
  stripe_payment_intent_id: string | null
  aliexpress_order_id: string | null
  aliexpress_order_ids: AliExpressOrderRef[]
  needs_manual_review: boolean
  tracking_number: string | null
  tracking_carrier: string | null
  tracking_events: TrackingEvent[]
  notes: string | null
  confirmed_at: string | null
  shipped_at: string | null
  created_at: string
  updated_at: string
}

export interface BlogPostRow {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string | null
  featured_image_url: string | null
  category: string
  status: 'draft' | 'published'
  meta_title: string | null
  meta_description: string | null
  read_time: number
  views: number
  related_product_ids: string[]
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface BlogPostInsert {
  title: string
  slug: string
  content: string
  excerpt?: string | null
  featured_image_url?: string | null
  category?: string
  status?: 'draft' | 'published'
  meta_title?: string | null
  meta_description?: string | null
  read_time?: number
  related_product_ids?: string[]
  published_at?: string | null
}

export interface VariantProperty {
  name: string
  value: string
}

export interface ProductVariantRow {
  id: string
  product_id: string
  name: string
  sku: string | null
  price_modifier: number
  stock: number
  active: boolean
  sort_order: number
  properties: VariantProperty[] | null
  created_at: string
}

export interface ProductVariantInsert {
  product_id: string
  name: string
  sku?: string | null
  price_modifier?: number
  stock?: number
  active?: boolean
  sort_order?: number
  properties?: VariantProperty[] | null
}

export interface OrderInsert {
  customer_email: string
  customer_name: string
  customer_phone?: string | null
  user_id?: string | null
  shipping_address: ShippingAddress
  items: OrderItem[]
  subtotal: number
  shipping: number
  total: number
  status?: OrderStatus
}
