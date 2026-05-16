'use client'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ShoppingCart, Eye, ChevronRight } from 'lucide-react'
import type { Product } from '@/types'
import Badge from '@/components/ui/Badge'
import StarRating from '@/components/ui/StarRating'
import { useCartStore } from '@/lib/store/cartStore'
import { useUIStore } from '@/lib/store/uiStore'

const overlayVariants = {
  initial: { opacity: 0, y: '100%' },
  hover: { opacity: 1, y: '0%' },
}
const imageVariants = {
  initial: { scale: 1 },
  hover: { scale: 1.05 },
}

interface ProductCardProps {
  product: Product
  priority?: boolean
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const openCart = useUIStore((state) => state.openCart)
  const router = useRouter()

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (product.hasVariants) {
      router.push(`/productos/${product.id}`)
      return
    }
    addItem(product)
    openCart()
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  return (
    <motion.div
      initial="initial"
      whileHover="hover"
      transition={{ duration: 0.28, ease: 'easeOut' }}
      className="group bg-white rounded-3xl border-2 border-cream-deep hover:border-orange/30 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
    >
      <Link href={`/productos/${product.id}`} className="block">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-cream-warm rounded-t-2xl">
          <motion.div
            variants={imageVariants}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="relative w-full h-full"
          >
            {product.image ? (
              <Image
                src={product.image}
                alt={product.name}
                fill
                priority={priority}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-5xl opacity-30">
                {product.category === 'gatos' ? '🐱' : '🐶'}
              </div>
            )}
          </motion.div>

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
            {product.badge && <Badge variant={product.badge} />}
            {discount && discount > 0 && (
              <Badge variant="oferta">-{discount}%</Badge>
            )}
          </div>

          {/* Quick view */}
          <motion.div
            variants={{ initial: { opacity: 0, scale: 0.8 }, hover: { opacity: 1, scale: 1 } }}
            className="absolute top-3 right-3 z-10"
          >
            <div className="w-8 h-8 rounded-xl bg-white/90 backdrop-blur-sm shadow-warm flex items-center justify-center">
              <Eye size={13} className="text-text-secondary" />
            </div>
          </motion.div>

          {/* Add to cart — slides up */}
          <motion.div
            variants={overlayVariants}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="absolute bottom-0 left-0 right-0 p-3 z-10"
          >
            <button
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-orange text-white font-bold text-sm hover:bg-orange-dark transition-colors shadow-orange"
            >
              {product.hasVariants ? (
                <><ChevronRight size={14} /> Ver opciones</>
              ) : (
                <><ShoppingCart size={14} /> Añadir al carrito</>
              )}
            </button>
          </motion.div>

          {/* Warm gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">
            {product.subcategory}
          </p>
          <h3 className="font-display font-bold text-text-primary text-sm leading-snug mb-2 line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>

          <StarRating rating={product.rating} reviews={product.reviews} size={11} />

          {/* Price */}
          <div className="flex items-baseline gap-2 mt-2.5">
            <span className="font-display font-black text-lg text-orange">
              {product.price.toFixed(2).replace('.', ',')}€
            </span>
            {product.originalPrice && (
              <span className="text-xs text-text-muted line-through">
                {product.originalPrice.toFixed(2).replace('.', ',')}€
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
