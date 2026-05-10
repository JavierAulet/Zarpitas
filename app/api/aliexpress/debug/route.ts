import { NextResponse } from 'next/server'
import { generateSignature } from '@/lib/aliexpress/client'

const BASE_URL = 'https://api-sg.aliexpress.com/sync'
const APP_KEY = process.env.ALIEXPRESS_APP_KEY!
const APP_SECRET = (process.env.ALIEXPRESS_APP_SECRET ?? '').trim()

export async function GET() {
  const params: Record<string, string> = {
    app_key: APP_KEY,
    timestamp: Date.now().toString(),
    sign_method: 'hmac-sha256',
    format: 'json',
    v: '2.0',
    method: 'aliexpress.ds.text.search',
    keywords: 'collar perro',
    local_country: 'ES',
    local_language: 'es',
    countryCode: 'ES',
    currency: 'EUR',
    local: 'es',
    sort: 'LAST_VOLUME_DESC',
    page_index: '1',
    page_size: '5',
  }
  params.sign = generateSignature(params, APP_SECRET)

  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8' },
    body: new URLSearchParams(params),
  })

  const json = await res.json()
  return NextResponse.json(json, { status: 200 })
}
