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
    method: 'aliexpress.affiliate.product.query',
    keywords: 'collar perro',
    target_currency: 'EUR',
    target_language: 'ES',
    country: 'ES',
    sort: 'SALE_PRICE_ASC',
    page_no: '1',
    page_size: '5',
    tracking_id: 'default',
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
