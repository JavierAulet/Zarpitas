import { createHmac } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'

const BASE_URL = 'https://api-sg.aliexpress.com/sync'
const APP_KEY = process.env.ALIEXPRESS_APP_KEY!
const APP_SECRET = (process.env.ALIEXPRESS_APP_SECRET ?? '').trim()

// ─── Token ────────────────────────────────────────────────────────────────────

export async function getAccessToken(): Promise<string | null> {
  try {
    const db = createServiceClient()
    const { data } = await db
      .from('aliexpress_tokens')
      .select('access_token, refresh_token, expires_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!data) return null

    const isExpired = new Date(data.expires_at) <= new Date()
    if (isExpired && data.refresh_token) {
      // Auto-refresh
      const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: data.refresh_token,
        client_id: process.env.ALIEXPRESS_APP_KEY ?? '533884',
        client_secret: process.env.ALIEXPRESS_APP_SECRET ?? '',
      })
      const res = await fetch('https://oauth.aliexpress.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })
      if (res.ok) {
        const refreshed = await res.json() as { access_token: string; refresh_token?: string; expire_time?: number }
        if (refreshed.access_token) {
          await db.from('aliexpress_tokens').insert({
            access_token: refreshed.access_token,
            refresh_token: refreshed.refresh_token ?? data.refresh_token,
            expires_at: refreshed.expire_time
              ? new Date(refreshed.expire_time).toISOString()
              : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          })
          return refreshed.access_token
        }
      }
      return null
    }

    return isExpired ? null : data.access_token
  } catch {
    return null
  }
}

// ─── Signature ────────────────────────────────────────────────────────────────

export function generateSignature(params: Record<string, string>, secret: string): string {
  const concatenated = Object.keys(params)
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join('')
  return createHmac('sha256', secret).update(concatenated).digest('hex').toUpperCase()
}

// ─── Core request ─────────────────────────────────────────────────────────────

async function callAPI<T = unknown>(
  method: string,
  params: Record<string, string>
): Promise<T> {
  const base: Record<string, string> = {
    app_key: APP_KEY,
    timestamp: Date.now().toString(),
    sign_method: 'hmac-sha256',
    format: 'json',
    v: '2.0',
    method,
    ...params,
  }
  base.sign = generateSignature(base, APP_SECRET)

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: new URLSearchParams(base),
    next: { revalidate: 0 },
  })

  if (!res.ok) throw new Error(`AliExpress API error: ${res.status}`)

  const json = await res.json()

  // Unwrap the response envelope: "aliexpress.ds.product.get" → "aliexpress_ds_product_get_response"
  const responseKey = method.replace(/\./g, '_') + '_response'
  if (json[responseKey]) return json[responseKey] as T
  if (json.error_response) throw new Error(json.error_response.msg ?? 'AliExpress error')
  return json as T
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AliExpressProduct {
  id: string
  name: string
  price: number
  originalPrice: number | null
  images: string[]
  description: string
  variants: AliExpressVariant[]
  stock: number
  category_id: string
}

export interface AliExpressVariant {
  sku_id: string
  sku_attr: string
  price: number
  stock: number
  image?: string
}

export interface AliExpressSearchResult {
  products: AliExpressProductSummary[]
  total: number
  page: number
}

export interface AliExpressProductSummary {
  product_id: string
  product_title: string
  sale_price: number
  original_price: number | null
  product_main_image_url: string
  evaluate_rate: string
  lastest_volume: number
}

export interface AliExpressOrderParams {
  out_order_id: string
  logistics_address: {
    country: string
    province: string
    city: string
    zip: string
    address: string
    contact_person: string
    mobile_no: string
    phone_country_code: string
  }
  product_items: Array<{
    product_id: number
    product_count: number
    sku_attr?: string
    logistics_service_name?: string
  }>
}

export interface AliExpressOrderResult {
  success: boolean
  order_list?: Array<{ order_id: number; product_id: number }>
  error?: string
}

export interface AliExpressTrackingInfo {
  logistics_no: string
  carrier: string
  events: Array<{
    event_date: string
    event_desc: string
    address: string
  }>
}

// ─── Product ──────────────────────────────────────────────────────────────────

export async function getAliExpressProduct(
  product_id: string,
  local_country = 'ES',
  local_language = 'es'
): Promise<AliExpressProduct> {
  const raw = await callAPI<Record<string, unknown>>('aliexpress.ds.product.get', {
    product_id,
    local_country,
    local_language,
    country_code: local_country,
  })

  const result = raw.result as Record<string, unknown> | undefined
  if (!result) throw new Error('No result in product response')

  const skus = (result.aeop_ae_product_s_k_us as Record<string, unknown> | undefined)
    ?.global_aeop_ae_product_sku as Array<Record<string, unknown>> | undefined ?? []

  const imageUrls = ((result.image_u_r_ls as string | undefined) ?? '').split(';').filter(Boolean)

  const aePrice = result.aeop_ae_product_price as Record<string, unknown> | undefined
  const price = parseFloat((aePrice?.min_activity_amount as string | undefined) ?? '0')
  const originalPrice = aePrice?.min_amount
    ? parseFloat(aePrice.min_amount as string)
    : null

  const variants: AliExpressVariant[] = skus.map((sku) => ({
    sku_id: String(sku.id ?? ''),
    sku_attr: String(sku.sku_attr ?? ''),
    price: parseFloat(String(sku.offer_sale_price ?? sku.sku_price ?? '0')),
    stock: parseInt(String(sku.ipm_sku_stock ?? '0'), 10),
    image: sku.ae_sku_property_dtos
      ? undefined
      : (sku.sku_image as string | undefined),
  }))

  const totalStock = variants.reduce((sum, v) => sum + v.stock, 0)

  return {
    id: product_id,
    name: String(result.product_title ?? ''),
    price,
    originalPrice,
    images: imageUrls,
    description: String(
      (result.aeop_ae_description as Record<string, unknown> | undefined)?.description ?? ''
    ),
    variants,
    stock: totalStock,
    category_id: String(result.category_id ?? ''),
  }
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchAliExpressProducts(
  keywords: string,
  options?: {
    category_id?: string
    sort?: 'SALE_PRICE_ASC' | 'SALE_PRICE_DESC' | 'LAST_VOLUME_DESC'
    page_index?: number
    page_size?: number
    local_country?: string
    local_language?: string
  }
): Promise<AliExpressSearchResult> {
  const params: Record<string, string> = {
    keywords,
    local_country: options?.local_country ?? 'ES',
    local_language: options?.local_language ?? 'es',
    countryCode: options?.local_country ?? 'ES',
    currency: 'EUR',
    local: options?.local_language ?? 'es',
    sort: options?.sort ?? 'LAST_VOLUME_DESC',
    page_index: String(options?.page_index ?? 1),
    page_size: String(options?.page_size ?? 20),
  }
  if (options?.category_id) params.category_id = options.category_id

  const raw = await callAPI<Record<string, unknown>>('aliexpress.ds.text.search', params)

  const items =
    (raw.data as Record<string, unknown> | undefined)
    ?? (raw as Record<string, unknown>)

  const list = (items.products as Record<string, unknown>[] | undefined) ?? []
  const total = parseInt(String(items.total_count ?? list.length), 10)

  const products: AliExpressProductSummary[] = list.map((p) => ({
    product_id: String(p.product_id ?? ''),
    product_title: String(p.product_title ?? ''),
    sale_price: parseFloat(String(p.target_sale_price ?? p.sale_price ?? '0')),
    original_price: p.original_price
      ? parseFloat(String(p.original_price))
      : null,
    product_main_image_url: String(p.product_main_image_url ?? ''),
    evaluate_rate: String(p.evaluate_rate ?? '0'),
    lastest_volume: parseInt(String(p.lastest_volume ?? '0'), 10),
  }))

  return { products, total, page: options?.page_index ?? 1 }
}

// ─── Order ────────────────────────────────────────────────────────────────────

export async function createAliExpressOrder(
  orderParams: AliExpressOrderParams
): Promise<AliExpressOrderResult> {
  const params: Record<string, string> = {
    param_place_order_request4_open_api_d_t_o: JSON.stringify({
      out_order_id: orderParams.out_order_id,
      logistics_address: orderParams.logistics_address,
      product_items: orderParams.product_items,
    }),
  }

  const raw = await callAPI<Record<string, unknown>>('aliexpress.trade.order.create', params)

  if (raw.result === false || raw.is_success === false) {
    return {
      success: false,
      error: String(raw.error_msg ?? raw.error_code ?? 'Order creation failed'),
    }
  }

  const orderList =
    (raw.order_list as Record<string, unknown>[] | undefined) ??
    ((raw.order_list as Record<string, unknown> | undefined)
      ? [(raw.order_list as Record<string, unknown>)]
      : [])

  return {
    success: true,
    order_list: orderList.map((o) => ({
      order_id: parseInt(String(o.order_id ?? '0'), 10),
      product_id: parseInt(String(o.product_id ?? '0'), 10),
    })),
  }
}

// ─── Tracking ─────────────────────────────────────────────────────────────────

export async function getTrackingInfo(order_id: string): Promise<AliExpressTrackingInfo | null> {
  const raw = await callAPI<Record<string, unknown>>(
    'aliexpress.logistics.order.trackinginfo.query',
    { logistics_no: order_id }
  )

  const details = raw.result as Record<string, unknown> | undefined
  if (!details) return null

  const events = (
    (details.tracking_info as Record<string, unknown> | undefined)
      ?.module as Array<Record<string, unknown>> | undefined ?? []
  ).map((e) => ({
    event_date: String(e.time_detail ?? e.event_date ?? ''),
    event_desc: String(e.event_detail ?? e.status ?? ''),
    address: String(e.address ?? ''),
  }))

  return {
    logistics_no: String(details.logistics_no ?? order_id),
    carrier: String(details.official_website ?? details.company_name ?? ''),
    events,
  }
}
