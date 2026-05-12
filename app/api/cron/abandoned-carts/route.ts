import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { sendAbandonedCartEmail } from '@/lib/email'

// Protect with a secret: GET /api/cron/abandoned-carts?secret=YOUR_CRON_SECRET
// Add to crontab: */15 * * * * curl "https://zarpitas.es/api/cron/abandoned-carts?secret=YOUR_CRON_SECRET"

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()
  const now = new Date().toISOString()

  const { data: carts } = await db
    .from('abandoned_carts')
    .select('*')
    .eq('email_sent', false)
    .lte('send_at', now)
    .limit(50)

  if (!carts?.length) {
    return NextResponse.json({ sent: 0 })
  }

  let sent = 0
  for (const cart of carts) {
    try {
      await sendAbandonedCartEmail(cart.email, cart.items, cart.recover_token)
      await db
        .from('abandoned_carts')
        .update({ email_sent: true })
        .eq('id', cart.id)
      sent++
    } catch (err) {
      console.error('[Cron] Failed to send abandoned cart email:', err)
    }
  }

  return NextResponse.json({ sent })
}
