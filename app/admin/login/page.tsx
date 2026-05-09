'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(false)

    const res = await fetch('/api/admin/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })

    if (res.ok) {
      router.push('/admin')
    } else {
      setError(true)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-orange rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
            🐾
          </div>
          <h1 className="text-white font-bold text-2xl">Zarpitas Admin</h1>
          <p className="text-zinc-500 text-sm mt-1">Panel de administración</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
          <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2">
            Contraseña
          </label>
          <div className="relative">
            <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-9 pr-4 py-3 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-orange/50 transition-colors"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-red-400 text-xs mt-2">Contraseña incorrecta</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full mt-4 bg-orange hover:bg-orange-dark text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? 'Entrando...' : 'Acceder'}
          </button>
        </form>
      </div>
    </div>
  )
}
