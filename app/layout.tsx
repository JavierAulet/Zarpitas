import type { Metadata } from 'next'
import { Nunito, Plus_Jakarta_Sans } from 'next/font/google'
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

export const metadata: Metadata = {
  title: 'Zarpitas.es — Tienda Premium para Mascotas en España',
  description:
    'La tienda para mascotas hecha por personas que aman a los animales. Productos premium para perros y gatos con envío rápido en España. Devolución 30 días gratis.',
  keywords: [
    'tienda mascotas España',
    'productos perros',
    'productos gatos',
    'collar GPS perro',
    'cama ortopédica perro',
    'rascador gato',
    'comedero inteligente',
    'zarpitas',
  ],
  openGraph: {
    title: 'Zarpitas.es — Todo el amor que merece tu mejor amigo',
    description: 'Productos premium para mascotas en España. Envío 24h, devolución gratis.',
    locale: 'es_ES',
    type: 'website',
    siteName: 'Zarpitas.es',
  },
  alternates: {
    canonical: 'https://zarpitas.es',
    languages: { 'es-ES': 'https://zarpitas.es' },
  },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${nunito.variable} ${plusJakarta.variable}`}>
      <body className="bg-cream text-text-primary font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
