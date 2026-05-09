import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, ArrowLeft, ArrowRight, Check, ShoppingCart } from 'lucide-react'
import { blogPosts, getBlogPost, type ContentBlock } from '@/lib/data/blog'
import { getActiveProducts } from '@/lib/actions/products'
import Newsletter from '@/components/home/Newsletter'

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = getBlogPost(params.slug)
  if (!post) return { title: 'Artículo no encontrado' }

  return {
    title: post.title,
    description: post.metaDescription,
    alternates: { canonical: `https://zarpitas.es/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.metaDescription,
      url: `https://zarpitas.es/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      locale: 'es_ES',
      images: [{ url: post.image, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.metaDescription,
      images: [post.image],
    },
  }
}

function renderBlock(block: ContentBlock, index: number) {
  switch (block.type) {
    case 'h2':
      return (
        <h2 key={index} className="font-display font-black text-2xl md:text-3xl text-text-primary mt-12 mb-5 leading-tight">
          {block.text}
        </h2>
      )
    case 'h3':
      return (
        <h3 key={index} className="font-display font-bold text-xl text-text-primary mt-8 mb-4">
          {block.text}
        </h3>
      )
    case 'p':
      return (
        <p key={index} className="text-text-secondary leading-relaxed mb-6 text-[1.05rem]">
          {block.text}
        </p>
      )
    case 'ul':
      return (
        <ul key={index} className="space-y-3 mb-8">
          {block.items.map((item, i) => (
            <li key={i} className="flex items-start gap-3 text-text-secondary">
              <Check size={15} className="text-green flex-shrink-0 mt-1" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      )
    case 'tip':
      return (
        <div key={index} className="my-8 p-6 rounded-3xl bg-orange-50 border-l-4 border-orange">
          <p className="text-sm font-black text-orange mb-2">💡 Consejo Zarpitas</p>
          <p className="text-text-secondary leading-relaxed">{block.text}</p>
        </div>
      )
  }
}

const categoryLabels: Record<string, string> = {
  perros: '🐶 Perros',
  gatos: '🐱 Gatos',
  general: '🐾 General',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function BlogPostPage({ params }: Props) {
  const post = getBlogPost(params.slug)
  if (!post) notFound()

  const allProducts = await getActiveProducts().catch(() => [])
  const relatedProducts = allProducts.filter((p) => post.relatedProducts.includes(p.id))

  const otherPosts = blogPosts.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 2)

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.metaDescription,
    image: `https://zarpitas.es${post.image}`,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    inLanguage: 'es-ES',
    url: `https://zarpitas.es/blog/${post.slug}`,
    author: { '@type': 'Organization', name: 'Zarpitas.es', url: 'https://zarpitas.es' },
    publisher: {
      '@type': 'Organization',
      name: 'Zarpitas.es',
      url: 'https://zarpitas.es',
      logo: { '@type': 'ImageObject', url: 'https://zarpitas.es/images/hero.jpg' },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `https://zarpitas.es/blog/${post.slug}` },
  }

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Inicio', item: 'https://zarpitas.es' },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://zarpitas.es/blog' },
      { '@type': 'ListItem', position: 3, name: post.title, item: `https://zarpitas.es/blog/${post.slug}` },
    ],
  }

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      <div className="pt-28 pb-16 bg-cream min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-xs text-text-muted mb-8 flex-wrap">
            <Link href="/" className="hover:text-orange transition-colors">Inicio</Link>
            <span>/</span>
            <Link href="/blog" className="hover:text-orange transition-colors">Blog</Link>
            <span>/</span>
            <span className="text-text-primary font-medium line-clamp-1">{post.title}</span>
          </nav>

          <div className="grid lg:grid-cols-[1fr_320px] gap-10 lg:gap-14 items-start">

            {/* Article */}
            <article>
              {/* Meta */}
              <div className="flex items-center flex-wrap gap-3 mb-6">
                <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-orange-50 text-orange border border-orange/10">
                  {categoryLabels[post.category]}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Calendar size={12} /> {formatDate(post.publishedAt)}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Clock size={12} /> {post.readTime} min de lectura
                </span>
              </div>

              {/* Title */}
              <h1 className="font-display font-black text-text-primary mb-6 leading-tight"
                  style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
                {post.title}
              </h1>

              {/* Hero image */}
              <div className="relative aspect-[16/9] rounded-4xl overflow-hidden mb-10 bg-cream-warm">
                <Image
                  src={post.image}
                  alt={post.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 65vw"
                  className="object-cover"
                />
              </div>

              {/* Content */}
              <div className="prose-zarpitas">
                {post.content.map((block, i) => renderBlock(block, i))}
              </div>

              {/* Back to blog */}
              <div className="mt-12 pt-8 border-t-2 border-cream-deep">
                <Link href="/blog" className="inline-flex items-center gap-2 text-text-muted hover:text-orange transition-colors font-semibold text-sm">
                  <ArrowLeft size={15} /> Volver al blog
                </Link>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-6 lg:sticky lg:top-28">
              {/* Related products CTA */}
              {relatedProducts.length > 0 && (
                <div className="bg-white rounded-4xl border-2 border-cream-deep shadow-card p-6">
                  <h3 className="font-display font-black text-lg text-text-primary mb-5">
                    🛍️ Productos relacionados
                  </h3>
                  <div className="space-y-4">
                    {relatedProducts.map((product) => (
                      <Link
                        key={product.id}
                        href={`/productos/${product.id}`}
                        className="flex items-center gap-3 group"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-cream-warm border-2 border-cream-deep flex-shrink-0 overflow-hidden relative">
                          {product.image ? (
                            <Image src={product.image} alt={product.name} fill sizes="64px" className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl opacity-20">
                              {product.category === 'gatos' ? '🐱' : '🐶'}
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-text-primary group-hover:text-orange transition-colors line-clamp-2 leading-snug">
                            {product.name}
                          </p>
                          <p className="text-orange font-display font-black text-sm mt-1">
                            {product.price.toFixed(2).replace('.', ',')}€
                          </p>
                        </div>
                        <ArrowRight size={14} className="text-text-muted flex-shrink-0 group-hover:text-orange group-hover:translate-x-1 transition-all" />
                      </Link>
                    ))}
                  </div>
                  <Link
                    href="/productos"
                    className="mt-5 flex items-center justify-center gap-2 w-full bg-orange hover:bg-orange-dark text-white font-bold py-3 rounded-2xl text-sm transition-colors"
                  >
                    <ShoppingCart size={14} /> Ver todos los productos
                  </Link>
                </div>
              )}

              {/* Other posts */}
              {otherPosts.length > 0 && (
                <div className="bg-white rounded-4xl border-2 border-cream-deep shadow-card p-6">
                  <h3 className="font-display font-black text-lg text-text-primary mb-5">
                    📖 También te puede interesar
                  </h3>
                  <div className="space-y-4">
                    {otherPosts.map((other) => (
                      <Link key={other.slug} href={`/blog/${other.slug}`} className="group flex gap-3">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden relative flex-shrink-0 bg-cream-warm">
                          <Image src={other.image} alt={other.title} fill sizes="64px" className="object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary group-hover:text-orange transition-colors leading-snug line-clamp-2">
                            {other.title}
                          </p>
                          <p className="text-xs text-text-muted mt-1">{other.readTime} min</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Newsletter teaser */}
              <div className="bg-orange-50 rounded-4xl border border-orange/10 p-6">
                <p className="font-display font-black text-lg text-text-primary mb-2">
                  🐾 ¿Te ha gustado este artículo?
                </p>
                <p className="text-sm text-text-secondary mb-4">
                  Suscríbete y recibe consejos semanales para el cuidado de tu mascota.
                </p>
                <Link
                  href="/#newsletter"
                  className="block text-center bg-orange hover:bg-orange-dark text-white font-bold py-3 rounded-2xl text-sm transition-colors"
                >
                  Suscribirse gratis →
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </div>

      <Newsletter />
    </>
  )
}
