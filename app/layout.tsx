import type { Metadata } from 'next'
import { Nunito, Plus_Jakarta_Sans } from 'next/font/google'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/react'
import './globals.css'

const nunito = Nunito({
  subsets: ['latin'],
  variable: '--font-nunito',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800', '900'],
})

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

const BASE_URL = 'https://zarpitas.es'

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: 'Zarpitas — Tienda Premium para Mascotas en España',
    template: '%s | Zarpitas',
  },
  description:
    'La tienda para mascotas hecha por personas que aman a los animales. Productos premium para perros y gatos con envío gratuito a España. Devolución 30 días gratis.',
  keywords: [
    'tienda mascotas España',
    'productos perros España',
    'productos gatos España',
    'collar GPS perro',
    'cama ortopédica perro',
    'rascador gato premium',
    'comedero inteligente mascotas',
    'arnés antipull perro',
    'bebedero fuente gatos',
    'zarpitas mascotas',
    'tienda online mascotas',
    'accesorios mascotas España',
  ],
  authors: [{ name: 'Zarpitas.es', url: BASE_URL }],
  creator: 'Zarpitas.es',
  publisher: 'Zarpitas.es',
  formatDetection: { email: false, address: false, telephone: false },
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: BASE_URL,
    siteName: 'Zarpitas.es',
    title: 'Zarpitas.es — Todo el amor que merece tu mejor amigo',
    description:
      'Productos premium para mascotas en España. Collar GPS, camas ortopédicas, comederos inteligentes y más. Envío gratuito, devolución gratis 30 días.',
    images: [
      {
        url: '/images/hero.jpg',
        width: 1200,
        height: 630,
        alt: 'Zarpitas.es — Tienda Premium para Mascotas en España',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@zarpitas_es',
    creator: '@zarpitas_es',
    title: 'Zarpitas.es — Todo el amor que merece tu mejor amigo',
    description: 'Productos premium para mascotas en España. Envío gratuito, devolución gratis.',
    images: ['/images/hero.jpg'],
  },
  alternates: {
    canonical: BASE_URL,
    languages: { 'es-ES': BASE_URL },
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  verification: {
    google: 'pending',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${nunito.variable} ${plusJakarta.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="preload" as="image" href="/images/hero.jpg" />
      </head>
      <body className="bg-cream text-text-primary font-sans antialiased">
        {children}
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  )
}
