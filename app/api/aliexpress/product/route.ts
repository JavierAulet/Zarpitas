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

function parseRunParams(html: string): ScrapedProduct | null {
  // Try window.runParams
  const patterns = [
    /window\.runParams\s*=\s*(\{[\s\S]*?\});\s*(?:window|var\s|<\/script>)/,
    /"data"\s*:\s*(\{[\s\S]*?"productInfoComponent"[\s\S]*?\})\s*,\s*"[\w]+"\s*:/,
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (!match) continue
    try {
      const raw = JSON.parse(match[1])
      const d = raw?.data ?? raw

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
        ''

      const imageComp = d?.imageComponent ?? d?.image ?? {}
      const rawImages: string[] =
        imageComp?.imagePathList ??
        imageComp?.images ??
        d?.imagePathList ??
        []

      const images = rawImages.map((img: string) =>
        img.startsWith('//') ? `https:${img}` : img
      )

      if (!name && !priceStr && !images.length) continue

      return {
        id: '',
        name,
        price: priceStr ? parseFloat(priceStr) : 0,
        originalPrice: null,
        images,
        description: '',
      }
    } catch {
      continue
    }
  }
  return null
}

async function tryFetch(url: string, extraHeaders?: Record<string, string>): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'es-ES,es;q=0.9',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      ...extraHeaders,
    },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.text()
}

async function scrapeAliExpressProduct(productId: string): Promise<ScrapedProduct> {
  const urls = [
    `https://m.aliexpress.com/item/${productId}.html`,
    `https://www.aliexpress.com/item/${productId}.html`,
    `https://es.aliexpress.com/item/${productId}.html`,
  ]

  for (const url of urls) {
    try {
      const html = await tryFetch(url)
      const parsed = parseRunParams(html)
      if (parsed) {
        parsed.id = productId
        return parsed
      }

      // Fallback: og tags
      const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/)?.[1] ?? ''
      const ogImage = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/)?.[1] ?? ''
      if (ogTitle) {
        return {
          id: productId,
          name: ogTitle,
          price: 0,
          originalPrice: null,
          images: ogImage ? [ogImage] : [],
          description: '',
        }
      }
    } catch {
      continue
    }
  }

  throw new Error('BLOCKED')
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
