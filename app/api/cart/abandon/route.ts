export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const { email, items } = await req.json() as {
      email: string
      items: Array<{ name: string; price: number; quantity: number; image?: string | null }>
    }

    if (!email || !items?.length) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const db = createServiceClient()

    // Upsert: if same email abandoned before and email not sent yet, update items
    const { data: existing } = await db
      .from('abandoned_carts')
      .select('id')
      .eq('email', email)
      .eq('email_sent', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existing) {
      await db
        .from('abandoned_carts')
        .update({
          items,
          send_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // reset 1h timer
        })
        .eq('id', existing.id)
      return NextResponse.json({ ok: true })
    }

    await db.from('abandoned_carts').insert({
      email,
      items,
      send_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[AbandonCart] error:', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

