'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, ArrowRight, Check } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function Newsletter() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 900))
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <section className="py-20 md:py-28 bg-orange relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full translate-y-1/2 -translate-x-1/4 pointer-events-none" />
      <div className="absolute top-8 left-16 text-6xl opacity-10 rotate-12 pointer-events-none select-none">🐾</div>
      <div className="absolute bottom-8 right-24 text-5xl opacity-10 -rotate-12 pointer-events-none select-none">🐾</div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7 }}
          className="text-center"
        >
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-white/15 backdrop-blur-sm mb-6">
            <span className="text-3xl">🎁</span>
          </div>

          <h2
            className="font-display font-black text-white mb-3"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
          >
            10% off en tu primer pedido.
            <br />
            Solo por unirte.
          </h2>
          <p className="text-white/80 mb-8 max-w-md mx-auto leading-relaxed">
            Suscríbete a nuestra newsletter y recibe descuentos exclusivos, consejos de bienestar
            animal y primicias de nuevos productos.
          </p>

          {/* Form */}
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex flex-col items-center gap-3 py-8"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Check size={28} className="text-white" />
              </div>
              <p className="text-white font-display font-black text-xl">¡Bienvenido a la familia!</p>
              <p className="text-white/70 text-sm">Revisa tu email — tu cupón ya está en camino 🐾</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <div className="relative flex-1">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  className="w-full bg-white border-2 border-white rounded-full py-3.5 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-cream-deep transition-colors"
                />
              </div>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.03, y: -1 }}
                whileTap={{ scale: 0.97 }}
                disabled={loading}
                className="flex-shrink-0 flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-text-primary text-white font-bold text-sm hover:bg-text-secondary transition-colors disabled:opacity-60 group"
              >
                {loading ? 'Enviando...' : (
                  <>
                    Quiero mi descuento
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </motion.button>
            </form>
          )}

          {/* Benefits */}
          <div className="flex flex-wrap items-center justify-center gap-5 mt-8">
            {['10% de descuento de bienvenida', 'Ofertas exclusivas', 'Sin spam, nunca'].map((b) => (
              <div key={b} className="flex items-center gap-1.5 text-sm text-white/70">
                <Check size={13} className="text-white" />
                {b}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
