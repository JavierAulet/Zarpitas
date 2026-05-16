import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Clock } from 'lucide-react'
import { getActiveProduct, getActiveProducts } from '@/lib/actions/products'
import { getProductVariants } from '@/lib/actions/variants'
import ProductDetail from '@/components/product/ProductDetail'
import RelatedProducts from '@/components/product/RelatedProducts'
import ProductReviews from '@/components/product/ProductReviews'
import Newsletter from '@/components/home/Newsletter'
import { getBlogPostsByProduct } from '@/lib/data/blog'
import { createServerClient } from '@/lib/supabase/server'
import type { Product } from '@/types'

export const revalidate = 60

interface Props {
  params: { id: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getActiveProduct(params.id)
  if (!product) return { title: 'Producto no encontrado' }

  const imageUrl = product.image ?? undefined
  const description =
    product.description?.slice(0, 155) ??
    `Compra ${product.name} con envío gratuito a España. Devolución 30 días gratis.`

  return {
    title: `${product.name} — Comprar en España`,
    description,
    alternates: { canonical: `https://zarpitas.es/productos/${product.id}` },
    openGraph: {
      title: product.name,
      description,
      url: `https://zarpitas.es/productos/${product.id}`,
      images: imageUrl ? [{ url: imageUrl, width: 800, height: 800, alt: product.name }] : [],
      type: 'website',
      locale: 'es_ES',
      siteName: 'Zarpitas.es',
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description,
      images: imageUrl ? [imageUrl] : [],
    },
  }
}

export async function generateStaticParams() {
  const products = await getActiveProducts().catch(() => [])
  return products.map((p) => ({ id: p.id }))
}

function ProductJsonLd({ product }: { product: Product }) {
  const availability =
    (product.stock ?? 0) > 0
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock'

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
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
            shippingDetails: {
              '@type': 'OfferShippingDetails',
              shippingRate: { '@type': 'MonetaryAmount', value: '0', currency: 'EUR' },
              shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'ES' },
              deliveryTime: {
                '@type': 'ShippingDeliveryTime',
                handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 1, unitCode: 'DAY' },
                transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
              },
            },
            hasMerchantReturnPolicy: {
              '@type': 'MerchantReturnPolicy',
              applicableCountry: 'ES',
              returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
              merchantReturnDays: 30,
              returnMethod: 'https://schema.org/ReturnByMail',
              returnFees: 'https://schema.org/FreeReturn',
            },
          },
          aggregateRating:
            product.reviews > 0
              ? {
                  '@type': 'AggregateRating',
                  ratingValue: product.rating.toFixed(1),
                  reviewCount: product.reviews,
                  bestRating: '5',
                  worstRating: '1',
                }
              : undefined,
        }),
      }}
    />
  )
}

function BreadcrumbJsonLd({ product }: { product: Product }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://zarpitas.es' },
            { '@type': 'ListItem', position: 2, name: 'Productos', item: 'https://zarpitas.es/productos' },
            {
              '@type': 'ListItem',
              position: 3,
              name: product.category.charAt(0).toUpperCase() + product.category.slice(1),
              item: `https://zarpitas.es/productos?categoria=${product.category}`,
            },
            {
              '@type': 'ListItem',
              position: 4,
              name: product.name,
              item: `https://zarpitas.es/productos/${product.id}`,
            },
          ],
        }),
      }}
    />
  )
}

export default async function ProductoDetailPage({ params }: Props) {
  const supabase = createServerClient()
  const [product, allProducts, reviewsRes, variantRows] = await Promise.all([
    getActiveProduct(params.id),
    getActiveProducts().catch(() => []),
    supabase
      .from('reviews')
      .select('id, rating, title, body, reviewer_name, created_at')
      .eq('product_id', params.id)
      .order('created_at', { ascending: false }),
    getProductVariants(params.id).catch(() => []),
  ])
  const reviews = reviewsRes.data ?? []
  const variants = variantRows
    .filter((v) => v.active !== false)
    .map((v) => ({
      id: v.id,
      name: (v as { display_name?: string }).display_name || v.name,
      priceModifier: v.price_modifier,
      stock: v.stock,
      aliexpressSkuId: v.sku ?? undefined,
      sku_attr: (v as { sku_attr?: string }).sku_attr ?? undefined,
      properties: v.properties ?? undefined,
    }))

  if (!product) notFound()

  const related = allProducts
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4)

  const relatedBlogPosts = getBlogPostsByProduct(product.id)

  return (
    <>
      <ProductJsonLd product={product} />
      <BreadcrumbJsonLd product={product} />

      <section className="pt-28 pb-16 bg-cream min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-text-muted mb-8 flex-wrap">
            <Link href="/" className="hover:text-orange transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/productos" className="hover:text-orange transition-colors">Productos</Link>
            <span>/</span>
            <Link
              href={`/productos?categoria=${product.category}`}
              className="hover:text-orange transition-colors capitalize"
            >
              {product.category}
            </Link>
            <span>/</span>
            <span className="text-text-primary font-medium line-clamp-1">{product.name}</span>
          </nav>

          <ProductDetail product={product} variants={variants} />
        </div>
      </section>

      <RelatedProducts products={related} />

      <ProductReviews
        reviews={reviews}
        productRating={product.rating}
        reviewCount={product.reviews}
      />

      {/* Related blog posts */}
      {relatedBlogPosts.length > 0 && (
        <section className="py-14 bg-cream border-t-2 border-cream-deep">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="font-display font-black text-2xl text-text-primary mb-8">
              📖 Artículos relacionados
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {relatedBlogPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                  <div className="bg-white rounded-3xl border-2 border-cream-deep shadow-card hover:shadow-card-hover hover:border-orange/20 transition-all duration-300 overflow-hidden flex flex-col h-full">
                    <div className="relative aspect-[16/9] bg-cream-warm overflow-hidden">
                      <Image
                        src={post.image}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-1.5 text-xs text-text-muted mb-3">
                        <Clock size={11} /> {post.readTime} min de lectura
                      </div>
                      <h3 className="font-display font-black text-base text-text-primary mb-2 group-hover:text-orange transition-colors leading-snug">
                        {post.title}
                      </h3>
                      <p className="text-text-muted text-sm leading-relaxed flex-1 line-clamp-2">{post.excerpt}</p>
                      <span className="inline-flex items-center gap-1.5 text-orange font-bold text-sm mt-4">
                        Leer guía <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <Newsletter />
    </>
  )
}
