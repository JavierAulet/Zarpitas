import type { Metadata } from 'next'
import Hero from '@/components/home/Hero'
import TrustBar from '@/components/home/TrustBar'
import FeaturedProducts from '@/components/home/FeaturedProducts'
import Categories from '@/components/home/Categories'
import WhyZarpitas from '@/components/home/WhyZarpitas'
import BestSellers from '@/components/home/BestSellers'
import Testimonials from '@/components/home/Testimonials'
import Newsletter from '@/components/home/Newsletter'
import { getActiveProducts } from '@/lib/actions/products'

export const metadata: Metadata = {
  title: 'Zarpitas.es — Tienda Premium para Mascotas en España',
  description:
    'Todo lo que tu perro o gato merece. Collar GPS, camas ortopédicas, comederos inteligentes y más. Envío rápido en España.',
}

export const revalidate = 60

export default async function HomePage() {
  const allProducts = await getActiveProducts().catch(() => [])

  const featured = [
    ...allProducts.filter((p) => p.badge),
    ...allProducts.filter((p) => !p.badge),
  ].slice(0, 4)

  const bestSellers = [...allProducts]
    .sort((a, b) => {
      if (a.badge === 'mas-vendido' && b.badge !== 'mas-vendido') return -1
      if (b.badge === 'mas-vendido' && a.badge !== 'mas-vendido') return 1
      return b.rating - a.rating
    })
    .slice(0, 8)

  return (
    <>
      <Hero />
      <TrustBar />
      <FeaturedProducts products={featured} />
      <Categories />
      <WhyZarpitas />
      <BestSellers products={bestSellers} />
      <Testimonials />
      <Newsletter />
    </>
  )
}
