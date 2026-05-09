import { clsx } from 'clsx'

type BadgeVariant = 'nuevo' | 'oferta' | 'mas-vendido' | 'eco' | 'default'

interface BadgeProps {
  variant?: BadgeVariant
  children?: React.ReactNode
  className?: string
}

const labels: Record<BadgeVariant, string> = {
  nuevo: '✨ Nuevo',
  oferta: '🔥 Oferta',
  'mas-vendido': '⭐ Más vendido',
  eco: '🌿 Eco',
  default: '',
}

const styles: Record<BadgeVariant, string> = {
  nuevo: 'bg-orange-50 text-orange border border-orange/20',
  oferta: 'bg-red-50 text-red-600 border border-red-200',
  'mas-vendido': 'bg-green-50 text-green border border-green/20',
  eco: 'bg-green-50 text-green border border-green/20',
  default: 'bg-cream-warm text-text-secondary border border-sand',
}

export default function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold tracking-wide',
        styles[variant],
        className
      )}
    >
      {children ?? labels[variant]}
    </span>
  )
}
