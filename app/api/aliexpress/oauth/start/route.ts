import { NextResponse } from 'next/server'

export async function GET() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.ALIEXPRESS_APP_KEY ?? '533884',
    redirect_uri: process.env.ALIEXPRESS_REDIRECT_URI ?? 'https://zarpitas.es/api/aliexpress/oauth/callback',
    view: 'web',
    sp: 'ae',
  })

  const url = `https://oauth.aliexpress.com/authorize?${params.toString()}`
  return NextResponse.redirect(url)
}
