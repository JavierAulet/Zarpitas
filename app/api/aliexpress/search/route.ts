import { NextRequest, NextResponse } from 'next/server'
import { searchAliExpressProducts } from '@/lib/aliexpress/client'
import { rateLimit, getIp } from '@/lib/rateLimit'

export async function GET(req: NextRequest) {
  const { success } = rateLimit(getIp(req), 20, 60_000)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const q = req.nextUrl.searchParams.get('q')
  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter q' }, { status: 400 })
  }

  const page = parseInt(req.nextUrl.searchParams.get('page') ?? '1', 10)
  const size = Math.min(parseInt(req.nextUrl.searchParams.get('size') ?? '20', 10), 50)
  const sort = (req.nextUrl.searchParams.get('sort') ?? 'LAST_VOLUME_DESC') as
    | 'SALE_PRICE_ASC'
    | 'SALE_PRICE_DESC'
    | 'LAST_VOLUME_DESC'
  const category_id = req.nextUrl.searchParams.get('category') ?? undefined

  try {
    const result = await searchAliExpressProducts(q, {
      page_index: page,
      page_size: size,
      sort,
      category_id,
    })
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
