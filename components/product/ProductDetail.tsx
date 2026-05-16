'use client'
import { useState, useMemo } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingCart, Check, Truck, RotateCcw, Shield, Minus, Plus, ChevronLeft, ChevronRight, Zap } from 'lucide-react'
import type { Product, ProductVariant } from '@/types'
import Badge from '@/components/ui/Badge'
import StarRating from '@/components/ui/StarRating'
import Button from '@/components/ui/Button'
import { useCartStore } from '@/lib/store/cartStore'
import { useUIStore } from '@/lib/store/uiStore'

interface ProductDetailProps {
  product: Product
  variants?: ProductVariant[]
}

export default function ProductDetail({ product, variants = [] }: ProductDetailProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [variantImageOverride, setVariantImageOverride] = useState<string | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)

  const addItem = useCartStore((state) => state.addItem)
  const openCart = useUIStore((state) => state.openCart)
  const router = useRouter()

  const images = (product.images?.length ? product.images : product.image ? [product.image] : []) as string[]
  const hasImages = images.length > 0
  const displayImage = variantImageOverride ?? images[selectedImage]

  // ── Variant selection ──────────────────────────────────────────────────────

  // Detect if variants use AliExpress-style property groups (Color, Talla, etc.)
  const hasPropertyGroups = variants.some((v) => (v.properties?.length ?? 0) > 0)

  // Build property groups: { Color: ['Rojo', 'Azul'], Talla: ['S', 'M'] }
  // Also collect images per property value
  const { propertyGroups, propertyImages } = useMemo(() => {
    if (!hasPropertyGroups) return { propertyGroups: [], propertyImages: {} }
    const sorted = [...variants].sort((a, b) => a.priceModifier - b.priceModifier)
    const groups: Record<string, string[]> = {}
    const images: Record<string, string> = {} // "PropName:value" → image url
    for (const v of sorted) {
      for (const p of v.properties ?? []) {
        if (!groups[p.name]) groups[p.name] = []
        if (!groups[p.name].includes(p.value)) groups[p.name].push(p.value)
        if (p.image && !images[`${p.name}:${p.value}`]) {
          images[`${p.name}:${p.value}`] = p.image
        }
      }
    }
    return {
      propertyGroups: Object.entries(groups).map(([name, values]) => ({ name, values })),
      propertyImages: images,
    }
  }, [variants, hasPropertyGroups])

  // Selected value per property group
  const [selectedProps, setSelectedProps] = useState<Record<string, string>>(() =>
    Object.fromEntries(propertyGroups.map((g) => [g.name, g.values[0] ?? '']))
  )

  // Flat variant selection (manual/admin-created variants without properties)
  const [flatVariantId, setFlatVariantId] = useState<string | null>(
    !hasPropertyGroups && variants.length > 0 ? variants[0].id : null
  )

  // Derived selected variant
  const selectedVariant = useMemo<ProductVariant | null>(() => {
    if (hasPropertyGroups) {
      const entries = Object.entries(selectedProps)
      return (
        variants.find((v) =>
          entries.every(([name, val]) =>
            v.properties?.some((p) => p.name === name && p.value === val)
          )
        ) ?? null
      )
    }
    return variants.find((v) => v.id === flatVariantId) ?? null
  }, [hasPropertyGroups, selectedProps, flatVariantId, variants])

  // Check if a specific option value is available given current selections
  function isOptionAvailable(propName: string, propValue: string): boolean {
    return variants.some((v) => {
      if ((v.stock ?? 0) === 0) return false
      if (!v.properties?.some((p) => p.name === propName && p.value === propValue)) return false
      for (const [otherName, otherValue] of Object.entries(selectedProps)) {
        if (otherName === propName) continue
        if (!v.properties?.some((p) => p.name === otherName && p.value === otherValue)) return false
      }
      return true
    })
  }

  // ── Prices & stock ─────────────────────────────────────────────────────────

  const effectivePrice = product.price + (selectedVariant?.priceModifier ?? 0)
  const outOfStock = selectedVariant
    ? selectedVariant.stock === 0
    : variants.length === 0
    ? (product.stock ?? 1) === 0
    : true // property variant selected but no exact match yet

  const discount = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : null

  // ── Cart actions ───────────────────────────────────────────────────────────

  const handleAddToCart = () => {
    if (outOfStock || !selectedVariant && hasPropertyGroups) return
    addItem(product, quantity, selectedVariant ?? undefined)
    setAdded(true)
    openCart()
    setTimeout(() => setAdded(false), 2200)
  }

  const handleBuyNow = () => {
    if (outOfStock) return
    addItem(product, quantity, selectedVariant ?? undefined)
    router.push('/checkout')
  }

  return (
    <div className="grid lg:grid-cols-2 gap-10 lg:gap-16">
      {/* Image gallery */}
      <div className="flex flex-col gap-4">
        <div className="relative aspect-square rounded-4xl overflow-hidden bg-cream-warm border-2 border-cream-deep">
          <AnimatePresence mode="wait">
            <motion.div
              key={displayImage}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.28 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              {displayImage ? (
                <Image
                  src={displayImage}
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

        {images.length > 1 && (
          <div className="flex gap-3 flex-wrap">
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
        <div className="flex items-baseline gap-3 mb-5 pb-5 border-b-2 border-cream-deep">
          <span className="font-display font-black text-5xl text-orange">
            {effectivePrice.toFixed(2).replace('.', ',')}€
          </span>
          {product.originalPrice && (
            <span className="text-xl text-text-muted line-through">
              {product.originalPrice.toFixed(2).replace('.', ',')}€
            </span>
          )}
        </div>

        {/* Variant selector — property groups (AliExpress style) */}
        {hasPropertyGroups && propertyGroups.map((group) => {
          const hasImages = group.values.some((v) => propertyImages[`${group.name}:${v}`])
          return (
            <div key={group.name} className="mb-4">
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                {group.name}:{' '}
                <span className="text-orange normal-case font-semibold">
                  {selectedProps[group.name] ?? '—'}
                </span>
              </p>
              <div className="flex flex-wrap gap-2">
                {group.values.map((val) => {
                  const available = isOptionAvailable(group.name, val)
                  const active = selectedProps[group.name] === val
                  const img = propertyImages[`${group.name}:${val}`]
                  return (
                    <button
                      key={val}
                      onClick={() => {
                        if (!available) return
                        setSelectedProps((prev) => ({ ...prev, [group.name]: val }))
                        if (img) setVariantImageOverride(img)
                        else setVariantImageOverride(null)
                      }}
                      title={val}
                      className={`transition-all duration-200 ${
                        hasImages && img
                          ? `w-12 h-12 rounded-xl overflow-hidden border-3 ${
                              active ? 'border-orange ring-2 ring-orange/30 scale-110' :
                              !available ? 'opacity-40 cursor-not-allowed grayscale' :
                              'border-cream-deep hover:border-orange/50'
                            }`
                          : `px-4 py-2 rounded-full text-sm font-bold border-2 ${
                              active ? 'border-orange bg-orange text-white' :
                              !available ? 'border-cream-deep bg-cream-warm text-text-muted line-through cursor-not-allowed opacity-50' :
                              'border-cream-deep bg-white text-text-primary hover:border-orange/50'
                            }`
                      }`}
                    >
                      {hasImages && img ? (
                        <Image src={img} alt={val} width={48} height={48} className="object-cover w-full h-full" />
                      ) : (
                        val
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}

        {/* Variant selector — flat (manual admin variants) */}
        {!hasPropertyGroups && variants.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Variante: <span className="text-orange">{selectedVariant?.name}</span>
            </p>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setFlatVariantId(v.id)}
                  disabled={v.stock === 0}
                  className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all duration-200 ${
                    flatVariantId === v.id
                      ? 'border-orange bg-orange text-white'
                      : v.stock === 0
                      ? 'border-cream-deep bg-cream-warm text-text-muted line-through cursor-not-allowed'
                      : 'border-cream-deep bg-white text-text-primary hover:border-orange/50'
                  }`}
                >
                  {v.name}
                  {v.priceModifier > 0 && ` +${v.priceModifier.toFixed(2).replace('.', ',')}€`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Stock warning */}
        {selectedVariant && selectedVariant.stock > 0 && selectedVariant.stock < 10 && (
          <p className="text-xs text-orange font-bold mb-3">⚡ Solo {selectedVariant.stock} en stock</p>
        )}

        {/* No match for selected combination */}
        {hasPropertyGroups && !selectedVariant && (
          <p className="text-xs text-text-muted mb-3">Selecciona todas las opciones para continuar</p>
        )}

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

          <Button
            onClick={handleAddToCart}
            fullWidth
            size="lg"
            className="gap-2"
            disabled={outOfStock || (hasPropertyGroups && !selectedVariant)}
          >
            {added ? (
              <><Check size={18} /> ¡Añadido!</>
            ) : outOfStock ? (
              <>Sin stock</>
            ) : (
              <><ShoppingCart size={18} /> Añadir al carrito</>
            )}
          </Button>
        </div>

        <Button
          onClick={handleBuyNow}
          variant="secondary"
          fullWidth
          size="lg"
          className="gap-2 mb-5"
          disabled={outOfStock || (hasPropertyGroups && !selectedVariant)}
        >
          <Zap size={18} />
          Comprar ahora
        </Button>

        {/* Trust */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { icon: Truck, text: 'Envío gratis\n+40€' },
            { icon: RotateCcw, text: 'Devolución\n30 días' },
            { icon: Shield, text: 'Pago\nseguro' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-cream-warm border-2 border-cream-deep text-center">
              <Icon size={16} className="text-green" />
              <span className="text-xs text-text-muted leading-tight whitespace-pre-line">{text}</span>
            </div>
          ))}
        </div>

        {variants.length === 0 && product.stock !== undefined && product.stock > 0 && product.stock < 20 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-sm font-bold text-orange">
            ⚡ ¡Solo quedan {product.stock} unidades!
          </motion.p>
        )}
      </div>
    </div>
  )
}
