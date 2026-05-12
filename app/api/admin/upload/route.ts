export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServiceClient } from '@/lib/supabase/server'

const BUCKET = 'product-images'
const MAX_SIZE = 5 * 1024 * 1024

export async function POST(req: NextRequest) {
  const cookie = cookies().get('zarpitas_admin')
  if (!cookie?.value || cookie.value !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  const productId = (formData.get('productId') as string | null) ?? 'general'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'El archivo supera 5 MB' }, { status: 400 })
  if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Solo se permiten imágenes' }, { status: 400 })

  const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg'
  const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const db = createServiceClient()
  const { error } = await db.storage.from(BUCKET).upload(path, buffer, {
    contentType: file.type,
    cacheControl: '31536000',
    upsert: false,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = db.storage.from(BUCKET).getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}

