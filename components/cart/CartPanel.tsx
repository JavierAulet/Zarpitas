'use client'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag, ArrowRight, Trash2 } from 'lucide-react'
import { useCartStore, useCartTotal } from '@/lib/store/cartStore'
import { useUIStore } from '@/lib/store/uiStore'
import CartItemComponent from './CartItem'

export default function CartPanel() {
  const isOpen = useUIStore((state) => state.isCartOpen)
  const closeCart = useUIStore((state) => state.closeCart)
  const items = useCartStore((state) => state.items)
  const clearCart = useCartStore((state) => state.clearCart)
  const total = useCartTotal()

  const freeShippingThreshold = 40
  const remaining = Math.max(0, freeShippingThreshold - total)
  const progress = Math.min(100, (total / freeShippingThreshold) * 100)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-50"
          />

          {/* Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed right-0 top-0 h-full w-full max-w-[400px] bg-cream z-50 flex flex-col shadow-float border-l border-cream-deep"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-cream-deep bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-orange rounded-xl flex items-center justify-center">
                  <ShoppingBag size={15} className="text-white" />
                </div>
                <h2 className="font-display font-black text-lg text-text-primary">
                  Tu carrito
                </h2>
                {items.length > 0 && (
                  <span className="text-sm text-text-muted font-medium">
                    · {items.length} {items.length === 1 ? 'artículo' : 'artículos'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                {items.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="p-2 rounded-xl text-text-muted hover:text-error hover:bg-red-50 transition-all"
                    aria-label="Vaciar"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
                <button
                  onClick={closeCart}
                  className="p-2 rounded-xl text-text-muted hover:text-text-primary hover:bg-cream-warm transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Free shipping progress */}
            {items.length > 0 && (
              <div className="px-5 py-3 bg-white border-b border-cream-deep">
                {remaining > 0 ? (
                  <p className="text-xs text-text-secondary font-medium mb-2">
                    Añade <span className="font-black text-orange">{remaining.toFixed(2).replace('.', ',')}€</span> más para envío gratis 🚀
                  </p>
                ) : (
                  <p className="text-xs font-black text-green mb-2">✓ ¡Tienes envío gratis!</p>
                )}
                <div className="h-2 bg-cream-warm border border-cream-deep rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="h-full bg-gradient-orange rounded-full"
                  />
                </div>
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-5">
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center gap-4"
                >
                  <div className="w-20 h-20 rounded-3xl bg-cream-warm border-2 border-cream-deep flex items-center justify-center text-4xl">
                    🛒
                  </div>
                  <div>
                    <p className="font-display font-black text-lg text-text-secondary mb-1">Tu carrito está vacío</p>
                    <p className="text-sm text-text-muted">¡Encuentra algo increíble para tu mascota!</p>
                  </div>
                  <Link
                    href="/productos"
                    onClick={closeCart}
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-orange text-white font-bold text-sm shadow-orange hover:bg-orange-dark transition-colors"
                  >
                    Explorar productos <ArrowRight size={14} />
                  </Link>
                </motion.div>
              ) : (
                <AnimatePresence>
                  <div className="space-y-5">
                    {items.map((item) => (
                      <CartItemComponent key={item.id} item={item} />
                    ))}
                  </div>
                </AnimatePresence>
              )}
            </div>

            {/* Footer */}
            {items.length > 0 && (
              <div className="px-5 py-5 border-t border-cream-deep bg-white space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-text-secondary font-medium">Subtotal</span>
                  <span className="font-display font-black text-2xl text-orange">
                    {total.toFixed(2).replace('.', ',')}€
                  </span>
                </div>

                {remaining > 0 && (
                  <p className="text-xs text-text-muted">+ Gastos de envío (gratis desde 40€)</p>
                )}

                <Link href="/checkout" onClick={closeCart}>
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-full bg-gradient-orange text-white font-bold shadow-orange hover:shadow-orange-lg transition-shadow cursor-pointer"
                  >
                    Finalizar pedido <ArrowRight size={16} />
                  </motion.div>
                </Link>

                <Link
                  href="/carrito"
                  onClick={closeCart}
                  className="block text-center text-sm text-text-secondary hover:text-orange transition-colors font-medium"
                >
                  Ver carrito completo
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
