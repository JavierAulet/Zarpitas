'use client'
import { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const inputClass = 'w-full bg-cream-warm border-2 border-cream-deep rounded-2xl px-4 py-3 pl-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-orange/50 transition-colors'
const labelClass = 'block text-xs font-bold text-text-secondary uppercase tracking-wider mb-1.5'

export default function MisDatosPage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? '')
        setName(user.user_metadata?.full_name ?? '')
        setPhone(user.user_metadata?.phone ?? '')
        setAddress(user.user_metadata?.address ?? '')
        setCity(user.user_metadata?.city ?? '')
        setPostalCode(user.user_metadata?.postal_code ?? '')
      }
      setLoading(false)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const { error } = await supabase.auth.updateUser({
      data: { full_name: name, phone, address, city, postal_code: postalCode },
    })

    if (error) {
      setError('No se pudieron guardar los cambios')
    } else {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="text-orange animate-spin" />
      </div>
    )
  }

  return (
    <div>
      <h1 className="font-display font-black text-2xl text-text-primary mb-6">Mis datos</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Personal */}
        <div className="bg-white border-2 border-cream-deep rounded-4xl p-6 shadow-card space-y-4">
          <h2 className="font-bold text-text-primary">Información personal</h2>
          <div>
            <label className={labelClass}>Nombre completo</label>
            <div className="relative">
              <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" />
            </div>
          </div>
          <div>
            <label className={labelClass}>Email</label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input className={inputClass} value={email} disabled placeholder="tu@email.com" />
            </div>
            <p className="text-xs text-text-muted mt-1">El email no se puede cambiar por seguridad</p>
          </div>
          <div>
            <label className={labelClass}>Teléfono</label>
            <div className="relative">
              <Phone size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34 600 000 000" type="tel" />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white border-2 border-cream-deep rounded-4xl p-6 shadow-card space-y-4">
          <h2 className="font-bold text-text-primary">Dirección de envío predeterminada</h2>
          <div>
            <label className={labelClass}>Dirección</label>
            <div className="relative">
              <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
              <input className={inputClass} value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle Mayor, 1, 2A" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Ciudad</label>
              <input
                className="w-full bg-cream-warm border-2 border-cream-deep rounded-2xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-orange/50 transition-colors"
                value={city} onChange={(e) => setCity(e.target.value)} placeholder="Madrid" />
            </div>
            <div>
              <label className={labelClass}>Código postal</label>
              <input
                className="w-full bg-cream-warm border-2 border-cream-deep rounded-2xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-orange/50 transition-colors"
                value={postalCode} onChange={(e) => setPostalCode(e.target.value)} placeholder="28001" />
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm bg-red-50 border border-red-100 rounded-2xl px-4 py-3">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-orange hover:bg-orange-dark text-white font-bold px-6 py-3 rounded-2xl text-sm transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : null}
          {saving ? 'Guardando...' : saved ? '¡Guardado!' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
