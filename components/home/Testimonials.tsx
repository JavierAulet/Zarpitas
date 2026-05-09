'use client'
import { motion } from 'framer-motion'

const testimonials = [
  {
    id: '1',
    name: 'Carmen R.',
    initials: 'CR',
    location: 'Madrid',
    pet: 'Max, Golden Retriever',
    text: 'El collar GPS ha cambiado nuestra vida por completo. Max escapa del jardín constantemente, pero ahora siempre sé dónde está en segundos. El servicio de atención fue maravilloso también.',
    rating: 5,
    emoji: '🐕',
    color: 'bg-orange text-white',
  },
  {
    id: '2',
    name: 'Javier M.',
    initials: 'JM',
    location: 'Barcelona',
    pet: 'Luna, Gata Persa',
    text: 'La fuente bebedero es increíble. Luna antes no bebía suficiente agua y el vet estaba preocupado. Ahora bebe el doble y se ve más activa que nunca. ¡La recomiendo a todos!',
    rating: 5,
    emoji: '🐈',
    color: 'bg-green text-white',
  },
  {
    id: '3',
    name: 'María G.',
    initials: 'MG',
    location: 'Valencia',
    pet: 'Rocky, Bulldog Francés',
    text: 'Compré la cama ortopédica para Rocky que tiene displasia de cadera. El cambio es espectacular — duerme toda la noche por primera vez en meses. Embalaje precioso y envío rapidísimo.',
    rating: 5,
    emoji: '🐶',
    color: 'bg-orange-dark text-white',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
}

export default function Testimonials() {
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
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange text-xs font-bold mb-3">
            💬 Lo que dicen
          </span>
          <h2
            className="font-display font-black text-text-primary mb-3"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
          >
            +5.000 familias confían
            <br />en Zarpitas
          </h2>
          {/* Overall rating */}
          <div className="flex items-center justify-center gap-2">
            <div className="flex gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="text-orange text-xl">★</span>
              ))}
            </div>
            <span className="font-display font-black text-2xl text-orange">4.9</span>
            <span className="text-text-muted text-sm">de 5 de media</span>
          </div>
        </motion.div>

        {/* Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-60px' }}
          className="grid md:grid-cols-3 gap-5"
        >
          {testimonials.map((t) => (
            <motion.div
              key={t.id}
              variants={cardVariants}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.25 }}
              className="bg-white rounded-4xl p-6 md:p-7 border-2 border-cream-deep shadow-card hover:shadow-card-hover transition-shadow duration-300 flex flex-col"
            >
              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {Array.from({ length: t.rating }).map((_, i) => (
                  <span key={i} className="text-orange text-sm">★</span>
                ))}
              </div>

              {/* Quote */}
              <p className="text-text-secondary text-sm leading-relaxed flex-1 mb-6">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-4 border-t border-cream-deep">
                <div className={`w-11 h-11 rounded-2xl flex-shrink-0 ring-2 ring-orange/20 flex items-center justify-center font-black text-sm ${t.color}`}>
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-bold text-text-primary">{t.name}</p>
                  <p className="text-xs text-text-muted">{t.emoji} {t.pet} · {t.location}</p>
                </div>
                <span className="ml-auto text-xs font-bold text-green flex items-center gap-1">
                  ✓ Verificado
                </span>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-12"
        >
          <p className="text-text-muted text-sm">
            ¿Ya eres cliente?{' '}
            <a href="#" className="text-orange font-bold hover:underline">
              Deja tu reseña y recibe un descuento 🎁
            </a>
          </p>
        </motion.div>
      </div>
    </section>
  )
}
