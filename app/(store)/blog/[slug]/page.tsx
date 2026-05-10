import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import { Calendar, Clock, ArrowLeft, ArrowRight, Eye, ShoppingCart } from 'lucide-react'
import { getBlogPost, getBlogPosts } from '@/lib/actions/blog'
import { getActiveProducts } from '@/lib/actions/products'
import Newsletter from '@/components/home/Newsletter'

export const revalidate = 3600

interface Props {
  params: { slug: string }
}

export async function generateStaticParams() {
  const posts = await getBlogPosts()
  return posts.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getBlogPost(params.slug)
  if (!post) return { title: 'Artículo no encontrado' }

  const image = post.featured_image_url ?? '/images/hero.jpg'
  return {
    title: post.meta_title ?? post.title,
    description: post.meta_description ?? post.excerpt ?? undefined,
    alternates: { canonical: `https://zarpitas.es/blog/${post.slug}` },
    openGraph: {
      title: post.meta_title ?? post.title,
      description: post.meta_description ?? post.excerpt ?? undefined,
      url: `https://zarpitas.es/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.published_at ?? undefined,
      modifiedTime: post.updated_at,
      locale: 'es_ES',
      images: [{ url: image, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.meta_title ?? post.title,
      description: post.meta_description ?? post.excerpt ?? undefined,
      images: [image],
    },
  }
}

const categoryLabels: Record<string, string> = {
  perros: '🐶 Perros',
  gatos: '🐱 Gatos',
  salud: '❤️ Salud',
  alimentacion: '🍖 Alimentación',
  gadgets: '📱 Gadgets',
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
  const [post, allProducts, allPosts] = await Promise.all([
    getBlogPost(params.slug),
    getActiveProducts().catch(() => []),
    getBlogPosts(),
  ])

  if (!post) notFound()

  const relatedProducts = allProducts.filter((p) => post.related_product_ids.includes(p.id))
  const otherPosts = allPosts.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 2)

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.meta_description ?? post.excerpt,
    image: `https://zarpitas.es${post.featured_image_url ?? '/images/hero.jpg'}`,
    datePublished: post.published_at,
    dateModified: post.updated_at,
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
              <div className="flex items-center flex-wrap gap-3 mb-6">
                <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-orange-50 text-orange border border-orange/10">
                  {categoryLabels[post.category] ?? post.category}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Calendar size={12} /> {formatDate(post.published_at ?? post.created_at)}
                </span>
                <span className="flex items-center gap-1.5 text-xs text-text-muted">
                  <Clock size={12} /> {post.read_time} min de lectura
                </span>
                {post.views > 0 && (
                  <span className="flex items-center gap-1.5 text-xs text-text-muted">
                    <Eye size={12} /> {post.views.toLocaleString('es-ES')} lecturas
                  </span>
                )}
              </div>

              <h1 className="font-display font-black text-text-primary mb-6 leading-tight"
                  style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}>
                {post.title}
              </h1>

              {post.featured_image_url && (
                <div className="relative aspect-[16/9] rounded-4xl overflow-hidden mb-10 bg-cream-warm">
                  <Image
                    src={post.featured_image_url}
                    alt={post.title}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 65vw"
                    className="object-cover"
                  />
                </div>
              )}

              {/* Markdown content */}
              <div className="prose-zarpitas">
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <h2 className="font-display font-black text-2xl md:text-3xl text-text-primary mt-12 mb-5 leading-tight">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="font-display font-bold text-xl text-text-primary mt-8 mb-4">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-text-secondary leading-relaxed mb-6 text-[1.05rem]">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="space-y-3 mb-8 list-none pl-0">
                        {children}
                      </ul>
                    ),
                    li: ({ children }) => (
                      <li className="flex items-start gap-3 text-text-secondary">
                        <span className="text-green flex-shrink-0 mt-1 font-bold">✓</span>
                        <span className="leading-relaxed">{children}</span>
                      </li>
                    ),
                    blockquote: ({ children }) => (
                      <div className="my-8 p-6 rounded-3xl bg-orange-50 border-l-4 border-orange">
                        <p className="text-sm font-black text-orange mb-2">💡 Consejo Zarpitas</p>
                        <div className="text-text-secondary leading-relaxed [&>p]:mb-0">{children}</div>
                      </div>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-bold text-text-primary">{children}</strong>
                    ),
                    a: ({ href, children }) => (
                      <a href={href} className="text-orange hover:underline font-medium" target="_blank" rel="noopener noreferrer">
                        {children}
                      </a>
                    ),
                  }}
                >
                  {post.content}
                </ReactMarkdown>
              </div>

              <div className="mt-12 pt-8 border-t-2 border-cream-deep">
                <Link href="/blog" className="inline-flex items-center gap-2 text-text-muted hover:text-orange transition-colors font-semibold text-sm">
                  <ArrowLeft size={15} /> Volver al blog
                </Link>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-6 lg:sticky lg:top-28">
              {relatedProducts.length > 0 && (
                <div className="bg-white rounded-4xl border-2 border-cream-deep shadow-card p-6">
                  <h3 className="font-display font-black text-lg text-text-primary mb-5">
                    🛍️ Productos relacionados
                  </h3>
                  <div className="space-y-4">
                    {relatedProducts.map((product) => (
                      <Link key={product.id} href={`/productos/${product.id}`} className="flex items-center gap-3 group">
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

              {otherPosts.length > 0 && (
                <div className="bg-white rounded-4xl border-2 border-cream-deep shadow-card p-6">
                  <h3 className="font-display font-black text-lg text-text-primary mb-5">
                    📖 También te puede interesar
                  </h3>
                  <div className="space-y-4">
                    {otherPosts.map((other) => (
                      <Link key={other.slug} href={`/blog/${other.slug}`} className="group flex gap-3">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden relative flex-shrink-0 bg-cream-warm">
                          <Image src={other.featured_image_url ?? '/images/category-dogs.jpg'} alt={other.title} fill sizes="64px" className="object-cover" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary group-hover:text-orange transition-colors leading-snug line-clamp-2">
                            {other.title}
                          </p>
                          <p className="text-xs text-text-muted mt-1">{other.read_time} min</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

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
