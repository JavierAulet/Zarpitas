import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import ProductForm from '@/components/admin/ProductForm'

export default function NuevoProductoPage() {
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
          <h1 className="text-white text-2xl font-bold">Nuevo producto</h1>
          <p className="text-zinc-500 text-sm mt-0.5">Añade un producto a la tienda</p>
        </div>
      </div>
      <ProductForm mode="create" />
    </div>
  )
}
