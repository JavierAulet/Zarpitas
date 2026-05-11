'use client'
import { motion } from 'framer-motion'
import { SlidersHorizontal, ChevronDown } from 'lucide-react'
import type { FilterCategory, SortOption, PriceRange } from '@/types'
import { clsx } from 'clsx'

interface ProductFiltersProps {
  activeCategory: FilterCategory
  activeSort: SortOption
  activePriceRange: PriceRange
  onCategoryChange: (cat: FilterCategory) => void
  onSortChange: (sort: SortOption) => void
  onPriceRangeChange: (range: PriceRange) => void
  totalCount: number
}

const categories: { value: FilterCategory; label: string }[] = [
  { value: 'todos', label: '🐾 Todos' },
  { value: 'perros', label: '🐶 Perros' },
  { value: 'gatos', label: '🐱 Gatos' },
]

const priceRanges: { value: PriceRange; label: string }[] = [
  { value: 'todos', label: 'Cualquier precio' },
  { value: 'menos-30', label: 'Menos de 30€' },
  { value: '30-60', label: '30€ – 60€' },
  { value: 'mas-60', label: 'Más de 60€' },
]

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'relevancia', label: 'Más relevantes' },
  { value: 'precio-asc', label: 'Precio: menor primero' },
  { value: 'precio-desc', label: 'Precio: mayor primero' },
  { value: 'valoracion', label: 'Mejor valorados' },
]

export default function ProductFilters({
  activeCategory,
  activeSort,
  activePriceRange,
  onCategoryChange,
  onSortChange,
  onPriceRangeChange,
  totalCount,
}: ProductFiltersProps) {
  return (
    <div className="space-y-4 mb-8">
      {/* Row 1: Category + Sort */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <SlidersHorizontal size={15} className="text-text-muted shrink-0" />
          {categories.map((cat) => (
            <motion.button
              key={cat.value}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onCategoryChange(cat.value)}
              className={clsx(
                'px-4 py-2 rounded-full text-sm font-bold transition-all duration-200',
                activeCategory === cat.value
                  ? 'bg-orange text-white shadow-orange'
                  : 'bg-white border-2 border-cream-deep text-text-secondary hover:border-orange/40 hover:text-text-primary'
              )}
            >
              {cat.label}
            </motion.button>
          ))}
          <span className="text-text-muted text-sm ml-1 font-medium">
            ({totalCount} producto{totalCount !== 1 ? 's' : ''})
          </span>
        </div>

        <div className="relative">
          <select
            value={activeSort}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="appearance-none bg-white border-2 border-cream-deep text-text-secondary text-sm rounded-full px-4 py-2 pr-8 focus:outline-none focus:border-orange/40 cursor-pointer hover:border-orange/30 transition-colors font-medium"
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-muted" />
        </div>
      </div>

      {/* Row 2: Price range */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Precio:</span>
        {priceRanges.map((range) => (
          <button
            key={range.value}
            onClick={() => onPriceRangeChange(range.value)}
            className={clsx(
              'px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 border-2',
              activePriceRange === range.value
                ? 'bg-text-primary text-white border-text-primary'
                : 'bg-white border-cream-deep text-text-secondary hover:border-orange/40 hover:text-text-primary'
            )}
          >
            {range.label}
          </button>
        ))}
      </div>
    </div>
  )
}
