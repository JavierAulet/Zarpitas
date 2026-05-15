import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const db = createServiceClient()
  const now = new Date()

  const { data: tokens, error: dbError } = await db
    .from('aliexpress_tokens')
    .select('access_token, refresh_token, expires_at, created_at')
    .order('created_at', { ascending: false })
    .limit(5)

  const tokenInfo = (tokens ?? []).map((t, i) => {
    const expiresAt = new Date(t.expires_at)
    const isExpired = expiresAt <= now
    const diffMs = expiresAt.getTime() - now.getTime()
    const diffDays = Math.ceil(Math.abs(diffMs) / (1000 * 60 * 60 * 24))

    return {
      index: i,
      is_current: i === 0,
      access_token: t.access_token
        ? `${t.access_token.slice(0, 10)}...${t.access_token.slice(-6)}`
        : null,
      refresh_token_present: !!t.refresh_token,
      expires_at: t.expires_at,
      status: isExpired ? `EXPIRED ${diffDays}d ago` : `valid — ${diffDays}d remaining`,
      created_at: t.created_at,
    }
  })

  const current = tokenInfo[0] ?? null

  return NextResponse.json({
    timestamp: now.toISOString(),
    db_error: dbError?.message ?? null,
    token_count: tokens?.length ?? 0,
    current_status: current
      ? current.status.startsWith('EXPIRED') ? 'expired' : 'active'
      : 'no_token',
    tokens: tokenInfo,
    env: {
      ALIEXPRESS_APP_KEY: process.env.ALIEXPRESS_APP_KEY
        ? `${process.env.ALIEXPRESS_APP_KEY.slice(0, 4)}**** (set)`
        : 'NOT SET',
      ALIEXPRESS_APP_SECRET: process.env.ALIEXPRESS_APP_SECRET
        ? `****${process.env.ALIEXPRESS_APP_SECRET.slice(-4)} (length: ${process.env.ALIEXPRESS_APP_SECRET.length})`
        : 'NOT SET',
      ALIEXPRESS_REDIRECT_URI: process.env.ALIEXPRESS_REDIRECT_URI ?? 'NOT SET (default will be used)',
      SUPABASE_URL: process.env.SUPABASE_URL
        ? `${process.env.SUPABASE_URL.slice(0, 30)}... (set)`
        : 'NOT SET',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'NOT SET',
    },
  })
}
