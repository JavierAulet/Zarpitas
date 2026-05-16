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

const BASE_URL = 'https://zarpitas.es'

export const metadata: Metadata = {
  title: 'Zarpitas.es — Tienda Premium para Mascotas en España',
  description:
    'Todo lo que tu perro o gato merece. Collar GPS, camas ortopédicas, comederos inteligentes y más. Envío rápido en España, devolución 30 días gratis.',
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    url: BASE_URL,
    type: 'website',
  },
}

export const revalidate = 60

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'Zarpitas.es',
  url: BASE_URL,
  logo: `${BASE_URL}/images/hero.jpg`,
  email: 'hola@zarpitas.es',
  foundingDate: '2024',
  description: 'Tienda online premium para mascotas en España. Productos para perros y gatos con envío rápido.',
  areaServed: {
    '@type': 'Country',
    name: 'España',
  },
  sameAs: [
    'https://www.instagram.com/zarpitas_es',
    'https://www.facebook.com/zarpitas',
  ],
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'Zarpitas.es',
  url: BASE_URL,
  description: 'Tienda online premium para mascotas en España',
  inLanguage: 'es-ES',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${BASE_URL}/productos?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': 'Store',
  name: 'Zarpitas.es',
  url: BASE_URL,
  email: 'hola@zarpitas.es',
  description: 'Tienda online de productos premium para mascotas en España',
  priceRange: '€€',
  currenciesAccepted: 'EUR',
  paymentAccepted: 'Tarjeta de crédito, PayPal, Bizum',
  areaServed: {
    '@type': 'Country',
    name: 'España',
  },
  hasOfferCatalog: {
    '@type': 'OfferCatalog',
    name: 'Productos para mascotas',
    itemListElement: [
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Collares GPS para perros' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Camas ortopédicas para perros' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Comederos automáticos para gatos' } },
      { '@type': 'Offer', itemOffered: { '@type': 'Product', name: 'Árboles rascadores para gatos' } },
    ],
  },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: '¿Cuánto tarda el envío de Zarpitas.es?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Realizamos envíos en 24-48 horas a toda España peninsular. Los pedidos realizados antes de las 14:00 en días laborables salen el mismo día. El envío es gratuito para pedidos superiores a 40€.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Puedo devolver un producto si no quedo satisfecho?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Sí, ofrecemos devolución gratuita en 30 días desde la fecha de recepción del pedido, sin necesidad de justificación. El reembolso se realiza en el mismo método de pago utilizado en un plazo de 3-5 días hábiles.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Los productos de Zarpitas son seguros para mis mascotas?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Todos los productos de Zarpitas.es pasan por un riguroso proceso de selección y cumplen la normativa europea de seguridad para productos de mascotas. Trabajamos únicamente con materiales no tóxicos y respetuosos con los animales.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Qué métodos de pago acepta Zarpitas.es?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Aceptamos tarjetas de crédito y débito (Visa, Mastercard), Apple Pay, Google Pay, Bizum y PayPal. Todos los pagos se procesan de forma segura a través de Stripe con cifrado SSL de 256 bits.',
      },
    },
    {
      '@type': 'Question',
      name: '¿Cómo puedo hacer seguimiento de mi pedido?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Una vez que tu pedido sea enviado, recibirás un email con el número de seguimiento para rastrear el paquete en tiempo real. También puedes consultar el estado de tu pedido en la sección "Mis pedidos" de tu cuenta en Zarpitas.es.',
      },
    },
  ],
}

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <Hero />
      <TrustBar />
      <FeaturedProducts products={featured} />
      <Categories counts={{
        perros: allProducts.filter((p) => p.category === 'perros' || p.showInBoth).length,
        gatos: allProducts.filter((p) => p.category === 'gatos' || p.showInBoth).length,
      }} />
      <WhyZarpitas />
      <BestSellers products={bestSellers} />
      <Testimonials />
      <Newsletter />
    </>
  )
}
