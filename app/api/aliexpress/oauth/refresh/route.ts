import { NextResponse } from 'next/server'
import { createHmac } from 'crypto'
import { createServiceClient } from '@/lib/supabase/server'

function sign(params: Record<string, string>, secret: string): string {
  const concatenated = Object.keys(params)
    .sort()
    .map((k) => `${k}${params[k]}`)
    .join('')
  return createHmac('sha256', secret).update(concatenated).digest('hex').toUpperCase()
}

export async function POST() {
  const db = createServiceClient()

  const { data: token } = await db
    .from('aliexpress_tokens')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!token?.refresh_token) {
    console.error('[OAuth refresh] No refresh token in DB')
    return NextResponse.json({ error: 'No refresh token available' }, { status: 400 })
  }

  const appKey = process.env.ALIEXPRESS_APP_KEY ?? '533884'
  const appSecret = (process.env.ALIEXPRESS_APP_SECRET ?? '').trim()

  if (!appSecret) {
    return NextResponse.json({ error: 'ALIEXPRESS_APP_SECRET not configured' }, { status: 500 })
  }

  const timestamp = Date.now().toString()
  const params: Record<string, string> = {
    app_key: appKey,
    app_secret: appSecret,
    grant_type: 'refresh_token',
    refresh_token: token.refresh_token,
    sign_method: 'sha256',
    timestamp,
  }

  const signature = sign(params, appSecret)
  const body = new URLSearchParams({ ...params, sign: signature })
  const tokenUrl = 'https://api-sg.aliexpress.com/rest/auth/token/create'

  console.log('[OAuth refresh] POSTing to:', tokenUrl)

  const res = await fetch(tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: body.toString(),
  })

  const rawText = await res.text()
  console.log('[OAuth refresh] Response status:', res.status)
  console.log('[OAuth refresh] Response body:', rawText.slice(0, 400))

  if (!res.ok) {
    return NextResponse.json({ error: `Token refresh failed: ${res.status}` }, { status: 502 })
  }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(rawText)
  } catch {
    return NextResponse.json({ error: 'Failed to parse AliExpress response' }, { status: 502 })
  }

  if (data.error_response) {
    const errObj = data.error_response as Record<string, unknown>
    console.error('[OAuth refresh] AliExpress error_response:', JSON.stringify(errObj))
    return NextResponse.json({ error: errObj.msg ?? errObj.error_code ?? 'AliExpress error' }, { status: 502 })
  }

  const access_token = data.access_token as string | undefined
  const refresh_token = data.refresh_token as string | undefined
  const expire_time = data.expire_time as number | undefined

  if (!access_token) {
    console.error('[OAuth refresh] No access_token in response:', JSON.stringify(data).slice(0, 300))
    return NextResponse.json({ error: 'No access_token in response' }, { status: 502 })
  }

  const expiresAt = expire_time
    ? new Date(expire_time).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const { error: dbError } = await db.from('aliexpress_tokens').insert({
    access_token,
    refresh_token: refresh_token ?? token.refresh_token,
    expires_at: expiresAt,
  })

  if (dbError) {
    console.error('[OAuth refresh] DB insert failed:', dbError.message)
    return NextResponse.json({ error: dbError.message }, { status: 500 })
  }

  console.log('[OAuth refresh] Token refreshed and saved, expires_at:', expiresAt)
  return NextResponse.json({ success: true, expires_at: expiresAt })
}
