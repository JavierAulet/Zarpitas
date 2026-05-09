'use client'
import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4 px-4">
      <div className="text-5xl">😿</div>
      <h2 className="font-display font-black text-2xl text-text-primary">Algo salió mal</h2>
      <p className="text-text-muted text-sm">{error.message}</p>
      <button
        onClick={reset}
        className="bg-orange text-white font-bold px-6 py-2.5 rounded-2xl text-sm hover:bg-orange-dark transition-colors"
      >
        Intentar de nuevo
      </button>
    </div>
  )
}
