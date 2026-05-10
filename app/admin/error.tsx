'use client'
import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Admin Error]', error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 p-8">
      <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center">
        <AlertTriangle size={28} className="text-red-400" />
      </div>
      <div className="text-center">
        <h2 className="text-white font-bold text-xl mb-2">Error en el panel de administración</h2>
        <p className="text-zinc-500 text-sm max-w-md">
          {error.message || 'Ocurrió un error inesperado. Comprueba la consola para más detalles.'}
        </p>
        {error.digest && (
          <p className="text-zinc-700 text-xs mt-2 font-mono">digest: {error.digest}</p>
        )}
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
      >
        <RefreshCw size={14} />
        Reintentar
      </button>
    </div>
  )
}
