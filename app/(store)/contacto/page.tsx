'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Clock, CheckCircle, Send, MessageCircle, Truck, RotateCcw } from 'lucide-react'
import Link from 'next/link'

const subjects = [
  'Estado de mi pedido',
  'Problema con un producto',
  'Solicitar devolución',
  'Pregunta sobre un producto',
  'Problema con el pago',
  'Otro',
]

const quickLinks = [
  { icon: Truck, label: 'Info de envíos', href: '/faq#envios' },
  { icon: RotateCcw, label: 'Devoluciones', href: '/faq#devoluciones' },
  { icon: MessageCircle, label: 'Preguntas frecuentes', href: '/faq' },
]

export default function ContactoPage() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error al enviar')
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al enviar el mensaje')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = 'w-full bg-cream-warm border-2 border-cream-deep focus:border-orange rounded-2xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none transition-colors'

  return (
    <main className="min-h-screen bg-cream pt-24 pb-20">
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-12">
        <p className="text-xs font-bold text-orange uppercase tracking-widest mb-3">Estamos aquí</p>
        <h1 className="font-display font-black text-4xl md:text-5xl text-text-primary mb-4">
          ¿En qué podemos ayudarte?
        </h1>
        <p className="text-text-secondary text-lg max-w-xl mx-auto">
          Escríbenos y te respondemos en menos de 24 horas. Somos personas reales y nos importa tu experiencia.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-5 gap-8">
          {/* Sidebar info */}
          <div className="md:col-span-2 space-y-4">
            {/* Response time */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-3xl border-2 border-cream-deep p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-2xl bg-green/10 border border-green/20 flex items-center justify-center">
                  <Clock size={18} className="text-green" />
                </div>
                <div>
                  <p className="font-bold text-text-primary text-sm">Tiempo de respuesta</p>
                  <p className="text-green font-black text-lg">menos de 24h</p>
                </div>
              </div>
              <div className="space-y-2 text-sm text-text-secondary">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green" />
                  Lunes a viernes: 9h – 20h
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange" />
                  Fines de semana: 10h – 14h
                </div>
              </div>
            </motion.div>

            {/* Email */}
            <motion.a
              href="mailto:hola@zarpitas.es"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex items-center gap-4 bg-white rounded-3xl border-2 border-cream-deep p-5 hover:border-orange/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-2xl bg-orange/10 border border-orange/20 flex items-center justify-center">
                <Mail size={18} className="text-orange" />
              </div>
              <div>
                <p className="text-xs text-text-muted font-medium">Email</p>
                <p className="font-bold text-text-primary text-sm group-hover:text-orange transition-colors">
                  hola@zarpitas.es
                </p>
              </div>
            </motion.a>

            {/* Quick links */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="bg-white rounded-3xl border-2 border-cream-deep p-6"
            >
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Accesos rápidos</p>
              <div className="space-y-2">
                {quickLinks.map(({ icon: Icon, label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-cream-warm transition-colors group"
                  >
                    <Icon size={15} className="text-text-muted group-hover:text-orange transition-colors" />
                    <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors font-medium">
                      {label}
                    </span>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.05 }}
            className="md:col-span-3"
          >
            <div className="bg-white rounded-3xl border-2 border-cream-deep p-6 md:p-8">
              {sent ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="w-16 h-16 rounded-full bg-green/10 border-2 border-green/20 flex items-center justify-center mb-5">
                    <CheckCircle size={32} className="text-green" />
                  </div>
                  <h2 className="font-display font-black text-2xl text-text-primary mb-2">
                    ¡Mensaje enviado!
                  </h2>
                  <p className="text-text-secondary text-sm max-w-xs mb-6">
                    Hemos recibido tu mensaje. Te responderemos a <strong>{form.email}</strong> en menos de 24 horas.
                  </p>
                  <button
                    onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                    className="text-sm text-orange font-semibold hover:underline"
                  >
                    Enviar otro mensaje
                  </button>
                </motion.div>
              ) : (
                <>
                  <h2 className="font-display font-black text-xl text-text-primary mb-6">
                    Envíanos un mensaje
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                          Nombre
                        </label>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          required
                          placeholder="Tu nombre"
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                          Email
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          placeholder="tu@email.com"
                          className={inputClass}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                        Asunto
                      </label>
                      <select
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        required
                        className={inputClass}
                      >
                        <option value="">Selecciona un motivo</option>
                        {subjects.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                        Mensaje
                      </label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        placeholder="Cuéntanos en qué podemos ayudarte..."
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-500 font-medium bg-red-50 border border-red-100 rounded-xl px-4 py-2.5">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 bg-orange text-white font-bold py-3.5 rounded-2xl hover:bg-orange-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm"
                    >
                      {loading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Enviando...
                        </span>
                      ) : (
                        <>
                          <Send size={15} />
                          Enviar mensaje
                        </>
                      )}
                    </button>

                    <p className="text-xs text-text-muted text-center">
                      Al enviar este mensaje aceptas nuestra{' '}
                      <Link href="/politica-de-privacidad" className="text-orange hover:underline">
                        política de privacidad
                      </Link>
                    </p>
                  </form>
                </>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
