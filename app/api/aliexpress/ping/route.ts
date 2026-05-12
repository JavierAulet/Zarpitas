import { NextResponse } from 'next/server'
import { generateSignature } from '@/lib/aliexpress/client'

const APP_KEY = process.env.ALIEXPRESS_APP_KEY ?? ''
const APP_SECRET = (process.env.ALIEXPRESS_APP_SECRET ?? '').trim()

export async function GET() {
  if (!APP_KEY || !APP_SECRET) {
    return NextResponse.json({ ok: false, error: 'Credenciales no configuradas (ALIEXPRESS_APP_KEY / ALIEXPRESS_APP_SECRET)' }, { status: 400 })
  }

  // Verify signature generation works and credentials are set
  try {
    const testParams = { app_key: APP_KEY, timestamp: Date.now().toString(), method: 'ping' }
    const sig = generateSignature(testParams, APP_SECRET)
    if (!sig || sig.length !== 64) throw new Error('Invalid signature')
    return NextResponse.json({ ok: true, app_key: APP_KEY, endpoint: 'api-sg.aliexpress.com/sync' })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
