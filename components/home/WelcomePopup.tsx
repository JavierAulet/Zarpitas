'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Tag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const STORAGE_KEY = 'zarpitas_welcome_shown'

export default function WelcomePopup() {
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return

    // Check if user is logged in — don't show to logged-in users
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user) return
      const timer = setTimeout(() => setVisible(true), 5000)
      return () => clearTimeout(timer)
    })
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    // Here you'd call your newsletter API — for now just mark as done
    await new Promise((r) => setTimeout(r, 800))
    localStorage.setItem(STORAGE_KEY, '1')
    setDone(true)
    setSubmitting(false)
    setTimeout(() => setVisible(false), 2500)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4"
          onClick={(e) => { if (e.target === e.currentTarget) dismiss() }}
        >
          <motion.div
            initial={{ scale: 0.88, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            className="bg-white rounded-4xl shadow-2xl max-w-md w-full overflow-hidden"
          >
            {/* Top banner */}
            <div className="bg-orange px-6 py-5 text-center relative">
              <button
                onClick={dismiss}
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
              >
                <X size={14} />
              </button>
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Tag size={26} className="text-white" />
              </div>
              <p className="text-white/80 text-sm font-medium mb-0.5">Bienvenido a Zarpitas 🐾</p>
              <h2 className="text-white font-display font-black text-3xl leading-tight">
                10% de descuento
              </h2>
              <p className="text-white/90 text-sm mt-1">en tu primer pedido</p>
            </div>

            {/* Body */}
            <div className="p-6">
              {done ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-4"
                >
                  <div className="text-4xl mb-3">🎉</div>
                  <p className="font-display font-black text-xl text-text-primary mb-1">¡Apuntado!</p>
                  <p className="text-text-muted text-sm">
                    Te enviamos el código de descuento a tu email en breve.
                  </p>
                </motion.div>
              ) : (
                <>
                  <p className="text-text-secondary text-sm text-center mb-5">
                    Suscríbete a nuestra newsletter y recibe tu código descuento al instante. Sin spam, prometido.
                  </p>
                  <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      required
                      className="w-full border-2 border-cream-deep rounded-2xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-orange/50 transition-colors bg-cream-warm"
                    />
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-orange hover:bg-orange-dark text-white font-bold py-3 rounded-2xl text-sm transition-colors disabled:opacity-60"
                    >
                      {submitting ? 'Enviando...' : 'Quiero mi 10% de descuento →'}
                    </button>
                  </form>
                  <button
                    onClick={dismiss}
                    className="w-full text-center text-xs text-text-muted hover:text-text-secondary mt-3 transition-colors"
                  >
                    No gracias, prefiero pagar el precio completo
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
