import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import BlogEditor from '@/components/admin/BlogEditor'
import { getActiveProducts } from '@/lib/actions/products'

export default async function NuevoArticuloPage() {
  const products = await getActiveProducts().catch(() => [])

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/blog"
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-white text-2xl font-bold">Nuevo artículo</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Escribe y publica un artículo en el blog</p>
        </div>
      </div>

      <BlogEditor products={products.map((p) => ({ id: p.id, name: p.name }))} />
    </div>
  )
}
