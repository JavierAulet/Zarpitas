import { AlertCircle } from 'lucide-react'
import { getProducts } from '@/lib/actions/products'
import ProductosClient from './ProductosClient'

export default async function AdminProductosPage() {
  let products: Awaited<ReturnType<typeof getProducts>> = []
  let dbConnected = true

  try {
    products = await getProducts()
  } catch {
    dbConnected = false
  }

  return (
    <>
      {!dbConnected && (
        <div className="m-8 mb-0 flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <AlertCircle size={18} className="text-yellow-400 shrink-0" />
          <p className="text-yellow-400 text-sm">
            Supabase no configurado. Añade las variables de entorno en <code className="font-mono">.env.local</code>
          </p>
        </div>
      )}
      <ProductosClient initialProducts={products} />
    </>
  )
}
