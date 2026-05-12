import { NextRequest, NextResponse } from 'next/server'
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

  try {
    const apiUrl = process.env.ALIEXPRESS_API_URL
    if (!apiUrl) throw new Error('ALIEXPRESS_API_URL not configured')

    const res = await fetch(`${apiUrl}/product?id=${id}`)
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
