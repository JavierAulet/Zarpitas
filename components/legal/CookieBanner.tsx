'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Cookie, ChevronDown } from 'lucide-react'
import Link from 'next/link'

type ConsentLevel = 'all' | 'necessary' | null

interface CookiePreferences {
  necessary: boolean
  analytics: boolean
  marketing: boolean
}

const STORAGE_KEY = 'zarpitas_cookie_consent'

function getStoredConsent(): ConsentLevel {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === 'all' || raw === 'necessary') return raw
  return null
}

export default function CookieBanner() {
  const [consent, setConsent] = useState<ConsentLevel | undefined>(undefined)
  const [showConfig, setShowConfig] = useState(false)
  const [prefs, setPrefs] = useState<CookiePreferences>({
    necessary: true,
    analytics: true,
    marketing: false,
  })

  useEffect(() => {
    setConsent(getStoredConsent())
  }, [])

  function save(level: ConsentLevel) {
    if (!level) return
    localStorage.setItem(STORAGE_KEY, level)
    setConsent(level)
    if (level === 'all') {
      localStorage.setItem('zarpitas_analytics', 'true')
    } else {
      localStorage.removeItem('zarpitas_analytics')
    }
  }

  function saveCustom() {
    const level = prefs.analytics ? 'all' : 'necessary'
    save(level)
  }

  if (consent !== null && consent !== undefined) return null
  if (consent === undefined) return null

  return (
    <AnimatePresence>
      <motion.div
        key="cookie-banner"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      >
        <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-2xl border-2 border-cream-deep overflow-hidden">
          {/* Main bar */}
          <div className="p-5 md:p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center flex-shrink-0">
                <Cookie size={20} className="text-orange" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-black text-text-primary text-base mb-1">
                  Usamos cookies 🍪
                </p>
                <p className="text-xs text-text-secondary leading-relaxed">
                  Utilizamos cookies técnicas (necesarias) y analíticas para mejorar tu experiencia. Puedes aceptarlas todas, elegir solo las necesarias o{' '}
                  <button
                    onClick={() => setShowConfig((v) => !v)}
                    className="text-orange font-bold hover:underline inline-flex items-center gap-0.5"
                  >
                    configurarlas
                    <ChevronDown size={12} className={`transition-transform ${showConfig ? 'rotate-180' : ''}`} />
                  </button>
                  . Más info en nuestra{' '}
                  <Link href="/politica-de-cookies" className="text-orange font-bold hover:underline">
                    Política de Cookies
                  </Link>
                  .
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2 mt-4 md:mt-5">
              <button
                onClick={() => save('all')}
                className="flex-1 md:flex-none px-5 py-2.5 bg-orange text-white rounded-full text-sm font-bold hover:bg-orange-600 transition-colors shadow-sm"
              >
                Aceptar todas
              </button>
              <button
                onClick={() => save('necessary')}
                className="flex-1 md:flex-none px-5 py-2.5 border-2 border-cream-deep text-text-secondary rounded-full text-sm font-semibold hover:border-orange/30 hover:text-orange transition-colors"
              >
                Solo necesarias
              </button>
              <button
                onClick={() => setShowConfig((v) => !v)}
                className="flex-1 md:flex-none px-5 py-2.5 border-2 border-cream-deep text-text-muted rounded-full text-sm font-semibold hover:border-orange/30 hover:text-orange transition-colors"
              >
                Configurar
              </button>
            </div>
          </div>

          {/* Expandable config panel */}
          <AnimatePresence>
            {showConfig && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="border-t-2 border-cream-deep bg-cream px-5 md:px-6 py-4 space-y-3">
                  {/* Necessary — always on */}
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-bold text-text-primary">Cookies técnicas</p>
                      <p className="text-xs text-text-muted">Necesarias para el funcionamiento del sitio. No se pueden desactivar.</p>
                    </div>
                    <div className="w-10 h-5 bg-green rounded-full relative flex-shrink-0 opacity-60 cursor-not-allowed">
                      <div className="absolute right-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow" />
                    </div>
                  </div>

                  {/* Analytics */}
                  <div className="flex items-center justify-between py-2 border-t border-cream-deep">
                    <div>
                      <p className="text-sm font-bold text-text-primary">Cookies analíticas</p>
                      <p className="text-xs text-text-muted">Google Analytics — nos ayudan a entender cómo usas el sitio.</p>
                    </div>
                    <button
                      onClick={() => setPrefs((p) => ({ ...p, analytics: !p.analytics }))}
                      className={`w-10 h-5 rounded-full relative flex-shrink-0 transition-colors ${prefs.analytics ? 'bg-orange' : 'bg-cream-deep'}`}
                    >
                      <div
                        className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${prefs.analytics ? 'right-0.5' : 'left-0.5'}`}
                      />
                    </button>
                  </div>

                  <button
                    onClick={saveCustom}
                    className="w-full py-2.5 bg-orange text-white rounded-full text-sm font-bold hover:bg-orange-600 transition-colors mt-2"
                  >
                    Guardar preferencias
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
