import type { MetadataRoute } from 'next'
import { getActiveProducts } from '@/lib/actions/products'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = 'https://zarpitas.es'

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/productos`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/productos?categoria=perros`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/productos?categoria=gatos`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/aviso-legal`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/politica-de-privacidad`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/politica-de-cookies`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${base}/terminos-y-condiciones`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ]

  let productRoutes: MetadataRoute.Sitemap = []
  try {
    const products = await getActiveProducts()
    productRoutes = products.map((p) => ({
      url: `${base}/productos/${p.id}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }))
  } catch {
    // Supabase not configured, skip product routes
  }

  return [...staticRoutes, ...productRoutes]
}
