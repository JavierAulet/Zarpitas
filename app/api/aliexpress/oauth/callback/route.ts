import { NextRequest, NextResponse } from 'next/server'
import { DropshipperClient } from 'ae_sdk'
import { createServiceClient } from '@/lib/supabase/server'

function extractTokenFields(data: Record<string, unknown>): {
  access_token?: string
  refresh_token?: string
  expire_time?: number
} {
  const payload =
    (data.data as Record<string, unknown> | undefined) ??
    (data.result as Record<string, unknown> | undefined) ??
    (data.auth_token_create_response as Record<string, unknown> | undefined) ??
    data
  return {
    access_token: payload.access_token as string | undefined,
    refresh_token: payload.refresh_token as string | undefined,
    expire_time: payload.expire_time as number | undefined,
  }
}

export async function GET(req: NextRequest) {
  console.log('[OAuth callback] ── Request received ──────────────────────────')
  console.log('[OAuth callback] URL:', req.nextUrl.toString())

  const code = req.nextUrl.searchParams.get('code')
  const aeError = req.nextUrl.searchParams.get('error')

  console.log('[OAuth callback] code:', code ? `${code.slice(0, 10)}... (length: ${code.length})` : 'MISSING')
  console.log('[OAuth callback] error param:', aeError ?? 'none')

  if (aeError) {
    console.error('[OAuth callback] AliExpress error param:', aeError)
    return NextResponse.redirect(new URL(`/admin/configuracion?oauth=error&reason=${encodeURIComponent(aeError)}`, req.url))
  }

  if (!code) {
    console.error('[OAuth callback] No code in callback URL')
    return NextResponse.redirect(new URL('/admin/configuracion?oauth=error&reason=no_code', req.url))
  }

  const appKey = process.env.ALIEXPRESS_APP_KEY!
  const appSecret = process.env.ALIEXPRESS_APP_SECRET!

  console.log('[OAuth callback] appKey:', appKey)
  console.log('[OAuth callback] appSecret length:', appSecret?.length ?? 0)

  if (!appKey || !appSecret) {
    console.error('[OAuth callback] Missing ALIEXPRESS_APP_KEY or ALIEXPRESS_APP_SECRET')
    return NextResponse.redirect(new URL('/admin/configuracion?oauth=error&reason=no_credentials', req.url))
  }

  const client = new DropshipperClient({ app_key: appKey, app_secret: appSecret, session: '' })

  console.log('[OAuth callback] ── Calling ae_sdk generateToken ─────────────')

  let tokenResponse: Record<string, unknown>
  try {
    tokenResponse = (await client.generateToken({ code })) as Record<string, unknown>
  } catch (err) {
    console.error('[OAuth callback] ae_sdk generateToken threw:', err)
    return NextResponse.redirect(new URL('/admin/configuracion?oauth=error&reason=sdk_error', req.url))
  }

  console.log('[OAuth callback] ae_sdk response:', JSON.stringify(tokenResponse))

  const { access_token, refresh_token, expire_time } = extractTokenFields(tokenResponse)

  console.log('[OAuth callback] access_token found:', !!access_token)
  console.log('[OAuth callback] refresh_token found:', !!refresh_token)
  console.log('[OAuth callback] expire_time:', expire_time)

  if (!access_token) {
    const raw = JSON.stringify(tokenResponse).slice(0, 300)
    console.error('[OAuth callback] No access_token in response:', raw)
    return NextResponse.redirect(
      new URL(`/admin/configuracion?oauth=error&reason=no_token&raw=${encodeURIComponent(raw)}`, req.url)
    )
  }

  const expiresAt = expire_time
    ? new Date(expire_time).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  console.log('[OAuth callback] ── Saving to Supabase ────────────────────────')
  console.log('[OAuth callback] expires_at:', expiresAt)

  const db = createServiceClient()
  const { data: insertedRows, error: dbError } = await db
    .from('aliexpress_tokens')
    .insert({ access_token, refresh_token: refresh_token ?? null, expires_at: expiresAt })
    .select()

  console.log('[OAuth callback] Supabase insert result:', JSON.stringify(insertedRows))

  if (dbError) {
    console.error('[OAuth callback] Supabase insert error:', JSON.stringify(dbError))
    return NextResponse.redirect(
      new URL(`/admin/configuracion?oauth=error&reason=db&msg=${encodeURIComponent(dbError.message)}`, req.url)
    )
  }

  console.log('[OAuth callback] ── Success! Token saved ───────────────────────')
  return NextResponse.redirect(new URL('/admin/configuracion?oauth=success', req.url))
}
