import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getIp } from '@/lib/rateLimit'

const API_URL = process.env.ALIEXPRESS_API_URL ?? 'http://localhost:3001'

export async function GET(req: NextRequest) {
  const { success } = rateLimit(getIp(req), 20, 60_000)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  const q = req.nextUrl.searchParams.get('q')
  if (!q) {
    return NextResponse.json({ error: 'Missing query parameter q' }, { status: 400 })
  }

  const params = new URLSearchParams({ q })
  const page = req.nextUrl.searchParams.get('page')
  const size = req.nextUrl.searchParams.get('size')
  const sort = req.nextUrl.searchParams.get('sort')
  const category = req.nextUrl.searchParams.get('category')
  if (page) params.set('page', page)
  if (size) params.set('size', size)
  if (sort) params.set('sort', sort)
  if (category) params.set('category', category)

  try {
    const res = await fetch(`${API_URL}/search?${params.toString()}`, {
      next: { revalidate: 0 },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
