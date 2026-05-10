import { NextResponse } from 'next/server'
import { generateSignature } from '@/lib/aliexpress/client'
import { createServiceClient } from '@/lib/supabase/server'

const BASE_URL = 'https://api-sg.aliexpress.com/sync'
const APP_KEY = process.env.ALIEXPRESS_APP_KEY!
const APP_SECRET = (process.env.ALIEXPRESS_APP_SECRET ?? '').trim()

export async function GET() {
  const db = createServiceClient()
  const { data: tokenRow } = await db
    .from('aliexpress_tokens')
    .select('access_token, expires_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!tokenRow?.access_token) {
    return NextResponse.json({ error: 'No access_token in DB — complete OAuth first', token_status: 'missing' })
  }

  const isExpired = new Date(tokenRow.expires_at) <= new Date()

  const params: Record<string, string> = {
    app_key: APP_KEY,
    timestamp: Date.now().toString(),
    sign_method: 'hmac-sha256',
    format: 'json',
    v: '2.0',
    session: tokenRow.access_token,
    method: 'aliexpress.ds.product.get',
    product_id: '1005006100091637',
    local_country: 'ES',
    local_language: 'es',
    country_code: 'ES',
  }
  params.sign = generateSignature(params, APP_SECRET)

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: new URLSearchParams(params),
  })

  const json = await res.json()
  return NextResponse.json({ token_status: isExpired ? 'expired' : 'valid', token_expires_at: tokenRow.expires_at, api_response: json })
}
