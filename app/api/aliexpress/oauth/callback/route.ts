import { NextRequest, NextResponse } from 'next/server'
import { createHash, createHmac } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'

// Handles all known AliExpress response shapes
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

const TOKEN_URL = 'https://api-sg.aliexpress.com/rest/auth/token/create'

async function tryTokenExchange(
  label: string,
  sign: string,
  params: Record<string, string>,
  asJson: boolean
): Promise<{ ok: boolean; status: number; rawText: string; data?: Record<string, unknown> }> {
  const payload = { ...params, sign }
  const isJson = asJson

  console.log(`[OAuth callback] ── Attempt: ${label} ──────────────────────────`)
  console.log(`[OAuth callback] sign value: ${sign}`)
  console.log(`[OAuth callback] content-type: ${isJson ? 'application/json' : 'application/x-www-form-urlencoded'}`)

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': isJson
        ? 'application/json'
        : 'application/x-www-form-urlencoded;charset=utf-8',
    },
    body: isJson ? JSON.stringify(payload) : new URLSearchParams(payload).toString(),
  })

  const rawText = await res.text()
  console.log(`[OAuth callback] [${label}] HTTP status: ${res.status}`)
  console.log(`[OAuth callback] [${label}] Raw response: ${rawText}`)

  if (!res.ok) return { ok: false, status: res.status, rawText }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(rawText)
  } catch {
    console.error(`[OAuth callback] [${label}] JSON parse failed`)
    return { ok: false, status: res.status, rawText }
  }

  if (data.error_response) {
    console.error(`[OAuth callback] [${label}] error_response:`, JSON.stringify(data.error_response))
    return { ok: false, status: res.status, rawText, data }
  }

  const { access_token } = extractTokenFields(data)
  if (!access_token) {
    console.error(`[OAuth callback] [${label}] No access_token in response`)
    return { ok: false, status: res.status, rawText, data }
  }

  console.log(`[OAuth callback] [${label}] ✓ SUCCESS — access_token found`)
  return { ok: true, status: res.status, rawText, data }
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
    console.error('[OAuth callback] AliExpress error param:', aeError)
    return NextResponse.redirect(new URL(`/admin/configuracion?oauth=error&reason=${encodeURIComponent(aeError)}`, req.url))
  }

  if (!code) {
    console.error('[OAuth callback] No code in callback URL')
    return NextResponse.redirect(new URL('/admin/configuracion?oauth=error&reason=no_code', req.url))
  }

  const appKey = process.env.ALIEXPRESS_APP_KEY ?? '533884'
  const appSecret = (process.env.ALIEXPRESS_APP_SECRET ?? '').trim()

  console.log('[OAuth callback] appKey:', appKey)
  console.log('[OAuth callback] appSecret length:', appSecret.length)

  if (!appSecret) {
    console.error('[OAuth callback] ALIEXPRESS_APP_SECRET is not set')
    return NextResponse.redirect(new URL('/admin/configuracion?oauth=error&reason=no_secret', req.url))
  }

  const timestamp = Date.now().toString()
  const params: Record<string, string> = {
    app_key: appKey,
    code,
    grant_type: 'authorization_code',
    sign_method: 'sha256',
    timestamp,
  }

  const sortedStr = Object.keys(params).sort().map((k) => `${k}${params[k]}`).join('')

  // Compute all three signature variants upfront
  const signA = createHash('sha256').update(sortedStr).digest('hex').toUpperCase()
  const signB = createHmac('sha256', appSecret).update(sortedStr).digest('hex').toUpperCase()
  const signC = createHash('sha256').update(appSecret + sortedStr + appSecret).digest('hex').toUpperCase()

  console.log('[OAuth callback] sortedStr (code redacted):', sortedStr.replace(code, `${code.slice(0, 6)}...`))
  console.log('[OAuth callback] signA (SHA256 plain):        ', signA)
  console.log('[OAuth callback] signB (HMAC-SHA256):         ', signB)
  console.log('[OAuth callback] signC (SHA256 secret-wrap):  ', signC)

  // Try all combinations in order: form-encoded A, B, C — then JSON with A
  const attempts: Array<[string, string, boolean]> = [
    ['A-form (SHA256 plain)',       signA, false],
    ['B-form (HMAC-SHA256)',        signB, false],
    ['C-form (SHA256 secret-wrap)', signC, false],
    ['A-json (SHA256 plain, JSON)', signA, true],
  ]

  let lastRaw = ''
  let successData: Record<string, unknown> | undefined

  for (const [label, sign, asJson] of attempts) {
    const result = await tryTokenExchange(label, sign, params, asJson)
    lastRaw = result.rawText
    if (result.ok && result.data) {
      successData = result.data
      break
    }
  }

  if (!successData) {
    console.error('[OAuth callback] All attempts failed. Last raw response:', lastRaw.slice(0, 300))
    return NextResponse.redirect(
      new URL(`/admin/configuracion?oauth=error&reason=all_attempts_failed&raw=${encodeURIComponent(lastRaw.slice(0, 200))}`, req.url)
    )
  }

  const { access_token, refresh_token, expire_time } = extractTokenFields(successData)
  if (!access_token) {
    return NextResponse.redirect(new URL('/admin/configuracion?oauth=error&reason=no_token', req.url))
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
