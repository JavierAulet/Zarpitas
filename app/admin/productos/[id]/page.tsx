import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getProduct } from '@/lib/actions/products'
import { getProductVariants } from '@/lib/actions/variants'
import ProductForm from '@/components/admin/ProductForm'

export const dynamic = 'force-dynamic'

interface Props {
  params: { id: string }
}

export default async function EditProductoPage({ params }: Props) {
  let product: Awaited<ReturnType<typeof getProduct>>
  try {
    product = await getProduct(params.id)
  } catch {
    notFound()
  }
  const variants = await getProductVariants(params.id).catch(() => [])

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/productos"
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-white text-2xl font-bold">Editar producto</h1>
          <p className="text-zinc-500 text-sm mt-0.5 font-mono">{product.id}</p>
        </div>
      </div>
      <ProductForm mode="edit" product={product} variants={variants} />
    </div>
  )
}
