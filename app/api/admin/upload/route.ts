import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient as createServerClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  const formData = await request.formData()
  const file = formData.get('file') as File
  const productId = formData.get('productId') as string

  if (!file || !productId) {
    return NextResponse.json({ error: 'Missing file or productId' }, { status: 400 })
  }

  const ext = file.name.split('.').pop()
  const path = `${productId}/${Date.now()}.${ext}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const db = createServerClient()
  const { error } = await db.storage.from('products').upload(path, buffer, {
    contentType: file.type,
    upsert: true,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const { data } = db.storage.from('products').getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
