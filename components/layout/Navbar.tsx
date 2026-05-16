'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Search, Menu, X, User } from 'lucide-react'
import { useCartItemCount } from '@/lib/store/cartStore'
import { useUIStore } from '@/lib/store/uiStore'
import { createClient } from '@/lib/supabase/client'

const navLinks = [
  { href: '/productos', label: 'Todo' },
  { href: '/productos?categoria=perros', label: '🐶 Perros' },
  { href: '/productos?categoria=gatos', label: '🐱 Gatos' },
  { href: '/blog', label: '📖 Blog' },
  { href: '/faq', label: 'Ayuda' },
]

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const itemCount = useCartItemCount()
  const { openCart, isMobileMenuOpen, openMobileMenu, closeMobileMenu, setSearchQuery } =
    useUIStore()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserName(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Mi cuenta')
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (session?.user) {
        setUserName(session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Mi cuenta')
      } else {
        setUserName(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-white/95 backdrop-blur-md shadow-warm py-3 border-b border-cream-deep'
            : 'bg-cream/80 backdrop-blur-sm py-4'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
                transition={{ duration: 0.4 }}
                className="w-9 h-9 bg-orange rounded-xl flex items-center justify-center shadow-orange/30 shadow-md"
              >
                <span className="text-lg">🐾</span>
              </motion.div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-black text-xl text-text-primary tracking-tight">
                  Zarpitas
                  <span className="text-orange">.</span>
                </span>
                <span className="text-[10px] text-text-muted font-medium tracking-widest uppercase">
                  para mascotas
                </span>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-4 py-2 rounded-full text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-cream-warm transition-all duration-200"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-cream-warm transition-all"
                aria-label="Buscar"
              >
                <Search size={19} />
              </motion.button>

              {/* Account button */}
              <Link href={userName ? '/mi-cuenta/pedidos' : '/mi-cuenta/login'}>
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  className="p-2.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-cream-warm transition-all flex items-center justify-center"
                  aria-label="Mi cuenta"
                >
                  {userName ? (
                    <div className="w-[19px] h-[19px] rounded-full bg-orange flex items-center justify-center">
                      <span className="text-white font-black text-[10px] leading-none">
                        {userName.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  ) : (
                    <User size={19} />
                  )}
                </motion.div>
              </Link>

              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={openCart}
                className="relative p-2.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-cream-warm transition-all"
                aria-label="Carrito"
              >
                <ShoppingBag size={19} />
                <AnimatePresence>
                  {itemCount > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0, rotate: -20 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      className="absolute -top-0.5 -right-0.5 bg-orange text-white text-[10px] font-black rounded-full w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center leading-none"
                    >
                      {itemCount > 9 ? '9+' : itemCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                onClick={isMobileMenuOpen ? closeMobileMenu : openMobileMenu}
                className="md:hidden p-2.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-cream-warm transition-all"
                aria-label="Menú"
              >
                {isMobileMenuOpen ? <X size={19} /> : <Menu size={19} />}
              </motion.button>
            </div>
          </div>

          {/* Search bar */}
          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="pt-3 pb-1">
                  <div className="relative">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type="text"
                      placeholder="¿Qué busca tu mascota hoy?"
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                      className="w-full bg-cream-warm border-2 border-cream-deep focus:border-orange rounded-2xl py-3 pl-10 pr-4 text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors"
                    />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.header>

      {/* Mobile menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeMobileMenu}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-30 md:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed right-0 top-0 h-full w-72 bg-white z-40 md:hidden flex flex-col pt-20 shadow-float"
            >
              {/* Mobile nav items */}
              <div className="px-4 space-y-1">
                {navLinks.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ x: 40, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: i * 0.07 + 0.05 }}
                  >
                    <Link
                      href={link.href}
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-text-secondary hover:text-text-primary hover:bg-cream-warm transition-all font-semibold"
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Account link mobile */}
              <div className="px-4 pt-2 border-t border-cream-deep mt-2">
                <Link
                  href={userName ? '/mi-cuenta/pedidos' : '/mi-cuenta/login'}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl text-text-secondary hover:text-text-primary hover:bg-cream-warm transition-all font-semibold"
                >
                  {userName ? (
                    <>
                      <div className="w-6 h-6 rounded-full bg-orange flex items-center justify-center">
                        <span className="text-white font-black text-[11px]">{userName.charAt(0).toUpperCase()}</span>
                      </div>
                      Mi cuenta
                    </>
                  ) : (
                    <>
                      <User size={18} />
                      Iniciar sesión
                    </>
                  )}
                </Link>
              </div>

              {/* Bottom promo */}
              <div className="mt-auto mb-8 mx-4 p-4 rounded-2xl bg-orange-50 border border-orange/10">
                <p className="text-sm font-bold text-orange">🎁 Envío gratis desde 40€</p>
                <p className="text-xs text-text-muted mt-0.5">En toda España peninsular</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
