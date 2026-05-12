import { NextRequest, NextResponse } from 'next/server'
import { saveOrder } from '@/lib/actions/orders'
import type { OrderInsert } from '@/lib/supabase/types'
import { rateLimit, getIp } from '@/lib/rateLimit'

export async function POST(request: NextRequest) {
  const { success } = rateLimit(getIp(request), 10, 60_000)
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const body: OrderInsert = await request.json()
    const id = await saveOrder(body)
    return NextResponse.json({ id })
  } catch (err) {
    console.error('Order save failed:', err)
    return NextResponse.json({ error: 'Could not save order' }, { status: 500 })
  }
}
