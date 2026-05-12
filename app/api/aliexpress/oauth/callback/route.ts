import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/admin/configuracion?oauth=error&reason=no_code', req.url))
  }

  const clientId = process.env.ALIEXPRESS_APP_KEY ?? '533884'
  const clientSecret = process.env.ALIEXPRESS_APP_SECRET ?? ''
  const redirectUri = process.env.ALIEXPRESS_REDIRECT_URI ?? 'https://zarpitas.es/api/aliexpress/oauth/callback'

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  })

  const res = await fetch('https://oauth.aliexpress.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    console.error('[AliExpress OAuth] Token exchange failed:', res.status, await res.text())
    return NextResponse.redirect(new URL('/admin/configuracion?oauth=error&reason=token_exchange', req.url))
  }

  const data = await res.json()
  const { access_token, refresh_token, expire_time } = data as {
    access_token: string
    refresh_token?: string
    expire_time?: number
  }

  if (!access_token) {
    return NextResponse.redirect(new URL('/admin/configuracion?oauth=error&reason=no_token', req.url))
  }

  // expires_at: AliExpress returns expire_time as Unix ms timestamp, or default 30 days
  const expiresAt = expire_time
    ? new Date(expire_time).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const db = createServiceClient()
  const { error } = await db.from('aliexpress_tokens').insert({
    access_token,
    refresh_token: refresh_token ?? null,
    expires_at: expiresAt,
  })

  if (error) {
    console.error('[AliExpress OAuth] DB insert failed:', error)
    return NextResponse.redirect(new URL('/admin/configuracion?oauth=error&reason=db', req.url))
  }

  return NextResponse.redirect(new URL('/admin/configuracion?oauth=success', req.url))
}
