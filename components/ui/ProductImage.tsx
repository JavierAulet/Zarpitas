import Image from 'next/image'

const CATEGORY_EMOJI: Record<string, string> = {
  perros: '🐶',
  gatos: '🐱',
}

const CATEGORY_BG: Record<string, string> = {
  perros: 'bg-orange-50',
  gatos: 'bg-green-50',
}

interface Props {
  src?: string | null
  alt: string
  category?: string
  fill?: boolean
  sizes?: string
  className?: string
  priority?: boolean
}

export default function ProductImage({ src, alt, category = 'perros', fill, sizes, className = '', priority }: Props) {
  if (src) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        sizes={sizes}
        priority={priority}
        className={`object-cover ${className}`}
      />
    )
  }

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center gap-2 ${CATEGORY_BG[category] ?? 'bg-cream-warm'} ${className}`}>
      <span className="text-4xl opacity-40">{CATEGORY_EMOJI[category] ?? '🐾'}</span>
    </div>
  )
}
