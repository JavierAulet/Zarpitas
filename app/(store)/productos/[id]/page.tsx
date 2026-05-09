import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { getActiveProduct, getActiveProducts } from '@/lib/actions/products'
import ProductDetail from '@/components/product/ProductDetail'
import RelatedProducts from '@/components/product/RelatedProducts'
import Newsletter from '@/components/home/Newsletter'
import type { Product } from '@/types'

export const revalidate = 60

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getActiveProduct(params.id)
  if (!product) return { title: 'Producto no encontrado | Zarpitas.es' }

  const imageUrl = product.image ?? undefined

  return {
    title: `${product.name} | Zarpitas.es — Tienda Premium para Mascotas`,
    description: product.description?.slice(0, 155) ?? `Compra ${product.name} con envío rápido a España. Devolución 30 días gratis.`,
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 155) ?? '',
      images: imageUrl ? [{ url: imageUrl, width: 800, height: 800, alt: product.name }] : [],
      type: 'website',
      locale: 'es_ES',
      siteName: 'Zarpitas.es',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description?.slice(0, 155) ?? '',
      images: imageUrl ? [imageUrl] : [],
    },
  }
}

export async function generateStaticParams() {
  const products = await getActiveProducts().catch(() => [])
  return products.map((p) => ({ id: p.id }))
}

function ProductJsonLd({ product }: { product: Product }) {
  const availability = (product.stock ?? 0) > 0
    ? 'https://schema.org/InStock'
    : 'https://schema.org/OutOfStock'

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.images?.length ? product.images : product.image ? [product.image] : [],
    brand: { '@type': 'Brand', name: 'Zarpitas' },
    offers: {
      '@type': 'Offer',
      url: `https://zarpitas.es/productos/${product.id}`,
      priceCurrency: 'EUR',
      price: product.price.toFixed(2),
      availability,
      seller: { '@type': 'Organization', name: 'Zarpitas.es' },
    },
    aggregateRating: product.reviews > 0 ? {
      '@type': 'AggregateRating',
      ratingValue: product.rating.toFixed(1),
      reviewCount: product.reviews,
      bestRating: '5',
      worstRating: '1',
    } : undefined,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}

export default async function ProductoDetailPage({ params }: Props) {
  const [product, allProducts] = await Promise.all([
    getActiveProduct(params.id),
    getActiveProducts().catch(() => []),
  ])

  if (!product) notFound()

  const related = allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4)

  return (
    <>
      <ProductJsonLd product={product} />
      <section className="pt-28 pb-16 bg-cream min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-text-muted mb-8">
            <a href="/" className="hover:text-orange transition-colors">Inicio</a>
            <span>/</span>
            <a href="/productos" className="hover:text-orange transition-colors">Productos</a>
            <span>/</span>
            <a href={`/productos?categoria=${product.category}`} className="hover:text-orange transition-colors capitalize">
              {product.category}
            </a>
            <span>/</span>
            <span className="text-text-primary font-medium line-clamp-1">{product.name}</span>
          </nav>

          <ProductDetail product={product} />
        </div>
      </section>

      <RelatedProducts products={related} />
      <Newsletter />
    </>
  )
}
