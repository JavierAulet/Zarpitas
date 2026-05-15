'use client'
import { motion } from 'framer-motion'
import { Award, Zap, HeartHandshake, Leaf } from 'lucide-react'

const reasons = [
  {
    icon: Award,
    emoji: '🏅',
    title: 'Solo lo mejor',
    description:
      'Cada producto pasa por nuestro equipo de expertos. Si no lo compraríamos para nuestras propias mascotas, no lo vendemos. Así de simple.',
    stat: '100%',
    statLabel: 'Productos verificados',
    color: 'bg-orange-50 border-orange/10',
    iconColor: 'text-orange',
  },
  {
    icon: Zap,
    emoji: '⚡',
    title: 'Rapidísimo',
    description:
      'Enviamos a toda España con seguimiento en tiempo real para que sepas dónde está tu pedido en todo momento. Envío gratuito desde 40€.',
    stat: 'FREE',
    statLabel: 'Envío desde 40€',
    color: 'bg-green-50 border-green/10',
    iconColor: 'text-green',
  },
  {
    icon: HeartHandshake,
    emoji: '💬',
    title: 'Siempre contigo',
    description:
      'Somos dueños de mascotas como tú. Nuestro equipo entiende tus dudas porque las hemos tenido también. Estamos a un mensaje.',
    stat: '4.9★',
    statLabel: 'Satisfacción de clientes',
    color: 'bg-orange-50 border-orange/10',
    iconColor: 'text-orange',
  },
  {
    icon: Leaf,
    emoji: '🌿',
    title: 'Comprometidos',
    description:
      'Buscamos proveedores que respeten el bienestar animal y el medioambiente. Comprando en Zarpitas, también cuidas el planeta.',
    stat: '0€',
    statLabel: 'Coste de devolución',
    color: 'bg-green-50 border-green/10',
    iconColor: 'text-green',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

export default function WhyZarpitas() {
  return (
    <section className="py-20 md:py-28 bg-cream">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green text-xs font-bold mb-3">
            🌿 Por qué elegirnos
          </span>
          <h2
            className="font-display font-black text-text-primary mb-3"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
          >
            Somos dueños de mascotas,
            <br />
            no solo vendedores
          </h2>
          <p className="text-text-secondary max-w-lg mx-auto">
            Creamos Zarpitas porque no encontrábamos una tienda que entendiera de verdad
            lo que significa querer a un animal.
          </p>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {reasons.map((r, i) => (
            <motion.div
              key={r.title}
              variants={cardVariants}
              whileHover={{ y: -6 }}
              transition={{ duration: 0.25 }}
              className={`p-6 rounded-4xl border-2 ${r.color} bg-white shadow-card hover:shadow-card-hover transition-shadow duration-300 flex flex-col`}
            >
              {/* Emoji + icon */}
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 rounded-2xl ${r.color} border flex items-center justify-center text-2xl`}>
                  {r.emoji}
                </div>
              </div>

              <h3 className="font-display font-black text-lg text-text-primary mb-2">{r.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed flex-1">{r.description}</p>

              {/* Stat */}
              <div className="mt-6 pt-4 border-t border-cream-deep">
                <p className={`font-display text-3xl font-black ${r.iconColor}`}>{r.stat}</p>
                <p className="text-xs text-text-muted mt-0.5">{r.statLabel}</p>
              </div>

              {/* Corner number */}
              <span className="absolute top-4 right-5 font-display text-7xl font-black text-text-primary/4 leading-none select-none pointer-events-none">
                {String(i + 1).padStart(2, '0')}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
