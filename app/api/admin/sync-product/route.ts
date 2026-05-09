import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getAliExpressProduct } from '@/lib/aliexpress/client'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const cookie = cookies().get('zarpitas_admin')
  if (!cookie?.value || cookie.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { product_id, aliexpress_id } = await req.json()
  if (!product_id || !aliexpress_id) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  try {
    const ae = await getAliExpressProduct(aliexpress_id)
    const db = createServiceClient()
    const { error } = await db
      .from('products')
      .update({
        stock: ae.stock,
        cost_price: ae.price,
        updated_at: new Date().toISOString(),
      })
      .eq('id', product_id)

    if (error) throw error
    return NextResponse.json({ ok: true, stock: ae.stock, cost_price: ae.price })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
