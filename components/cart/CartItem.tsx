'use client'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Minus, Plus, Trash2 } from 'lucide-react'
import type { CartItem as CartItemType } from '@/types'
import { useCartStore } from '@/lib/store/cartStore'

export default function CartItem({ item }: { item: CartItemType }) {
  const removeItem = useCartStore((state) => state.removeItem)
  const updateQuantity = useCartStore((state) => state.updateQuantity)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.22 }}
      className="flex gap-3"
    >
      {/* Image */}
      <div className="relative w-[72px] h-[72px] rounded-2xl overflow-hidden flex-shrink-0 bg-cream-warm border-2 border-cream-deep">
        {item.image && <Image src={item.image} alt={item.name} fill sizes="72px" className="object-cover" />}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-text-muted font-bold uppercase tracking-wider mb-0.5">{item.subcategory}</p>
        <p className="text-sm font-bold text-text-primary leading-tight line-clamp-2 mb-0.5">{item.name}</p>
        {item.variantName && (
          <p className="text-[10px] text-orange font-bold mb-1.5">{item.variantName}</p>
        )}

        <div className="flex items-center justify-between gap-2">
          {/* Qty */}
          <div className="flex items-center gap-1 bg-cream-warm border-2 border-cream-deep rounded-full px-1.5 py-1">
            <button
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-cream-deep text-text-muted hover:text-text-primary transition-all"
            >
              <Minus size={9} />
            </button>
            <span className="w-5 text-center text-xs font-black text-text-primary">{item.quantity}</span>
            <button
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
              className="w-5 h-5 flex items-center justify-center rounded-full hover:bg-cream-deep text-text-muted hover:text-text-primary transition-all"
            >
              <Plus size={9} />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-display font-black text-sm text-orange">
              {(item.price * item.quantity).toFixed(2).replace('.', ',')}€
            </span>
            <button
              onClick={() => removeItem(item.id)}
              className="p-1.5 rounded-xl text-text-muted hover:text-error hover:bg-red-50 transition-all"
              aria-label="Eliminar"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
