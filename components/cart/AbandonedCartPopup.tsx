'use client'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag, Mail, Loader2, Check } from 'lucide-react'
import { useCartStore } from '@/lib/store/cartStore'

const SESSION_KEY = 'zarpitas-exit-popup-shown'

export default function AbandonedCartPopup() {
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const items = useCartStore((state) => state.items)
  const pathname = usePathname()

  const isCheckout = pathname.includes('/checkout')

  useEffect(() => {
    if (isCheckout || items.length === 0) return
    if (sessionStorage.getItem(SESSION_KEY)) return

    let triggered = false

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 5 && !triggered) {
        triggered = true
        setVisible(true)
        sessionStorage.setItem(SESSION_KEY, '1')
      }
    }

    // Small delay to avoid triggering immediately on page load
    const timer = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave)
    }, 8000)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [isCheckout, items.length, pathname])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/cart/abandon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          items: items.map((i) => ({
            name: i.variantName ? `${i.name} — ${i.variantName}` : i.name,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
          })),
        }),
      })
      if (res.ok) {
        setDone(true)
      } else {
        setError('No pudimos guardar tu carrito. Inténtalo de nuevo.')
      }
    } catch {
      setError('Error de conexión.')
    }
    setLoading(false)
  }

  const handleClose = () => setVisible(false)

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 z-[999] backdrop-blur-sm"
          />

          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 sm:inset-auto sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:top-1/2 sm:w-full sm:max-w-md z-[1000]"
          >
            <div className="bg-white rounded-4xl shadow-2xl border-2 border-cream-deep overflow-hidden">
              {/* Header */}
              <div className="bg-orange px-6 py-5 relative">
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-4 p-1.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={16} />
                </button>
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-white/20 rounded-2xl flex items-center justify-center text-2xl">
                    🛒
                  </div>
                  <div>
                    <p className="text-white font-black text-lg leading-tight">¡Espera!</p>
                    <p className="text-white/80 text-sm">Tienes {items.length} artículo{items.length !== 1 ? 's' : ''} en tu carrito</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {done ? (
                  <div className="text-center py-4">
                    <div className="w-14 h-14 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-3">
                      <Check size={24} className="text-green" />
                    </div>
                    <p className="font-bold text-text-primary mb-1">¡Carrito guardado!</p>
                    <p className="text-text-muted text-sm">Te enviamos un recordatorio por email en 1 hora 🐾</p>
                    <button onClick={handleClose} className="mt-4 text-orange text-sm font-bold hover:underline">
                      Seguir viendo productos
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <p className="text-text-primary font-bold mb-1">¿Te vas sin comprar?</p>
                      <p className="text-text-muted text-sm">
                        Deja tu email y te enviamos el carrito para que no pierdas nada.
                      </p>
                    </div>

                    {/* Cart preview */}
                    <div className="bg-cream-warm rounded-2xl p-3 mb-4 space-y-2 max-h-28 overflow-hidden">
                      {items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center gap-2 text-xs">
                          <ShoppingBag size={11} className="text-orange shrink-0" />
                          <span className="text-text-secondary flex-1 truncate">
                            {item.variantName ? `${item.name} — ${item.variantName}` : item.name}
                          </span>
                          <span className="font-bold text-orange shrink-0">
                            {(item.price * item.quantity).toFixed(2).replace('.', ',')}€
                          </span>
                        </div>
                      ))}
                      {items.length > 3 && (
                        <p className="text-xs text-text-muted">+{items.length - 3} más...</p>
                      )}
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
                      <div className="relative">
                        <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="tu@email.com"
                          className="w-full bg-cream-warm border-2 border-cream-deep rounded-2xl pl-9 pr-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-orange/50 transition-colors"
                        />
                      </div>

                      {error && <p className="text-red-500 text-xs">{error}</p>}

                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex items-center justify-center gap-2 bg-orange hover:bg-orange-dark text-white font-bold py-3 rounded-2xl text-sm transition-colors disabled:opacity-60"
                      >
                        {loading ? <Loader2 size={14} className="animate-spin" /> : null}
                        {loading ? 'Guardando...' : 'Guardar mi carrito 🐾'}
                      </button>
                      <button type="button" onClick={handleClose} className="w-full text-xs text-text-muted hover:text-text-primary transition-colors py-1">
                        No, gracias
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
