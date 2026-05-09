'use client'

import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { ShoppingCart } from 'lucide-react'
import type { Product } from '@/types'
import { useCartStore } from '@/lib/store/cartStore'
import { useUIStore } from '@/lib/store/uiStore'
import Badge from '@/components/ui/Badge'
import StarRating from '@/components/ui/StarRating'

interface Props {
  products: Product[]
}

export default function RelatedProducts({ products }: Props) {
  const addItem = useCartStore((s) => s.addItem)
  const openCart = useUIStore((s) => s.openCart)

  if (products.length === 0) return null

  return (
    <section className="py-16 bg-cream-warm border-t-2 border-cream-deep">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="font-display font-black text-2xl text-text-primary mb-8"
        >
          También te puede gustar
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
            >
              <div className="bg-white rounded-3xl border-2 border-cream-deep hover:border-orange/30 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden group">
                <Link href={`/productos/${p.id}`} className="block">
                  <div className="relative aspect-square bg-cream-warm overflow-hidden">
                    {p.image ? (
                      <Image
                        src={p.image}
                        alt={p.name}
                        fill
                        sizes="(max-width: 768px) 50vw, 25vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">
                        {p.category === 'gatos' ? '🐱' : '🐶'}
                      </div>
                    )}
                    {p.badge && (
                      <div className="absolute top-2 left-2">
                        <Badge variant={p.badge} />
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-4">
                  <Link href={`/productos/${p.id}`}>
                    <p className="text-sm font-bold text-text-primary line-clamp-2 mb-1.5 hover:text-orange transition-colors">
                      {p.name}
                    </p>
                  </Link>
                  <StarRating rating={p.rating} reviews={p.reviews} size={12} />
                  <div className="flex items-center justify-between mt-3">
                    <span className="font-display font-black text-lg text-orange">
                      {p.price.toFixed(2).replace('.', ',')}€
                    </span>
                    <button
                      onClick={() => { addItem(p, 1); openCart() }}
                      className="w-9 h-9 rounded-xl bg-orange hover:bg-orange-dark text-white flex items-center justify-center transition-colors shadow-sm"
                    >
                      <ShoppingCart size={15} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
