import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  const db = createServiceClient()

  const { data: token } = await db
    .from('aliexpress_tokens')
    .select('access_token, expires_at, created_at')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!token) {
    return NextResponse.json({ status: 'not_connected' })
  }

  const now = new Date()
  const expiresAt = new Date(token.expires_at)
  const isExpired = expiresAt <= now
  const expiresInDays = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  return NextResponse.json({
    status: isExpired ? 'expired' : 'connected',
    expires_at: token.expires_at,
    expires_in_days: isExpired ? 0 : expiresInDays,
    connected_at: token.created_at,
  })
}
