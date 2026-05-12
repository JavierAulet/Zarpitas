export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST() {
  const db = createServiceClient()

  const { data: token } = await db
    .from('aliexpress_tokens')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!token?.refresh_token) {
    return NextResponse.json({ error: 'No refresh token available' }, { status: 400 })
  }

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: token.refresh_token,
    client_id: process.env.ALIEXPRESS_APP_KEY ?? '533884',
    client_secret: process.env.ALIEXPRESS_APP_SECRET ?? '',
  })

  const res = await fetch('https://oauth.aliexpress.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    return NextResponse.json({ error: `Token refresh failed: ${res.status}` }, { status: 502 })
  }

  const data = await res.json()
  const { access_token, refresh_token, expire_time } = data as {
    access_token: string
    refresh_token?: string
    expire_time?: number
  }

  if (!access_token) {
    return NextResponse.json({ error: 'No access_token in response' }, { status: 502 })
  }

  const expiresAt = expire_time
    ? new Date(expire_time).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { error } = await db.from('aliexpress_tokens').insert({
    access_token,
    refresh_token: refresh_token ?? token.refresh_token,
    expires_at: expiresAt,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, expires_at: expiresAt })
}

