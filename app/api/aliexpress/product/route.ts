export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit, getIp } from '@/lib/rateLimit'

const API_URL = process.env.ALIEXPRESS_API_URL ?? 'http://localhost:3001'

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
    const res = await fetch(`${API_URL}/product?id=${encodeURIComponent(id)}`, {
      next: { revalidate: 0 },
    })
    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 502 })
  }
}

