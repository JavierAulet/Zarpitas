'use client'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const categories = [
  {
    id: 'perros',
    emoji: '🐶',
    name: 'Para Perros',
    slug: 'perros',
    tagline: 'Fiel. Leal. Juguetón.',
    description: 'Collares GPS, camas ortopédicas, arneses ergonómicos y todo lo que hace feliz a tu perro.',
    image: '/images/category-dogs.jpg',
    count: 5,
    bg: 'bg-orange-50',
    accent: 'text-orange',
    border: 'border-orange/20',
    btnBg: 'bg-orange text-white',
  },
  {
    id: 'gatos',
    emoji: '🐱',
    name: 'Para Gatos',
    slug: 'gatos',
    tagline: 'Elegante. Curioso. Independiente.',
    description: 'Rascadores premium, bebederos filtrantes, juguetes interactivos para el rey de la casa.',
    image: '/images/category-cats.jpg',
    count: 3,
    bg: 'bg-green-50',
    accent: 'text-green',
    border: 'border-green/20',
    btnBg: 'bg-green text-white',
  },
]

export default function Categories({ counts }: { counts?: { perros: number; gatos: number } }) {
  const perrosCount = counts?.perros ?? 5
  const gatosCount = counts?.gatos ?? 3
  return (
    <section className="py-20 md:py-28 bg-cream-warm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cream-deep text-text-secondary text-xs font-bold mb-3">
            🐾 Dos mundos, un mismo amor
          </span>
          <h2
            className="font-display font-black text-text-primary"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
          >
            ¿Quién manda en casa hoy?
          </h2>
        </motion.div>

        {/* Category cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.6, delay: i * 0.12 }}
            >
              <Link href={`/productos?categoria=${cat.slug}`} className="group block">
                <motion.div
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.25 }}
                  className={`relative rounded-4xl overflow-hidden border-2 ${cat.border} bg-white shadow-card group-hover:shadow-card-hover transition-shadow duration-300`}
                >
                  {/* Image area */}
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={cat.image}
                      alt={cat.name}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Warm overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

                    {/* Emoji badge */}
                    <div className="absolute top-4 left-4 w-12 h-12 bg-white rounded-2xl shadow-warm flex items-center justify-center text-2xl">
                      {cat.emoji}
                    </div>

                    {/* Count pill */}
                    <div className="absolute top-4 right-4 px-3 py-1.5 bg-white/90 backdrop-blur-sm rounded-full text-xs font-bold text-text-secondary">
                      {cat.id === 'perros' ? perrosCount : gatosCount} productos
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 flex items-center justify-between">
                    <div>
                      <p className={`text-xs font-bold mb-1 ${cat.accent}`}>{cat.tagline}</p>
                      <h3 className="font-display font-black text-2xl text-text-primary">{cat.name}</h3>
                      <p className="text-sm text-text-muted mt-1 max-w-xs">{cat.description}</p>
                    </div>
                    <div className={`ml-4 flex-shrink-0 w-12 h-12 rounded-2xl ${cat.btnBg} flex items-center justify-center shadow-warm group-hover:scale-110 transition-transform`}>
                      <ArrowRight size={20} />
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Wave */}
      <div className="mt-20 md:mt-28 -mb-20 md:-mb-28 overflow-hidden pointer-events-none">
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-10 md:h-14 fill-cream">
          <path d="M0,20 C480,60 960,0 1440,40 L1440,60 L0,60 Z" />
        </svg>
      </div>
    </section>
  )
}
