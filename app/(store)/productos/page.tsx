import type { Metadata } from 'next'
import { Suspense } from 'react'
import { getActiveProducts } from '@/lib/actions/products'
import ProductsClient from './ProductsClient'
import Newsletter from '@/components/home/Newsletter'

export const revalidate = 60

const categoryMeta: Record<string, { title: string; description: string }> = {
  perros: {
    title: 'Productos para perros en España — Collares, camas y más',
    description: 'La mejor selección de productos para perros en España: collar GPS, camas ortopédicas, arneses antipull y más. Envío gratuito, devolución 30 días gratis.',
  },
  gatos: {
    title: 'Productos para gatos en España — Rascadores, comederos y más',
    description: 'Productos premium para gatos en España: árboles rascadores, comederos automáticos, bebederos fuente y más. Envío gratuito, devolución gratis.',
  },
}

interface Props {
  searchParams: { categoria?: string }
}

export function generateMetadata({ searchParams }: Props): Metadata {
  const cat = searchParams.categoria
  const meta = cat ? categoryMeta[cat] : null

  const title = meta?.title ?? 'Todos los productos para mascotas en España'
  const description = meta?.description ??
    'Catálogo completo de productos premium para perros y gatos en España. Collar GPS, camas ortopédicas, rascadores, comederos y más. Envío gratuito, devolución gratis.'

  const canonical = cat
    ? `https://zarpitas.es/productos?categoria=${cat}`
    : 'https://zarpitas.es/productos'

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { title, description, url: canonical, type: 'website' },
  }
}

export default async function ProductosPage({ searchParams }: Props) {
  void searchParams
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
