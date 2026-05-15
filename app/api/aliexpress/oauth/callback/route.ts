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

export async function GET(req: NextRequest) {
  console.log('[OAuth callback] Request received:', req.nextUrl.toString())

  const code = req.nextUrl.searchParams.get('code')
  const state = req.nextUrl.searchParams.get('state')
  const aeError = req.nextUrl.searchParams.get('error')

  console.log('[OAuth callback] Params — code:', code ? `${code.slice(0, 8)}...` : 'MISSING', '| error:', aeError ?? 'none', '| state:', state ?? 'none')

  if (aeError) {
    console.error('[OAuth callback] AliExpress returned error param:', aeError)
    return NextResponse.redirect(new URL(`/admin/configuracion?oauth=error&reason=${encodeURIComponent(aeError)}`, req.url))
  }

  if (!code) {
    console.error('[OAuth callback] No code in callback URL')
    return NextResponse.redirect(new URL('/admin/configuracion?oauth=error&reason=no_code', req.url))
  }

  const appKey = process.env.ALIEXPRESS_APP_KEY ?? '533884'
  const appSecret = (process.env.ALIEXPRESS_APP_SECRET ?? '').trim()

  console.log('[OAuth callback] Config — appKey:', appKey, '| appSecret length:', appSecret.length)

  if (!appSecret) {
    console.error('[OAuth callback] ALIEXPRESS_APP_SECRET env var is not set')
    return NextResponse.redirect(new URL('/admin/configuracion?oauth=error&reason=no_secret', req.url))
  }

  // Params to sign: sorted alphabetically, concatenated as key+value, HMAC-SHA256 with appSecret
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

  // Log full request for debugging
  const sortedParamStr = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join('&')
  console.log('[OAuth callback] Params to sign (sorted):', sortedParamStr.replace(appSecret, '***SECRET***'))
  console.log('[OAuth callback] Computed signature:', signature)

  const body = new URLSearchParams({ ...params, sign: signature })
  const tokenUrl = 'https://api-sg.aliexpress.com/rest/auth/token/create'

  console.log('[OAuth callback] POSTing to:', tokenUrl)
  console.log('[OAuth callback] Full body (redacted):', body.toString().replace(encodeURIComponent(appSecret), '***SECRET***'))

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
    console.error('[OAuth callback] Network error calling AliExpress:', err)
    return NextResponse.redirect(new URL('/admin/configuracion?oauth=error&reason=fetch_failed', req.url))
  }

  console.log('[OAuth callback] Response status:', httpStatus)
  console.log('[OAuth callback] Response body (first 600 chars):', rawText.slice(0, 600))

  if (httpStatus !== 200) {
    console.error('[OAuth callback] Non-200 from AliExpress token endpoint')
    return NextResponse.redirect(new URL('/admin/configuracion?oauth=error&reason=token_exchange', req.url))
  }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(rawText)
  } catch {
    console.error('[OAuth callback] Failed to parse response as JSON:', rawText.slice(0, 300))
    return NextResponse.redirect(new URL('/admin/configuracion?oauth=error&reason=parse_error', req.url))
  }

  console.log('[OAuth callback] Parsed response keys:', Object.keys(data).join(', '))

  // AliExpress wraps failures in error_response
  if (data.error_response) {
    const errObj = data.error_response as Record<string, unknown>
    const errMsg = String(errObj.msg ?? errObj.error_code ?? 'unknown')
    console.error('[OAuth callback] AliExpress error_response:', JSON.stringify(errObj))
    return NextResponse.redirect(
      new URL(`/admin/configuracion?oauth=error&reason=ae_error&msg=${encodeURIComponent(errMsg)}`, req.url)
    )
  }

  const access_token = data.access_token as string | undefined
  const refresh_token = data.refresh_token as string | undefined
  const expire_time = data.expire_time as number | undefined

  console.log('[OAuth callback] access_token present:', !!access_token)
  console.log('[OAuth callback] refresh_token present:', !!refresh_token)
  console.log('[OAuth callback] expire_time:', expire_time)

  if (!access_token) {
    console.error('[OAuth callback] No access_token in response. Full data:', JSON.stringify(data).slice(0, 400))
    return NextResponse.redirect(new URL('/admin/configuracion?oauth=error&reason=no_token', req.url))
  }

  const expiresAt = expire_time
    ? new Date(expire_time).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  console.log('[OAuth callback] Saving token to Supabase — expires_at:', expiresAt)

  const db = createServiceClient()
  const { error: dbError } = await db.from('aliexpress_tokens').insert({
    access_token,
    refresh_token: refresh_token ?? null,
    expires_at: expiresAt,
  })

  if (dbError) {
    console.error('[OAuth callback] Supabase insert failed — code:', dbError.code, '| message:', dbError.message)
    return NextResponse.redirect(
      new URL(`/admin/configuracion?oauth=error&reason=db&msg=${encodeURIComponent(dbError.message)}`, req.url)
    )
  }

  console.log('[OAuth callback] Token saved successfully to aliexpress_tokens')
  return NextResponse.redirect(new URL('/admin/configuracion?oauth=success', req.url))
}
