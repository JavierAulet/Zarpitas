'use client'
import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Check, Truck, RotateCcw, Shield, Minus, Plus, ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import type { Product } from '@/types'
import Badge from '@/components/ui/Badge'
import StarRating from '@/components/ui/StarRating'
import Button from '@/components/ui/Button'
import { useCartStore } from '@/lib/store/cartStore'
import { useUIStore } from '@/lib/store/uiStore'

interface ProductDetailProps {
  product: Product
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const addItem = useCartStore((state) => state.addItem)
  const openCart = useUIStore((state) => state.openCart)
  const router = useRouter()

  const images = (product.images?.length ? product.images : product.image ? [product.image] : []) as string[]
  const hasImages = images.length > 0

  const handleAddToCart = () => {
    addItem(product, quantity)
    setAdded(true)
    openCart()
    setTimeout(() => setAdded(false), 2200)
  }

  const handleBuyNow = () => {
    addItem(product, quantity)
    router.push('/checkout')
  }

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  return (
    <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
      {/* Image gallery */}
      <div className="flex flex-col gap-4">
        {/* Main image */}
        <div className="relative aspect-square rounded-4xl overflow-hidden bg-cream-warm border-2 border-cream-deep">
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedImage}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.28 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              {hasImages ? (
                <Image
                  src={images[selectedImage]}
                  alt={product.name}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <span className="text-8xl opacity-20">{product.category === 'gatos' ? '🐱' : '🐶'}</span>
              )}
            </motion.div>
          </AnimatePresence>

          {images.length > 1 && (
            <>
              <button
                onClick={() => setSelectedImage((i) => (i - 1 + images.length) % images.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-sm shadow-warm flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setSelectedImage((i) => (i + 1) % images.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-2xl bg-white/90 backdrop-blur-sm shadow-warm flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-3">
            {images.map((img, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`relative w-20 h-20 rounded-2xl overflow-hidden border-2 transition-all ${
                  selectedImage === i ? 'border-orange shadow-orange/30 shadow-md' : 'border-cream-deep hover:border-sand'
                }`}
              >
                <Image src={img} alt="" fill sizes="80px" className="object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="flex flex-col">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap mb-4">
          {product.badge && <Badge variant={product.badge} />}
          {discount && <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-100">-{discount}% dto.</span>}
          <span className="text-xs text-text-muted capitalize font-medium">
            {product.category} · {product.subcategory}
          </span>
        </div>

        {/* Name */}
        <h1
          className="font-display font-black text-text-primary mb-4 leading-tight"
          style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.8rem)' }}
        >
          {product.name}
        </h1>

        {/* Rating */}
        <div className="mb-5">
          <StarRating rating={product.rating} reviews={product.reviews} size={16} />
        </div>

        {/* Price */}
        <div className="flex items-baseline gap-3 mb-6 pb-6 border-b-2 border-cream-deep">
          <span className="font-display font-black text-5xl text-orange">
            {product.price.toFixed(2).replace('.', ',')}€
          </span>
          {product.originalPrice && (
            <span className="text-xl text-text-muted line-through">
              {product.originalPrice.toFixed(2).replace('.', ',')}€
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-text-secondary leading-relaxed mb-5">{product.description}</p>

        {/* Features */}
        {product.features && product.features.length > 0 && (
          <ul className="space-y-2 mb-8">
            {product.features.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-text-secondary">
                <Check size={15} className="text-green flex-shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>
        )}

        {/* Quantity + Add to cart */}
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center gap-1 bg-cream-warm border-2 border-cream-deep rounded-full px-2 py-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-cream-deep"
            >
              <Minus size={14} />
            </button>
            <span className="w-8 text-center text-text-primary font-black font-display">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors rounded-full hover:bg-cream-deep"
            >
              <Plus size={14} />
            </button>
          </div>

          <Button onClick={handleAddToCart} fullWidth size="lg" className="gap-2">
            {added ? (
              <><Check size={18} /> ¡Añadido!</>
            ) : (
              <><ShoppingCart size={18} /> Añadir al carrito</>
            )}
          </Button>
        </div>

        <Button onClick={handleBuyNow} variant="secondary" fullWidth size="lg" className="gap-2 mb-5">
          <Zap size={18} />
          Comprar ahora
        </Button>

        {/* Trust */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Truck, text: 'Envío 24h\ngratis +40€' },
            { icon: RotateCcw, text: 'Devolución\n30 días' },
            { icon: Shield, text: 'Pago\nseguro' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-cream-warm border-2 border-cream-deep text-center">
              <Icon size={16} className="text-green" />
              <span className="text-xs text-text-muted leading-tight whitespace-pre-line">{text}</span>
            </div>
          ))}
        </div>

        {product.stock !== undefined && product.stock < 20 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm font-bold text-orange">
            ⚡ ¡Solo quedan {product.stock} unidades!
          </motion.p>
        )}
      </div>
    </div>
  )
}
