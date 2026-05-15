import { NextRequest, NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'

function sign(params: Record<string, string>, secret: string): string {
  const concatenated = Object.keys(params)
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join('')
  return createHmac('sha256', secret).update(concatenated).digest('hex').toUpperCase()
}

// Handles all known AliExpress response shapes
function extractTokenFields(data: Record<string, unknown>): {
  access_token?: string
  refresh_token?: string
  expire_time?: number
} {
  // Unwrap nested objects in order of likelihood
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
  const state = req.nextUrl.searchParams.get('state')
  const aeError = req.nextUrl.searchParams.get('error')

  console.log('[OAuth callback] code:', code ? `${code.slice(0, 10)}... (length: ${code.length})` : 'MISSING')
  console.log('[OAuth callback] state:', state ?? 'none')
  console.log('[OAuth callback] error param:', aeError ?? 'none')

  if (aeError) {
    console.error('[OAuth callback] AliExpress returned error param:', aeError)
    return NextResponse.redirect(new URL(`/admin/configuracion?oauth=error&reason=${encodeURIComponent(aeError)}`, req.url))
  }

  if (!code) {
    console.error('[OAuth callback] No code received in callback')
    return NextResponse.redirect(new URL('/admin/configuracion?oauth=error&reason=no_code', req.url))
  }

  const appKey = process.env.ALIEXPRESS_APP_KEY ?? '533884'
  const appSecret = (process.env.ALIEXPRESS_APP_SECRET ?? '').trim()

  console.log('[OAuth callback] appKey:', appKey)
  console.log('[OAuth callback] appSecret set:', !!appSecret, '| length:', appSecret.length)

  if (!appSecret) {
    console.error('[OAuth callback] ALIEXPRESS_APP_SECRET is not configured')
    return NextResponse.redirect(new URL('/admin/configuracion?oauth=error&reason=no_secret', req.url))
  }

  const timestamp = Date.now().toString()
  const params: Record<string, string> = {
    app_key: appKey,
    app_secret: appSecret,
    code,
    grant_type: 'authorization_code',
    sign_method: 'sha256',
    timestamp,
  }

  const signature = sign(params, appSecret)

  const redactedParams = Object.keys(params)
    .sort()
    .map((k) => `${k}=${k === 'app_secret' ? '***' : params[k]}`)
    .join('&')
  console.log('[OAuth callback] Params to sign (sorted, secret redacted):', redactedParams)
  console.log('[OAuth callback] Signature:', signature)

  const body = new URLSearchParams({ ...params, sign: signature })
  const tokenUrl = 'https://api-sg.aliexpress.com/rest/auth/token/create'

  console.log('[OAuth callback] ── Calling AliExpress ────────────────────────')
  console.log('[OAuth callback] POST', tokenUrl)

  let rawText: string
  let httpStatus: number
  try {
    const res = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
      body: body.toString(),
    })
    httpStatus = res.status
    rawText = await res.text()
  } catch (err) {
    console.error('[OAuth callback] Fetch error:', err)
    return NextResponse.redirect(new URL('/admin/configuracion?oauth=error&reason=fetch_failed', req.url))
  }

  console.log('[OAuth callback] HTTP status:', httpStatus)
  console.log('[OAuth callback] Raw response:', rawText)

  if (httpStatus !== 200) {
    return NextResponse.redirect(
      new URL(`/admin/configuracion?oauth=error&reason=http_${httpStatus}&raw=${encodeURIComponent(rawText.slice(0, 200))}`, req.url)
    )
  }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(rawText)
  } catch {
    console.error('[OAuth callback] JSON parse failed, raw:', rawText.slice(0, 400))
    return NextResponse.redirect(new URL('/admin/configuracion?oauth=error&reason=parse_error', req.url))
  }

  console.log('[OAuth callback] ── Parsed response ──────────────────────────')
  console.log('[OAuth callback] Top-level keys:', Object.keys(data).join(', '))
  console.log('[OAuth callback] Full response:', JSON.stringify(data))

  if (data.error_response) {
    const errObj = data.error_response as Record<string, unknown>
    const errMsg = String(errObj.msg ?? errObj.error_code ?? 'unknown')
    console.error('[OAuth callback] error_response:', JSON.stringify(errObj))
    return NextResponse.redirect(
      new URL(`/admin/configuracion?oauth=error&reason=ae_error&msg=${encodeURIComponent(errMsg)}`, req.url)
    )
  }

  const { access_token, refresh_token, expire_time } = extractTokenFields(data)

  console.log('[OAuth callback] access_token found:', !!access_token)
  console.log('[OAuth callback] refresh_token found:', !!refresh_token)
  console.log('[OAuth callback] expire_time:', expire_time)

  if (!access_token) {
    const raw = JSON.stringify(data).slice(0, 300)
    console.error('[OAuth callback] No access_token in any known field. Full response:', raw)
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
