'use client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, ShoppingBag } from 'lucide-react'
import { useCartStore, useCartTotal } from '@/lib/store/cartStore'
import CartItem from '@/components/cart/CartItem'
import Button from '@/components/ui/Button'

export default function CarritoPage() {
  const items = useCartStore((state) => state.items)
  const total = useCartTotal()
  const freeShipping = total >= 40
  const shipping = freeShipping ? 0 : 4.99

  return (
    <div className="min-h-screen bg-cream pt-28 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-10"
        >
          <Link href="/productos" className="inline-flex items-center gap-2 text-text-muted hover:text-orange transition-colors text-sm font-medium mb-5">
            <ArrowLeft size={15} /> Seguir comprando
          </Link>
          <h1 className="font-display font-black text-text-primary" style={{ fontSize: 'clamp(2rem, 4vw, 3.5rem)' }}>
            Tu carrito 🛒
          </h1>
        </motion.div>

        {items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 text-center"
          >
            <div className="w-24 h-24 rounded-4xl bg-cream-warm border-2 border-cream-deep flex items-center justify-center text-5xl mb-6">
              🛒
            </div>
            <h2 className="font-display font-black text-2xl text-text-secondary mb-2">Tu carrito está vacío</h2>
            <p className="text-text-muted mb-8">¡Descubre productos increíbles para tu mascota!</p>
            <Link href="/productos"><Button size="lg">Explorar productos 🐾</Button></Link>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-4xl border-2 border-cream-deep shadow-card p-6 md:p-8 space-y-6">
                <AnimatePresence>
                  {items.map((item, i) => (
                    <motion.div key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      <CartItem item={item} />
                      {i < items.length - 1 && <div className="mt-6 border-t-2 border-cream-deep" />}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>

            {/* Summary */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-4xl border-2 border-cream-deep shadow-card p-6 md:p-8 sticky top-28"
              >
                <h2 className="font-display font-black text-xl text-text-primary mb-6">Resumen</h2>

                <div className="space-y-3 mb-5">
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Subtotal</span>
                    <span className="font-medium">{total.toFixed(2).replace('.', ',')}€</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Envío</span>
                    <span className={freeShipping ? 'font-bold text-green' : 'font-medium'}>
                      {freeShipping ? '¡Gratis! 🎉' : `${shipping.toFixed(2).replace('.', ',')}€`}
                    </span>
                  </div>
                  {!freeShipping && (
                    <div className="p-3 rounded-2xl bg-orange-50 border border-orange/10 text-xs text-orange font-medium">
                      Añade {(40 - total).toFixed(2).replace('.', ',')}€ más para envío gratis 🚀
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center pt-4 border-t-2 border-cream-deep mb-5">
                  <span className="font-display font-black text-text-primary">Total</span>
                  <span className="font-display font-black text-2xl text-orange">
                    {(total + shipping).toFixed(2).replace('.', ',')}€
                  </span>
                </div>

                <Link href="/checkout">
                  <Button fullWidth size="lg" className="group gap-2">
                    Ir al pago
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>

                <div className="mt-5 pt-5 border-t border-cream-deep space-y-1.5">
                  {['🔒 Pago 100% seguro', '🚀 Envío express 24h', '↩️ Devolución 30 días'].map((t) => (
                    <p key={t} className="text-xs text-text-muted text-center">{t}</p>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
