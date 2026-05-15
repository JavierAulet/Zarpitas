import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getIp } from '@/lib/rateLimit'

const USD_TO_EUR = 0.92

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

interface VpsResponse {
  result?: {
    ae_item_base_info_dto?: {
      subject?: string
      detail?: string
      avg_evaluation_rating?: string
      sales_count?: number
    }
    ae_multimedia_info_dto?: {
      image_urls?: string
    }
    ae_item_sku_info_dtos?: {
      ae_item_sku_info_d_t_o?: Array<{
        offer_sale_price?: string
        sku_available_stock?: number
      }>
    }
  }
  rsp_code?: number
}

function parseVpsResponse(raw: VpsResponse) {
  const result = raw.result ?? {}
  const baseInfo = result.ae_item_base_info_dto ?? {}
  const mediaInfo = result.ae_multimedia_info_dto ?? {}
  const skuContainer = result.ae_item_sku_info_dtos?.ae_item_sku_info_d_t_o ?? []

  const name = baseInfo.subject ?? ''

  const images = (mediaInfo.image_urls ?? '')
    .split(';')
    .map((u) => u.trim())
    .filter(Boolean)

  const skuPrices = skuContainer
    .map((s) => parseFloat(s.offer_sale_price ?? '0'))
    .filter((p) => p > 0)
  const minPriceUsd = skuPrices.length > 0 ? Math.min(...skuPrices) : 0
  const priceEur = parseFloat((minPriceUsd * USD_TO_EUR).toFixed(2))

  const stock = skuContainer.reduce((sum, s) => sum + (s.sku_available_stock ?? 0), 0)

  const description = baseInfo.detail ? stripHtml(baseInfo.detail).slice(0, 1000) : ''

  return { name, images, price: priceEur, stock, description }
}

export async function GET(req: NextRequest) {
  const { success } = rateLimit(getIp(req), 20, 60_000)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing product id' }, { status: 400 })
  }

  try {
    const apiUrl = process.env.ALIEXPRESS_API_URL
    if (!apiUrl) throw new Error('ALIEXPRESS_API_URL not configured')

    const res = await fetch(`${apiUrl}/product?id=${id}&country=ES&language=es`)
    const raw = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: raw.error ?? 'API error' }, { status: res.status })
    }

    // If the VPS returns the official API format, parse it
    if (raw.result?.ae_item_base_info_dto) {
      const parsed = parseVpsResponse(raw as VpsResponse)
      return NextResponse.json(parsed)
    }

    // Already normalized (scraping fallback or future format)
    return NextResponse.json(raw)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
