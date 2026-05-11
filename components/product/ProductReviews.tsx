import { Star, ShieldCheck } from 'lucide-react'

interface Review {
  id: string
  rating: number
  title: string | null
  body: string | null
  reviewer_name: string | null
  created_at: string
}

interface Props {
  reviews: Review[]
  productRating: number
  reviewCount: number
}

function StarRow({ rating, size = 16 }: { rating: number; size?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.round(rating) ? 'text-orange fill-orange' : 'text-cream-deep fill-cream-deep'}
        />
      ))}
    </div>
  )
}

export default function ProductReviews({ reviews, productRating, reviewCount }: Props) {
  if (reviews.length === 0) return null

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length
    return { star, count, pct: (count / reviews.length) * 100 }
  })

  return (
    <section className="py-14 bg-cream border-t-2 border-cream-deep">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-display font-black text-2xl text-text-primary mb-8">
          ⭐ Reseñas de clientes
        </h2>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {/* Aggregate score */}
          <div className="flex flex-col items-center justify-center bg-white rounded-3xl border-2 border-cream-deep shadow-card p-8">
            <span className="font-display font-black text-6xl text-orange mb-2">
              {productRating.toFixed(1)}
            </span>
            <StarRow rating={productRating} size={20} />
            <span className="text-text-muted text-sm mt-2">
              {reviewCount} reseña{reviewCount !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Rating distribution */}
          <div className="md:col-span-2 bg-white rounded-3xl border-2 border-cream-deep shadow-card p-6 space-y-3">
            {distribution.map(({ star, count, pct }) => (
              <div key={star} className="flex items-center gap-3">
                <span className="text-sm text-text-secondary w-4 text-right">{star}</span>
                <Star size={12} className="text-orange fill-orange shrink-0" />
                <div className="flex-1 bg-cream-deep rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 bg-orange rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-text-muted w-4 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Individual reviews */}
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-3xl border-2 border-cream-deep shadow-card p-6">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center font-bold text-base text-orange shrink-0">
                    {review.reviewer_name ? review.reviewer_name.charAt(0).toUpperCase() : '🐾'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-sm text-text-primary">
                        {review.reviewer_name ?? 'Comprador verificado'}
                      </p>
                      <ShieldCheck size={12} className="text-green shrink-0" />
                    </div>
                    <p className="text-xs text-text-muted">
                      {new Date(review.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </p>
                  </div>
                </div>
                <StarRow rating={review.rating} size={14} />
              </div>

              {review.title && (
                <p className="font-bold text-text-primary text-sm mb-1">{review.title}</p>
              )}
              {review.body && (
                <p className="text-sm text-text-secondary leading-relaxed">{review.body}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
