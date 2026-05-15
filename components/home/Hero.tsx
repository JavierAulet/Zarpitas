'use client'
import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ShieldCheck, Truck, RotateCcw } from 'lucide-react'
import Button from '@/components/ui/Button'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.12, delayChildren: 0.1 },
  },
}
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const floatVariants = {
  animate: {
    y: [0, -8, 0],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
  },
}

export default function Hero() {
  return (
    <section className="relative min-h-screen bg-cream overflow-hidden flex items-center pt-20">
      {/* Decorative blobs */}
      <div className="absolute top-16 right-0 w-[600px] h-[600px] bg-orange-50 rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-green-50 rounded-full translate-y-1/3 -translate-x-1/3 pointer-events-none" />


      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12 md:py-0">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left — Text */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-6 lg:gap-7"
          >
            {/* Pill label */}
            <motion.div variants={itemVariants}>
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 border border-orange/15 text-orange text-sm font-bold">
                🐾 La tienda hecha por amantes de las mascotas
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="font-display font-black text-text-primary leading-[1.08]"
              style={{ fontSize: 'clamp(2.6rem, 6vw, 5rem)' }}
            >
              Todo el amor
              <br />
              que merece tu
              <br />
              <span className="text-orange-gradient">mejor amigo</span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={itemVariants}
              className="text-text-secondary text-lg leading-relaxed max-w-md"
            >
              Productos premium para perros y gatos, escogidos con el mismo amor con el
              que cuidas a tu mascota. Envío gratuito con seguimiento a toda España.
            </motion.p>

            {/* CTAs */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
              <Link href="/productos">
                <Button size="lg" className="group">
                  Explorar productos
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link href="/productos?categoria=gatos">
                <Button variant="secondary" size="lg">
                  🐱 Ver para gatos
                </Button>
              </Link>
            </motion.div>

            {/* Trust strip */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap gap-5 pt-4 border-t border-cream-deep"
            >
              {[
                { icon: Truck, text: 'Envío Gratuito', sub: 'Seguimiento incluido' },
                { icon: RotateCcw, text: 'Devolución 30 días', sub: 'Sin preguntas' },
                { icon: ShieldCheck, text: 'Pago seguro', sub: '100% protegido' },
              ].map(({ icon: Icon, text, sub }) => (
                <div key={text} className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-green-50 border border-green/10 flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className="text-green" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-text-primary">{text}</p>
                    <p className="text-xs text-text-muted">{sub}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right — Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, x: 40 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
            className="relative"
          >
            {/* Orange blob behind image */}
            <div className="absolute inset-0 bg-orange-50 rounded-[3rem] rotate-3 scale-95 -z-0" />

            {/* Main image — pon tu foto en /public/images/hero.jpg */}
            <div className="relative rounded-[2.5rem] overflow-hidden aspect-[4/5] shadow-float z-10 bg-orange-50">
              <Image
                src="/images/hero.jpg"
                alt="Mascota feliz con productos Zarpitas"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
              {/* Warm overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-orange/10 via-transparent to-transparent" />
            </div>

            {/* Floating card — shipping */}
            <motion.div
              variants={floatVariants}
              animate="animate"
              className="absolute -left-6 top-12 bg-white rounded-2xl shadow-float px-4 py-3 z-20 border border-cream-deep"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center">
                  <Truck size={15} className="text-green" />
                </div>
                <div>
                  <p className="text-xs font-black text-text-primary">Envío gratis</p>
                  <p className="text-[10px] text-text-muted">Para pedidos +40€</p>
                </div>
              </div>
            </motion.div>

            {/* Floating card — review */}
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              className="absolute -right-4 bottom-16 bg-white rounded-2xl shadow-float px-4 py-3 z-20 border border-cream-deep"
            >
              <div className="flex items-center gap-1.5 mb-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span key={i} className="text-orange text-xs">★</span>
                ))}
              </div>
              <p className="text-xs font-black text-text-primary">+5.000 mascotas</p>
              <p className="text-[10px] text-text-muted">nos adoran 🐾</p>
            </motion.div>

            {/* Floating badge — new */}
            <motion.div
              animate={{ rotate: [-4, 4, -4] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-6 right-6 bg-orange text-white rounded-xl px-3 py-1.5 z-20 shadow-orange"
            >
              <p className="text-xs font-black">✨ Nuevos collares GPS</p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0 overflow-hidden leading-none pointer-events-none">
        <svg viewBox="0 0 1440 60" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" className="w-full h-10 md:h-14 fill-cream-warm">
          <path d="M0,40 C360,0 1080,60 1440,20 L1440,60 L0,60 Z" />
        </svg>
      </div>
    </section>
  )
}
