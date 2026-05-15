import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getOrders } from '@/lib/actions/orders'

export async function GET(req: NextRequest) {
  const cookie = cookies().get('zarpitas_admin')
  if (!cookie?.value || cookie.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const service = req.nextUrl.searchParams.get('service')

  if (service === 'stripe') {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) return NextResponse.json({ error: 'STRIPE_SECRET_KEY not set' }, { status: 500 })
    try {
      const res = await fetch('https://api.stripe.com/v1/payment_methods?limit=1', {
        headers: { Authorization: `Bearer ${key}` },
      })
      if (res.ok || res.status === 200) return NextResponse.json({ ok: true })
      const body = await res.json()
      return NextResponse.json({ error: body?.error?.message ?? `HTTP ${res.status}` }, { status: 500 })
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 })
    }
  }

  if (service === 'supabase') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return NextResponse.json({ error: 'Supabase env vars not set' }, { status: 500 })
    try {
      const res = await fetch(`${url}/rest/v1/products?select=id&limit=1`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      })
      if (res.ok) return NextResponse.json({ ok: true })
      return NextResponse.json({ error: `HTTP ${res.status}` }, { status: 500 })
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 })
    }
  }

  if (service === 'orders') {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return NextResponse.json({ error: 'Supabase env vars not set' }, { status: 500 })
    try {
      const res = await fetch(`${url}/rest/v1/orders?select=id,status,customer_email,created_at,needs_manual_review&order=created_at.desc`, {
        headers: { apikey: key, Authorization: `Bearer ${key}`, 'Range-Unit': 'items', Prefer: 'count=exact' },
      })
      const data = await res.json()
      return NextResponse.json({ count: Array.isArray(data) ? data.length : 0, orders: data })
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 })
    }
  }

  if (service === 'orders-sdk') {
    try {
      const orders = await getOrders()
      return NextResponse.json({ count: orders.length, ids: orders.map((o) => o.id) })
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Unknown service' }, { status: 400 })
}
