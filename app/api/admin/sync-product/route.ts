import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'

async function fetchAEProductData(aliexpressId: string) {
  const res = await fetch(`https://www.aliexpress.com/item/${aliexpressId}.html`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept-Language': 'es-ES,es;q=0.9',
    },
  })
  if (!res.ok) throw new Error(`AliExpress page returned ${res.status}`)
  const html = await res.text()

  const match = html.match(/window\.runParams\s*=\s*(\{[\s\S]*?\});\s*(?:window|var|<\/script>)/)
  if (!match) throw new Error('Could not parse AliExpress page')

  const data = JSON.parse(match[1])
  const d = data?.data ?? data

  const priceComp = d?.priceComponent ?? d?.price ?? {}
  const priceStr: string =
    priceComp?.discountPrice?.minActivityAmount?.value ??
    priceComp?.originalPrice?.minAmount?.value ??
    priceComp?.salePriceString ??
    '0'

  const imageComp = d?.imageComponent ?? d?.image ?? {}
  const images: string[] = (
    imageComp?.imagePathList ??
    imageComp?.images ??
    d?.imagePathList ??
    []
  ).map((img: string) => (img.startsWith('//') ? `https:${img}` : img))

  const name: string = d?.productInfoComponent?.subject ?? d?.subject ?? ''

  return {
    cost_price: parseFloat(priceStr) || null,
    image: images[0] ?? null,
    images,
    name,
  }
}

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
    const ae = await fetchAEProductData(aliexpress_id)
    const db = createServiceClient()

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
    if (ae.cost_price) updates.cost_price = ae.cost_price
    if (ae.image) updates.image = ae.image
    if (ae.images?.length) updates.images = ae.images

    const { error } = await db.from('products').update(updates).eq('id', product_id)
    if (error) throw error

    return NextResponse.json({ ok: true, cost_price: ae.cost_price, image: ae.image })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
