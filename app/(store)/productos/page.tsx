import { Suspense } from 'react'
import { getActiveProducts } from '@/lib/actions/products'
import ProductsClient from './ProductsClient'
import Newsletter from '@/components/home/Newsletter'

export const revalidate = 60

export default async function ProductosPage() {
  const products = await getActiveProducts().catch(() => [])

  return (
    <>
      <Suspense fallback={
        <div className="pt-28 pb-10 bg-cream-warm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="h-6 bg-cream-deep rounded-full w-24 mb-3 animate-pulse" />
            <div className="h-10 bg-cream-deep rounded-2xl w-64 mb-2 animate-pulse" />
            <div className="h-4 bg-cream-deep rounded-full w-80 animate-pulse" />
          </div>
        </div>
      }>
        <ProductsClient products={products} />
      </Suspense>
      <Newsletter />
    </>
  )
}
