import type { MetadataRoute } from 'next'
import { getActiveProducts } from '@/lib/actions/products'
import { blogPosts } from '@/lib/data/blog'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://zarpitas.es'
  const now = new Date()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${base}/productos`, lastModified: now, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/productos?categoria=perros`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/productos?categoria=gatos`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/blog`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/aviso-legal`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/politica-de-privacidad`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/politica-de-cookies`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${base}/terminos-y-condiciones`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ]

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${base}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  let productRoutes: MetadataRoute.Sitemap = []
  try {
    const products = await getActiveProducts()
    productRoutes = products.map((p) => ({
      url: `${base}/productos/${p.id}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  } catch {
    // Supabase not configured, skip product routes
  }

  return [...staticRoutes, ...blogRoutes, ...productRoutes]
}
