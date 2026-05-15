import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const USD_TO_EUR = 1 // AliExpress API returns prices in EUR when target_currency=EUR

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

interface SkuProperty {
  sku_property_name?: string
  property_value_definition_name?: string
  sku_property_value?: string
}

interface SkuDto {
  sku_id?: string
  sku_attr?: string
  offer_sale_price?: string
  sku_available_stock?: number
  ae_sku_property_dtos?: { ae_sku_property_d_t_o?: SkuProperty[] }
}

function parseProductData(raw: {
  result?: {
    ae_item_base_info_dto?: { subject?: string; detail?: string }
    ae_multimedia_info_dto?: { image_urls?: string }
    ae_item_sku_info_dtos?: { ae_item_sku_info_d_t_o?: SkuDto[] }
  }
}) {
  const result = raw.result ?? {}
  const baseInfo = result.ae_item_base_info_dto ?? {}
  const mediaInfo = result.ae_multimedia_info_dto ?? {}
  const skuContainer = result.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o ?? []

  const name = baseInfo.subject ?? ''
  const images = (mediaInfo.image_urls ?? '').split(';').map((u) => u.trim()).filter(Boolean)
  const skuPrices = skuContainer.map((s) => parseFloat(s.offer_sale_price ?? '0')).filter((p) => p > 0)
  const minPriceEur = skuPrices.length > 0 ? Math.min(...skuPrices) : 0
  const costPriceEur = parseFloat((minPriceEur * USD_TO_EUR).toFixed(2))
  const stock = skuContainer.reduce((sum, s) => sum + (s.sku_available_stock ?? 0), 0)
  const description = baseInfo.detail ? stripHtml(baseInfo.detail).slice(0, 1000) : ''

  const skus = skuContainer
    .filter((s) => s.sku_id)
    .map((s) => ({
      sku_id: s.sku_id!,
      sku_attr: s.sku_attr ?? '',
      price: parseFloat((parseFloat(s.offer_sale_price ?? '0') * USD_TO_EUR).toFixed(2)),
      stock: s.sku_available_stock ?? 0,
      properties: (s.ae_sku_property_dtos?.ae_sku_property_d_t_o ?? [])
        .filter((p) => p.sku_property_name && (p.property_value_definition_name ?? p.sku_property_value))
        .map((p) => ({ name: p.sku_property_name!, value: (p.property_value_definition_name ?? p.sku_property_value)! })),
    }))

  return { name, images, costPriceEur, stock, description, skus }
}

async function syncProduct(
  db: ReturnType<typeof createServiceClient>,
  apiUrl: string,
  productId: string,
  aliexpressId: string
): Promise<{ ok: boolean; error?: string; stock?: number; variants?: number }> {
  const res = await fetch(`${apiUrl}/product?id=${aliexpressId}&country=ES&language=es`)
  const raw = await res.json()

  if (!res.ok || !raw.result?.ae_item_base_info_dto) {
    return { ok: false, error: raw.error ?? 'No result from VPS' }
  }

  const { name, images, costPriceEur, stock, description, skus } = parseProductData(raw)

  const { data: current } = await db
    .from('products')
    .select('price, cost_price')
    .eq('id', productId)
    .single()

  const ratio = current?.cost_price && current?.price ? current.price / current.cost_price : 2.5
  const newSalePrice = costPriceEur > 0
    ? parseFloat((costPriceEur * ratio).toFixed(2))
    : current?.price ?? 0

  const updates: Record<string, unknown> = { stock, updated_at: new Date().toISOString() }
  if (images.length > 0) { updates.image = images[0]; updates.images = images }
  if (costPriceEur > 0) { updates.cost_price = costPriceEur; updates.price = newSalePrice }
  if (description) updates.description = description

  const { error: updateError } = await db.from('products').update(updates).eq('id', productId)
  if (updateError) return { ok: false, error: updateError.message }

  const skusWithProps = skus.filter((s) => s.properties.length > 0)
  if (skusWithProps.length > 0) {
    await db.from('product_variants').delete().eq('product_id', productId).not('sku', 'is', null)
    const rows = skusWithProps.map((s, i) => ({
      product_id: productId,
      name: s.properties.map((p) => p.value).join(' / '),
      sku: s.sku_id,
      sku_attr: s.sku_attr || null,
      price_modifier: parseFloat((s.price * ratio - newSalePrice).toFixed(2)),
      stock: s.stock,
      active: true,
      sort_order: i,
      properties: s.properties,
    }))
    const { error: variantError } = await db.from('product_variants').insert(rows)
    if (variantError) return { ok: false, error: variantError.message }
  }

  return { ok: true, stock, variants: skusWithProps.length }
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiUrl = process.env.ALIEXPRESS_API_URL
  if (!apiUrl) return NextResponse.json({ error: 'ALIEXPRESS_API_URL not configured' }, { status: 500 })

  const db = createServiceClient()
  const { data: products } = await db
    .from('products')
    .select('id, name, aliexpress_id')
    .eq('active', true)
    .not('aliexpress_id', 'is', null)

  if (!products?.length) return NextResponse.json({ synced: 0, errors: [] })

  const results = await Promise.allSettled(
    products.map((p) => syncProduct(db, apiUrl, p.id, String(p.aliexpress_id)))
  )

  const summary = results.map((r, i) => ({
    product: products[i].name,
    ...(r.status === 'fulfilled' ? r.value : { ok: false, error: String((r as PromiseRejectedResult).reason) }),
  }))

  const synced = summary.filter((s) => s.ok).length
  const errors = summary.filter((s) => !s.ok)

  console.log(`[cron/sync-products] ${synced}/${products.length} synced, ${errors.length} errors`)

  return NextResponse.json({ synced, total: products.length, errors })
}
