import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, ArrowRight } from 'lucide-react'
import { getBlogPosts } from '@/lib/actions/blog'
import Newsletter from '@/components/home/Newsletter'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Blog — Consejos y guías para el cuidado de mascotas',
  description:
    'Artículos, guías y consejos sobre el cuidado de perros y gatos en España. Información práctica escrita por amantes de las mascotas.',
  alternates: { canonical: 'https://zarpitas.es/blog' },
  openGraph: {
    title: 'Blog de Zarpitas — Guías y consejos para mascotas',
    description: 'Artículos prácticos sobre el cuidado de perros y gatos. Todo lo que necesitas saber para cuidar a tu mascota.',
    url: 'https://zarpitas.es/blog',
    type: 'website',
  },
}

const blogListSchema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: 'Blog de Zarpitas',
  url: 'https://zarpitas.es/blog',
  description: 'Guías y consejos para el cuidado de mascotas en España',
  inLanguage: 'es-ES',
  publisher: { '@type': 'Organization', name: 'Zarpitas.es', url: 'https://zarpitas.es' },
}

const categoryLabels: Record<string, string> = {
  perros: '🐶 Perros',
  gatos: '🐱 Gatos',
  salud: '❤️ Salud',
  alimentacion: '🍖 Alimentación',
  gadgets: '📱 Gadgets',
  general: '🐾 General',
}

const categoryColors: Record<string, string> = {
  perros: 'bg-blue-50 text-blue-600 border-blue-100',
  gatos: 'bg-purple-50 text-purple-600 border-purple-100',
  salud: 'bg-red-50 text-red-500 border-red-100',
  alimentacion: 'bg-green-50 text-green border-green/20',
  gadgets: 'bg-zinc-50 text-zinc-600 border-zinc-200',
  general: 'bg-orange-50 text-orange border-orange/10',
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export default async function BlogPage() {
  const posts = await getBlogPosts().catch(() => [] as Awaited<ReturnType<typeof getBlogPosts>>)
  const [featured, ...rest] = posts

  if (!featured) {
    return (
      <div className="pt-28 pb-16 bg-cream min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          <p className="text-text-muted text-lg">Próximamente — estamos preparando los mejores artículos para ti.</p>
        </div>
      </div>
    )
  }

  const featuredImage = featured.featured_image_url ?? '/images/category-dogs.jpg'

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogListSchema) }} />

      <div className="pt-28 pb-16 bg-cream min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <nav className="flex items-center gap-2 text-xs text-text-muted mb-8">
            <Link href="/" className="hover:text-orange transition-colors">Inicio</Link>
            <span>/</span>
            <span className="text-text-primary font-medium">Blog</span>
          </nav>

          <div className="mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange/15 text-orange text-sm font-bold mb-4">
              🐾 Consejos para tu mascota
            </span>
            <h1 className="font-display font-black text-4xl md:text-5xl text-text-primary mb-4">
              Blog de Zarpitas
            </h1>
            <p className="text-text-secondary text-lg max-w-2xl">
              Guías, análisis y consejos escritos por personas que aman a los animales. Todo lo que necesitas saber para cuidar mejor a tu perro o gato.
            </p>
          </div>

          {/* Featured post */}
          <Link href={`/blog/${featured.slug}`} className="group block mb-12">
            <div className="grid md:grid-cols-2 gap-0 bg-white rounded-4xl border-2 border-cream-deep shadow-card hover:shadow-card-hover hover:border-orange/20 transition-all duration-300 overflow-hidden">
              <div className="relative aspect-[4/3] md:aspect-auto bg-cream-warm overflow-hidden">
                <Image
                  src={featuredImage}
                  alt={featured.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 left-4">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-bold border ${categoryColors[featured.category] ?? categoryColors.general}`}>
                    {categoryLabels[featured.category] ?? featured.category}
                  </span>
                </div>
              </div>
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <div className="flex items-center gap-4 text-xs text-text-muted mb-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={12} /> {formatDate(featured.published_at ?? featured.created_at)}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} /> {featured.read_time} min de lectura
                  </span>
                </div>
                <h2 className="font-display font-black text-2xl md:text-3xl text-text-primary mb-4 group-hover:text-orange transition-colors">
                  {featured.title}
                </h2>
                <p className="text-text-secondary leading-relaxed mb-6">{featured.excerpt}</p>
                <span className="inline-flex items-center gap-2 text-orange font-bold text-sm">
                  Leer artículo <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </span>
              </div>
            </div>
          </Link>

          {/* Rest of posts */}
          {rest.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rest.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                  <article className="bg-white rounded-3xl border-2 border-cream-deep shadow-card hover:shadow-card-hover hover:border-orange/20 transition-all duration-300 overflow-hidden h-full flex flex-col">
                    <div className="relative aspect-[16/9] bg-cream-warm overflow-hidden">
                      <Image
                        src={post.featured_image_url ?? '/images/category-dogs.jpg'}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${categoryColors[post.category] ?? categoryColors.general}`}>
                          {categoryLabels[post.category] ?? post.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} /> {formatDate(post.published_at ?? post.created_at)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={11} /> {post.read_time} min
                        </span>
                      </div>
                      <h2 className="font-display font-black text-lg text-text-primary mb-3 group-hover:text-orange transition-colors leading-snug">
                        {post.title}
                      </h2>
                      <p className="text-text-muted text-sm leading-relaxed flex-1 line-clamp-3">{post.excerpt}</p>
                      <span className="inline-flex items-center gap-1.5 text-orange font-bold text-sm mt-4">
                        Leer más <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <Newsletter />
    </>
  )
}
