import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getIp } from '@/lib/rateLimit'

export interface ScrapedProduct {
  id: string
  name: string
  price: number
  originalPrice: number | null
  images: string[]
  description: string
}

async function scrapeAliExpressProduct(productId: string): Promise<ScrapedProduct> {
  const url = `https://www.aliexpress.com/item/${productId}.html`

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9,en;q=0.8',
      'Cache-Control': 'no-cache',
    },
  })

  if (!res.ok) throw new Error(`AliExpress page returned ${res.status}`)

  const html = await res.text()

  // Try to extract window.runParams JSON blob
  const runParamsMatch = html.match(/window\.runParams\s*=\s*(\{[\s\S]*?\});\s*(?:window|var|<\/script>)/)
  if (runParamsMatch) {
    try {
      const data = JSON.parse(runParamsMatch[1])
      const d = data?.data ?? data

      const name: string =
        d?.productInfoComponent?.subject ??
        d?.subject ??
        d?.title ??
        ''

      const priceComp = d?.priceComponent ?? d?.price ?? {}
      const priceStr: string =
        priceComp?.discountPrice?.minActivityAmount?.value ??
        priceComp?.originalPrice?.minAmount?.value ??
        priceComp?.salePriceString ??
        '0'
      const origStr: string =
        priceComp?.originalPrice?.minAmount?.value ??
        priceComp?.originalPriceString ??
        ''

      const imageComp = d?.imageComponent ?? d?.image ?? {}
      const images: string[] = (
        imageComp?.imagePathList ??
        imageComp?.images ??
        d?.imagePathList ??
        []
      ).map((img: string) => (img.startsWith('//') ? `https:${img}` : img))

      return {
        id: productId,
        name,
        price: parseFloat(priceStr) || 0,
        originalPrice: origStr ? parseFloat(origStr) : null,
        images,
        description: d?.productDescComponent?.descriptionUrl ?? '',
      }
    } catch {
      // fall through to next strategy
    }
  }

  // Fallback: extract from meta tags
  const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/)?.[1] ?? ''
  const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)?.[1] ?? ''
  const priceMatch = html.match(/"price"\s*:\s*"?([\d.]+)"?/) ??
    html.match(/class="[^"]*price[^"]*"[^>]*>\s*(?:€|US\$|EUR)?\s*([\d.,]+)/)
  const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0

  if (!ogTitle) throw new Error('No se pudo extraer datos del producto. Es posible que AliExpress haya bloqueado la solicitud.')

  return {
    id: productId,
    name: ogTitle,
    price,
    originalPrice: null,
    images: ogImage ? [ogImage] : [],
    description: '',
  }
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
    const product = await scrapeAliExpressProduct(id)
    return NextResponse.json(product)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
