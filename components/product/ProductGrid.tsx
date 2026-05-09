'use client'
import { motion } from 'framer-motion'
import type { Product } from '@/types'
import ProductCard from './ProductCard'
import { PackageSearch } from 'lucide-react'

interface ProductGridProps {
  products: Product[]
  loading?: boolean
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
}

function SkeletonCard() {
  return (
    <div className="bg-white rounded-3xl border-2 border-cream-deep overflow-hidden">
      <div className="aspect-square skeleton rounded-t-2xl" />
      <div className="p-4 space-y-2.5">
        <div className="h-2.5 skeleton rounded-full w-1/3" />
        <div className="h-3.5 skeleton rounded-full w-3/4" />
        <div className="h-2.5 skeleton rounded-full w-1/2" />
        <div className="h-5 skeleton rounded-full w-1/3 mt-1" />
      </div>
    </div>
  )
}

export default function ProductGrid({ products, loading = false }: ProductGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5">
        {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="w-20 h-20 rounded-3xl bg-cream-warm border-2 border-cream-deep flex items-center justify-center mb-4">
          <PackageSearch size={32} className="text-text-muted" />
        </div>
        <h3 className="font-display font-black text-xl text-text-secondary mb-1">
          No encontramos productos
        </h3>
        <p className="text-text-muted text-sm">
          Prueba con otros filtros o categorías 🐾
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      key={products.length}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5"
    >
      {products.map((product) => (
        <motion.div key={product.id} variants={itemVariants}>
          <ProductCard product={product} />
        </motion.div>
      ))}
    </motion.div>
  )
}
