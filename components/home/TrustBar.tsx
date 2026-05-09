'use client'
import { motion } from 'framer-motion'
import { Truck, RotateCcw, ShieldCheck, HeartHandshake } from 'lucide-react'

const items = [
  { icon: Truck, emoji: '🚀', title: 'Envío en 24h', desc: 'Gratis desde 40€ en España', color: 'bg-green-50 border-green/10', iconColor: 'text-green' },
  { icon: RotateCcw, emoji: '↩️', title: 'Devolución 30 días', desc: 'Sin preguntas, sin complicaciones', color: 'bg-orange-50 border-orange/10', iconColor: 'text-orange' },
  { icon: ShieldCheck, emoji: '🔒', title: 'Pago 100% seguro', desc: 'Visa, Mastercard, PayPal, Bizum', color: 'bg-green-50 border-green/10', iconColor: 'text-green' },
  { icon: HeartHandshake, emoji: '❤️', title: '+5.000 mascotas felices', desc: 'Valoración media de 4.9 estrellas', color: 'bg-orange-50 border-orange/10', iconColor: 'text-orange' },
]

export default function TrustBar() {
  return (
    <section className="bg-cream-warm py-10 border-b border-cream-deep">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="flex items-start gap-3"
            >
              <div className={`w-11 h-11 rounded-2xl border ${item.color} flex items-center justify-center flex-shrink-0`}>
                <item.icon size={19} className={item.iconColor} />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary leading-tight">{item.title}</p>
                <p className="text-xs text-text-muted mt-0.5 leading-snug">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
