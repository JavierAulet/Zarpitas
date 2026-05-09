import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  reviews?: number
  size?: number
  showCount?: boolean
}

export default function StarRating({
  rating,
  reviews,
  size = 14,
  showCount = true,
}: StarRatingProps) {
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex items-center gap-0.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            size={size}
            className={i < Math.floor(rating) ? 'text-orange' : 'text-sand'}
            fill={i < Math.floor(rating) ? '#FF6B35' : '#D4C9B8'}
          />
        ))}
      </div>
      <span className="text-xs font-bold text-orange">{rating.toFixed(1)}</span>
      {showCount && reviews !== undefined && (
        <span className="text-xs text-text-muted">({reviews} reseñas)</span>
      )}
    </div>
  )
}
