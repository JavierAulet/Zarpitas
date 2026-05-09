'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'register' | 'recovery'

export default function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get('redirect') || '/mi-cuenta/pedidos'

  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError('Email o contraseña incorrectos')
      } else {
        router.push(redirect)
        router.refresh()
      }
    }

    if (mode === 'register') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      })
      if (error) {
        setError(error.message === 'User already registered' ? 'Este email ya tiene cuenta' : error.message)
      } else {
        setSuccess('Revisa tu email para confirmar tu cuenta 📬')
      }
    }

    if (mode === 'recovery') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/mi-cuenta/reset-password`,
      })
      if (error) {
        setError('No se pudo enviar el email')
      } else {
        setSuccess('Te hemos enviado un enlace para restablecer tu contraseña 📬')
      }
    }

    setLoading(false)
  }

  const inputClass = 'w-full bg-cream-warm border-2 border-cream-deep rounded-2xl px-4 py-3 pl-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-orange/50 transition-colors'

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4 pt-20 pb-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-orange rounded-xl flex items-center justify-center text-xl">🐾</div>
            <span className="font-display font-black text-xl text-text-primary">Zarpitas<span className="text-orange">.</span></span>
          </Link>
          <h1 className="font-display font-black text-3xl text-text-primary">
            {mode === 'login' && 'Bienvenido de vuelta'}
            {mode === 'register' && 'Crea tu cuenta'}
            {mode === 'recovery' && 'Recuperar contraseña'}
          </h1>
          <p className="text-text-muted text-sm mt-2">
            {mode === 'login' && 'Accede para ver tus pedidos y más'}
            {mode === 'register' && 'Únete a miles de amantes de las mascotas'}
            {mode === 'recovery' && 'Te enviaremos un enlace a tu email'}
          </p>
        </div>

        <div className="bg-white rounded-4xl border-2 border-cream-deep shadow-card p-7">
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
                <div className="text-5xl mb-4">📬</div>
                <p className="text-text-primary font-bold mb-2">¡Listo!</p>
                <p className="text-text-secondary text-sm">{success}</p>
                <button onClick={() => { setSuccess(null); setMode('login') }} className="mt-4 text-orange text-sm font-bold hover:underline">
                  Volver al login
                </button>
              </motion.div>
            ) : (
              <motion.form
                key={mode}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {mode === 'register' && (
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input className={inputClass} placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                )}
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input type="email" className={inputClass} placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                {mode !== 'recovery' && (
                  <div className="relative">
                    <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      className={inputClass}
                      placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
                      {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                )}
                {error && <p className="text-red-500 text-xs bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">{error}</p>}
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 bg-orange hover:bg-orange-dark text-white font-bold py-3.5 rounded-2xl transition-colors disabled:opacity-60 text-sm">
                  {loading ? 'Un momento...' : (
                    <>
                      {mode === 'login' && 'Entrar'}
                      {mode === 'register' && 'Crear cuenta'}
                      {mode === 'recovery' && 'Enviar enlace'}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
                {mode === 'login' && (
                  <button type="button" onClick={() => setMode('recovery')} className="w-full text-center text-text-muted text-xs hover:text-orange transition-colors">
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        {!success && mode !== 'recovery' && (
          <p className="text-center text-text-muted text-sm mt-5">
            {mode === 'login' ? '¿Primera vez aquí?' : '¿Ya tienes cuenta?'}{' '}
            <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null) }} className="text-orange font-bold hover:underline">
              {mode === 'login' ? 'Crea tu cuenta gratis' : 'Inicia sesión'}
            </button>
          </p>
        )}
        {mode === 'recovery' && !success && (
          <p className="text-center text-sm mt-5">
            <button onClick={() => { setMode('login'); setError(null) }} className="text-orange font-bold hover:underline">← Volver al login</button>
          </p>
        )}
      </motion.div>
    </div>
  )
}
