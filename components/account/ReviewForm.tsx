'use client'
import { useState } from 'react'
import { Star, Loader2, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  productId: string
  orderId: string
  userId: string
}

export default function ReviewForm({ productId, orderId, userId }: Props) {
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) { setError('Selecciona una puntuación'); return }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const reviewer_name = user?.user_metadata?.full_name ?? null

    const { error } = await supabase.from('reviews').insert({
      product_id: productId,
      order_id: orderId,
      user_id: userId,
      rating,
      title: title || null,
      body: body || null,
      reviewer_name,
    })

    if (error) {
      setError('No se pudo guardar la reseña')
    } else {
      setDone(true)
    }
    setLoading(false)
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-green text-sm font-bold">
        <Check size={16} /> ¡Gracias por tu reseña! 🐾
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {/* Star rating */}
      <div className="flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setRating(i + 1)}
            onMouseEnter={() => setHover(i + 1)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-110"
          >
            <Star
              size={24}
              className={`transition-colors ${i < (hover || rating) ? 'text-orange fill-orange' : 'text-cream-deep'}`}
            />
          </button>
        ))}
        {rating > 0 && (
          <span className="text-xs text-text-muted ml-2 self-center">
            {['', 'Muy malo', 'Regular', 'Bueno', 'Muy bueno', '¡Excelente!'][rating]}
          </span>
        )}
      </div>

      <input
        className="w-full bg-cream-warm border-2 border-cream-deep rounded-xl px-3 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:border-orange/50 transition-colors"
        placeholder="Título (opcional)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={80}
      />

      <textarea
        className="w-full bg-cream-warm border-2 border-cream-deep rounded-xl px-3 py-2 text-sm placeholder:text-text-muted focus:outline-none focus:border-orange/50 transition-colors resize-none"
        placeholder="Cuéntanos tu experiencia (opcional)"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={500}
      />

      {error && <p className="text-red-500 text-xs">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="flex items-center gap-2 bg-orange hover:bg-orange-dark text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors disabled:opacity-60"
      >
        {loading && <Loader2 size={13} className="animate-spin" />}
        Publicar reseña
      </button>
    </form>
  )
}
