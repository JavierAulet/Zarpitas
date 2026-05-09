import { NextRequest, NextResponse } from 'next/server'
import { getAliExpressProduct } from '@/lib/aliexpress/client'
import { rateLimit, getIp } from '@/lib/rateLimit'

export async function GET(req: NextRequest) {
  const { success } = rateLimit(getIp(req), 20, 60_000)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing product id' }, { status: 400 })
  }

  const country = req.nextUrl.searchParams.get('country') ?? 'ES'
  const language = req.nextUrl.searchParams.get('language') ?? 'es'

  try {
    const product = await getAliExpressProduct(id, country, language)
    return NextResponse.json(product)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
