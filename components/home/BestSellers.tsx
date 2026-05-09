'use client'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, TrendingUp } from 'lucide-react'
import ProductCard from '@/components/product/ProductCard'
import type { Product } from '@/types'

export default function BestSellers({ products }: { products: Product[] }) {
  if (products.length === 0) return null

  return (
    <section className="py-20 md:py-28 bg-cream-warm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.6 }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12"
        >
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange text-xs font-bold mb-3">
              <TrendingUp size={11} /> Más populares
            </span>
            <h2
              className="font-display font-black text-text-primary"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
            >
              Los que repiten
              <br />
              <span className="text-orange-gradient">una y otra vez</span>
            </h2>
          </div>
          <Link
            href="/productos"
            className="group flex items-center gap-2 font-bold text-text-secondary hover:text-orange transition-colors text-sm shrink-0"
          >
            Ver catálogo completo
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
          </Link>
        </motion.div>

        {/* Mobile: horizontal scroll */}
        <div className="md:hidden -mx-4 px-4">
          <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory">
            {products.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: i * 0.08 }}
                className="flex-shrink-0 w-56 snap-start"
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Desktop: grid */}
        <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 gap-5">
          {products.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
