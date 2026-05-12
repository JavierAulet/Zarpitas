import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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

  return NextResponse.json({ error: 'Unknown service' }, { status: 400 })
}
