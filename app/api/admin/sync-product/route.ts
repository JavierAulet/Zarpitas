import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'

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
  sku_image?: string
}

interface SkuDto {
  sku_id?: string
  sku_attr?: string
  offer_sale_price?: string
  sku_available_stock?: number
  ae_sku_property_dtos?: { ae_sku_property_d_t_o?: SkuProperty[] }
}

function parseVpsResponse(raw: {
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
  const minPriceUsd = skuPrices.length > 0 ? Math.min(...skuPrices) : 0
  const costPriceEur = parseFloat((minPriceUsd * USD_TO_EUR).toFixed(2))
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
        .map((p) => ({
          name: p.sku_property_name!,
          value: (p.property_value_definition_name ?? p.sku_property_value)!,
          ...(p.sku_image ? { image: p.sku_image } : {}),
        })),
    }))

  return { name, images, costPriceEur, stock, description, skus }
}

export async function POST(req: NextRequest) {
  const cookie = cookies().get('zarpitas_admin')
  if (!cookie?.value || cookie.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { product_id, aliexpress_id } = await req.json()
  if (!product_id || !aliexpress_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const apiUrl = process.env.ALIEXPRESS_API_URL
  if (!apiUrl) {
    return NextResponse.json({ error: 'ALIEXPRESS_API_URL not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(`${apiUrl}/product?id=${aliexpress_id}&country=ES&language=es`)
    const raw = await res.json()
    if (!res.ok) throw new Error(raw.error ?? 'VPS API error')

    // Parse official AliExpress API format
    if (!raw.result?.ae_item_base_info_dto) {
      return NextResponse.json({ error: 'Unexpected API response format' }, { status: 502 })
    }

    const { name, images, costPriceEur, stock, description, skus } = parseVpsResponse(raw)

    const db = createServiceClient()

    // Get current product to calculate sale price ratio
    const { data: currentProduct } = await db
      .from('products')
      .select('price, cost_price')
      .eq('id', product_id)
      .single()

    // Determine sale price: keep existing ratio or default to 2.5x
    const ratio =
      currentProduct?.cost_price && currentProduct?.price
        ? currentProduct.price / currentProduct.cost_price
        : 2.5

    // Base price on cheapest property-SKU so modifiers are never negative
    const skusWithPropsForPrice = skus.filter((s) => s.properties.length > 0)
    const baseCost = skusWithPropsForPrice.length > 0
      ? Math.min(...skusWithPropsForPrice.map((s) => s.price))
      : costPriceEur
    const effectiveCost = baseCost > 0 ? baseCost : costPriceEur

    const newSalePrice = effectiveCost > 0
      ? parseFloat((effectiveCost * ratio).toFixed(2))
      : currentProduct?.price ?? 0

    // Update product
    const updates: Record<string, unknown> = {
      stock,
      updated_at: new Date().toISOString(),
    }
    if (images.length > 0) {
      updates.image = images[0]
      updates.images = images
    }
    if (costPriceEur > 0) {
      updates.cost_price = costPriceEur
      updates.price = newSalePrice
    }
    if (description) updates.description = description

    const { error: updateError } = await db.from('products').update(updates).eq('id', product_id)
    if (updateError) throw updateError

    // Sync variants: delete AliExpress-sourced variants, then re-insert
    const skusWithProps = skus.filter((s) => s.properties.length > 0)
    if (skusWithProps.length > 0) {
      // Delete existing AliExpress variants (those with sku field set)
      await db.from('product_variants').delete().eq('product_id', product_id).not('sku', 'is', null)

      // Insert new variants
      const rows = skusWithProps.map((s, i) => ({
        product_id,
        name: s.properties.map((p) => p.value).join(' / '),
        sku: s.sku_id,
        sku_attr: s.sku_attr || null,
        price_modifier: Math.max(0, parseFloat((s.price * ratio - newSalePrice).toFixed(2))),
        stock: s.stock,
        active: true,
        sort_order: i,
        properties: s.properties,
      }))

      const { error: variantError } = await db.from('product_variants').insert(rows)
      if (variantError) throw variantError
    }

    return NextResponse.json({
      ok: true,
      cost_price: costPriceEur,
      sale_price: newSalePrice,
      stock,
      variants_synced: skusWithProps.length,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
