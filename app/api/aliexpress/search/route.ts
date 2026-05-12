import { NextRequest, NextResponse } from 'next/server'
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
  const sort = req.nextUrl.searchParams.get('sort') ?? 'LAST_VOLUME_DESC'
  const category_id = req.nextUrl.searchParams.get('category') ?? undefined

  try {
    const apiUrl = process.env.ALIEXPRESS_API_URL
    if (!apiUrl) throw new Error('ALIEXPRESS_API_URL not configured')

    const params = new URLSearchParams({ q, page: String(page), size: String(size), sort })
    if (category_id) params.set('category', category_id)

    const res = await fetch(`${apiUrl}/search?${params}`)
    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: data.error ?? 'API error' }, { status: res.status })
    }

    return NextResponse.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
