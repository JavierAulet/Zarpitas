'use client'

import { useState } from 'react'
import { Check, X, RefreshCw, Eye, EyeOff, Wifi, WifiOff, AlertCircle, Settings } from 'lucide-react'

// ─── Connection tester ────────────────────────────────────────────────────────

type ConnStatus = 'idle' | 'testing' | 'ok' | 'error'

interface ConnectionCardProps {
  label: string
  description: string
  envKey: string
  testUrl: string
  icon: string
}

function ConnectionCard({ label, description, envKey, testUrl, icon }: ConnectionCardProps) {
  const [status, setStatus] = useState<ConnStatus>('idle')
  const [detail, setDetail] = useState('')

  async function test() {
    setStatus('testing')
    setDetail('')
    try {
      const res = await fetch(testUrl)
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setStatus('ok')
        setDetail('Conexión establecida correctamente')
      } else {
        setStatus('error')
        setDetail(data?.error ?? `Error ${res.status}`)
      }
    } catch (e) {
      setStatus('error')
      setDetail(String(e))
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-xl">
            {icon}
          </div>
          <div>
            <p className="text-white font-bold text-sm">{label}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{description}</p>
          </div>
        </div>
        {status !== 'idle' && (
          <div className={`flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
            status === 'testing' ? 'bg-zinc-700 text-zinc-400' :
            status === 'ok' ? 'bg-green-500/15 text-green-400' :
            'bg-red-500/15 text-red-400'
          }`}>
            {status === 'testing' && <RefreshCw size={11} className="animate-spin" />}
            {status === 'ok' && <Check size={11} />}
            {status === 'error' && <X size={11} />}
            {status === 'testing' ? 'Probando...' : status === 'ok' ? 'Conectado' : 'Error'}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2 mb-3">
        <code className="text-zinc-500 text-xs flex-1">{envKey}</code>
        {status === 'ok' ? (
          <Wifi size={13} className="text-green-400" />
        ) : status === 'error' ? (
          <WifiOff size={13} className="text-red-400" />
        ) : null}
      </div>

      {detail && (
        <p className={`text-xs mb-3 ${status === 'ok' ? 'text-green-400' : 'text-red-400'}`}>{detail}</p>
      )}

      <button
        onClick={test}
        disabled={status === 'testing'}
        className="flex items-center gap-2 text-xs font-bold px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors disabled:opacity-50"
      >
        {status === 'testing' ? <RefreshCw size={12} className="animate-spin" /> : <Wifi size={12} />}
        Probar conexión
      </button>
    </div>
  )
}

// ─── AliExpress credentials display ──────────────────────────────────────────

function AliExpressCard() {
  const [showSecret, setShowSecret] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<'idle' | 'ok' | 'error'>('idle')

  async function testAE() {
    setTesting(true)
    setTestResult('idle')
    try {
      const res = await fetch('/api/aliexpress/search?q=perro&size=1')
      setTestResult(res.ok ? 'ok' : 'error')
    } catch {
      setTestResult('error')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-orange/15 flex items-center justify-center text-xl">🛍️</div>
        <div>
          <p className="text-white font-bold text-sm">AliExpress DS API</p>
          <p className="text-zinc-500 text-xs">Dropshipping API — AppKey 533884</p>
        </div>
      </div>

      <div className="space-y-2.5 mb-4">
        <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2">
          <span className="text-zinc-500 text-xs w-24 shrink-0">App Key</span>
          <code className="text-zinc-300 text-xs font-mono flex-1">
            {process.env.NEXT_PUBLIC_ALIEXPRESS_APP_KEY ?? '533884'}
          </code>
        </div>
        <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2">
          <span className="text-zinc-500 text-xs w-24 shrink-0">App Secret</span>
          <code className="text-zinc-300 text-xs font-mono flex-1">
            {showSecret ? 'ALIEXPRESS_APP_SECRET (ver .env.local)' : '••••••••••••••••••••'}
          </code>
          <button onClick={() => setShowSecret((v) => !v)} className="text-zinc-500 hover:text-zinc-300">
            {showSecret ? <EyeOff size={13} /> : <Eye size={13} />}
          </button>
        </div>
        <div className="flex items-center gap-2 bg-zinc-800 rounded-xl px-3 py-2">
          <span className="text-zinc-500 text-xs w-24 shrink-0">Endpoint</span>
          <code className="text-zinc-500 text-xs font-mono">api-sg.aliexpress.com/sync</code>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={testAE}
          disabled={testing}
          className="flex items-center gap-2 text-xs font-bold px-3 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-colors disabled:opacity-50"
        >
          {testing ? <RefreshCw size={12} className="animate-spin" /> : <Wifi size={12} />}
          Probar conexión
        </button>
        {testResult === 'ok' && <span className="text-green-400 text-xs flex items-center gap-1"><Check size={12} /> Conectado</span>}
        {testResult === 'error' && <span className="text-red-400 text-xs flex items-center gap-1"><X size={12} /> Error de conexión</span>}
      </div>
    </div>
  )
}

// ─── Store settings ───────────────────────────────────────────────────────────

function StoreSettingsCard() {
  const [freeShipping, setFreeShipping] = useState('40')
  const [defaultMargin, setDefaultMargin] = useState('200')
  const [storeEmail, setStoreEmail] = useState('hola@zarpitas.es')
  const [saved, setSaved] = useState(false)

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
          <Settings size={18} className="text-zinc-400" />
        </div>
        <div>
          <p className="text-white font-bold text-sm">Configuración de tienda</p>
          <p className="text-zinc-500 text-xs">Parámetros globales de la tienda</p>
        </div>
      </div>
      <form onSubmit={handleSave} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">
              Envío gratis desde (€)
            </label>
            <input
              type="number"
              value={freeShipping}
              onChange={(e) => setFreeShipping(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange/50"
            />
          </div>
          <div>
            <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">
              Margen por defecto (%)
            </label>
            <input
              type="number"
              value={defaultMargin}
              onChange={(e) => setDefaultMargin(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange/50"
            />
          </div>
        </div>
        <div>
          <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">
            Email de la tienda
          </label>
          <input
            type="email"
            value={storeEmail}
            onChange={(e) => setStoreEmail(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange/50"
          />
        </div>
        <div className="flex items-center gap-2 p-3 bg-zinc-800 rounded-xl text-xs text-zinc-500">
          <AlertCircle size={12} />
          Los cambios de configuración se guardan localmente. Para persistirlos, añade las variables a tu .env.local.
        </div>
        <button
          type="submit"
          className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 bg-orange hover:bg-orange-dark text-white rounded-xl transition-colors"
        >
          {saved ? <><Check size={12} /> Guardado</> : 'Guardar configuración'}
        </button>
      </form>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConfiguracionPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-white text-2xl font-bold">Configuración</h1>
        <p className="text-zinc-500 text-sm mt-1">Estado de las conexiones y ajustes de la tienda</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <StoreSettingsCard />
        <AliExpressCard />
        <ConnectionCard
          label="Stripe"
          description="Procesador de pagos"
          envKey="STRIPE_SECRET_KEY / NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
          testUrl="/api/admin/health?service=stripe"
          icon="💳"
        />
        <ConnectionCard
          label="Supabase"
          description="Base de datos y autenticación"
          envKey="NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY"
          testUrl="/api/admin/health?service=supabase"
          icon="🗄️"
        />
      </div>
    </div>
  )
}
