import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-cream flex flex-col items-center justify-center gap-4 px-4">
      <div className="text-6xl">🐾</div>
      <h2 className="font-display font-black text-3xl text-text-primary">Página no encontrada</h2>
      <p className="text-text-muted">Esta página no existe o fue movida.</p>
      <Link
        href="/"
        className="bg-orange text-white font-bold px-6 py-2.5 rounded-2xl text-sm hover:bg-orange-dark transition-colors"
      >
        Volver al inicio
      </Link>
    </div>
  )
}
