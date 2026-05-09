'use client'
import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import type { Product, FilterCategory, SortOption } from '@/types'
import ProductGrid from '@/components/product/ProductGrid'
import ProductFilters from '@/components/product/ProductFilters'

export default function ProductsClient({ products }: { products: Product[] }) {
  const searchParams = useSearchParams()
  const [activeCategory, setActiveCategory] = useState<FilterCategory>('todos')
  const [activeSort, setActiveSort] = useState<SortOption>('relevancia')

  useEffect(() => {
    const cat = searchParams.get('categoria') as FilterCategory | null
    if (cat && ['todos', 'perros', 'gatos'].includes(cat)) {
      setActiveCategory(cat)
    }
  }, [searchParams])

  const filteredProducts = useMemo(() => {
    let result = [...products]
    if (activeCategory !== 'todos') {
      result = result.filter((p) => p.category === activeCategory)
    }
    switch (activeSort) {
      case 'precio-asc': result.sort((a, b) => a.price - b.price); break
      case 'precio-desc': result.sort((a, b) => b.price - a.price); break
      case 'valoracion': result.sort((a, b) => b.rating - a.rating); break
    }
    return result
  }, [activeCategory, activeSort, products])

  const catEmoji = activeCategory === 'perros' ? '🐶' : activeCategory === 'gatos' ? '🐱' : '🐾'

  return (
    <>
      {/* Hero banner */}
      <section className="pt-28 pb-10 bg-cream-warm border-b border-cream-deep">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-orange text-xs font-bold mb-3">
              {catEmoji} Catálogo
            </span>
            <h1
              className="font-display font-black text-text-primary mb-2"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              {activeCategory === 'perros'
                ? '🐶 Para tu Perro'
                : activeCategory === 'gatos'
                ? '🐱 Para tu Gato'
                : 'Todos los Productos'}
            </h1>
            <p className="text-text-secondary max-w-md">
              Seleccionados con amor por nuestro equipo de apasionados de las mascotas.
              Calidad garantizada, envío en 24h a toda España.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products */}
      <section className="py-10 md:py-14 bg-cream min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ProductFilters
            activeCategory={activeCategory}
            activeSort={activeSort}
            onCategoryChange={setActiveCategory}
            onSortChange={setActiveSort}
            totalCount={filteredProducts.length}
          />
          <ProductGrid products={filteredProducts} />
        </div>
      </section>
    </>
  )
}
