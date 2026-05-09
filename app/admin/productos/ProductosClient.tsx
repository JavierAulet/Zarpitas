'use client'

import { useState, useTransition, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search, X, Plus, RefreshCw, Check, AlertCircle, ChevronDown,
  ExternalLink, Package, TrendingUp, Import
} from 'lucide-react'
import { createProduct } from '@/lib/actions/products'
import ToggleActive from '@/components/admin/ToggleActive'
import DeleteProduct from '@/components/admin/DeleteProduct'
import type { ProductRow } from '@/lib/supabase/types'
import type { AliExpressProductSummary, AliExpressProduct } from '@/lib/aliexpress/client'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function slugify(str: string) {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
}

function margin(cost: number, sale: number) {
  if (!cost || !sale) return null
  return ((sale - cost) / cost) * 100
}

const BADGE_LABELS: Record<string, string> = {
  nuevo: 'Nuevo',
  oferta: 'Oferta',
  'mas-vendido': 'Más vendido',
}

const STATUS_COLORS: Record<string, string> = {
  nuevo: 'bg-blue-500/15 text-blue-400',
  oferta: 'bg-red-500/15 text-red-400',
  'mas-vendido': 'bg-orange/15 text-orange',
}

// ─── Import Modal ─────────────────────────────────────────────────────────────

interface ImportModalProps {
  summary: AliExpressProductSummary
  onClose: () => void
  onSaved: () => void
}

function ImportModal({ summary, onClose, onSaved }: ImportModalProps) {
  const [full, setFull] = useState<AliExpressProduct | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState(summary.product_title)
  const [description, setDescription] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [category, setCategory] = useState<'perros' | 'gatos'>('perros')
  const [subcategory, setSubcategory] = useState('')
  const [badge, setBadge] = useState<'nuevo' | 'oferta' | 'mas-vendido' | ''>('')
  const [selectedImages, setSelectedImages] = useState<string[]>([])

  const costPrice = summary.sale_price
  const salePriceNum = parseFloat(salePrice) || 0
  const marginPct = salePriceNum > 0 ? margin(costPrice, salePriceNum) : null
  const profit = salePriceNum > 0 ? salePriceNum - costPrice : null

  useState(() => {
    fetch(`/api/aliexpress/product?id=${summary.product_id}`)
      .then((r) => r.json())
      .then((data) => {
        setFull(data)
        setDescription(data.description ?? '')
        setSelectedImages(data.images?.slice(0, 3) ?? [summary.product_main_image_url])
        setLoading(false)
      })
      .catch(() => {
        setSelectedImages([summary.product_main_image_url])
        setLoading(false)
        setError('No se pudo cargar el producto completo. Puedes continuar con los datos básicos.')
      })
  })

  function toggleImage(url: string) {
    setSelectedImages((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    )
  }

  async function handleSave() {
    if (!name || !salePrice || !category) return
    setSaving(true)
    try {
      const id = slugify(name)
      await createProduct({
        id,
        name,
        price: salePriceNum,
        cost_price: costPrice,
        original_price: null,
        image: selectedImages[0] ?? null,
        images: selectedImages,
        description,
        category,
        subcategory: subcategory || null,
        badge: badge || null,
        aliexpress_id: summary.product_id,
        stock: full?.stock ?? 99,
        active: false,
      })
      onSaved()
    } catch (e) {
      setError(String(e))
      setSaving(false)
    }
  }

  const allImages = full?.images ?? [summary.product_main_image_url]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-white font-bold text-lg">Importar producto de AliExpress</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="mb-4 flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-yellow-400 text-xs">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Left: Image selector */}
            <div>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">
                Imágenes ({selectedImages.length} seleccionadas)
              </p>
              {loading ? (
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="aspect-square rounded-xl bg-zinc-800 animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2 max-h-80 overflow-y-auto">
                  {allImages.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => toggleImage(url)}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-colors ${
                        selectedImages.includes(url)
                          ? 'border-orange'
                          : 'border-zinc-700 hover:border-zinc-500'
                      }`}
                    >
                      <Image src={url} alt="" fill sizes="120px" className="object-cover" />
                      {selectedImages.includes(url) && (
                        <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-orange rounded-full flex items-center justify-center">
                          <Check size={11} className="text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {/* Margin calculator */}
              <div className="mt-5 p-4 bg-zinc-800 rounded-2xl">
                <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">Calculadora de margen</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Precio AliExpress (coste)</span>
                    <span className="text-white font-mono">{costPrice.toFixed(2)}€</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Tu precio de venta</span>
                    <span className="text-white font-mono">{salePriceNum > 0 ? `${salePriceNum.toFixed(2)}€` : '—'}</span>
                  </div>
                  <div className="border-t border-zinc-700 pt-2 flex justify-between">
                    <span className="text-zinc-400">Ganancia por unidad</span>
                    <span className={`font-bold font-mono ${profit && profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {profit != null ? `${profit > 0 ? '+' : ''}${profit.toFixed(2)}€` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Margen</span>
                    <span className={`font-bold ${marginPct != null && marginPct > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {marginPct != null ? `${marginPct.toFixed(0)}%` : '—'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                  Nombre en español
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange/50"
                />
                <p className="text-zinc-600 text-xs mt-1">ID: {slugify(name)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                    Precio de venta (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="49.99"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange/50"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                    Categoría
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as 'perros' | 'gatos')}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange/50"
                  >
                    <option value="perros">Perros</option>
                    <option value="gatos">Gatos</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                    Subcategoría
                  </label>
                  <input
                    value={subcategory}
                    onChange={(e) => setSubcategory(e.target.value)}
                    placeholder="collares, camas..."
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange/50"
                  />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                    Badge
                  </label>
                  <select
                    value={badge}
                    onChange={(e) => setBadge(e.target.value as typeof badge)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange/50"
                  >
                    <option value="">Sin badge</option>
                    <option value="nuevo">Nuevo</option>
                    <option value="oferta">Oferta</option>
                    <option value="mas-vendido">Más vendido</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                  Descripción
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={5}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange/50 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 p-3 bg-zinc-800 rounded-xl text-xs text-zinc-400">
                <ExternalLink size={12} />
                AliExpress ID: <span className="font-mono text-zinc-300">{summary.product_id}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between gap-3">
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-sm transition-colors">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!name || !salePrice || saving}
            className="flex items-center gap-2 bg-orange hover:bg-orange-dark text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? 'Guardando...' : 'Guardar en tienda'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

interface Props {
  initialProducts: ProductRow[]
}

export default function ProductosClient({ initialProducts }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  // AliExpress search
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<AliExpressProductSummary[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState<string | null>(null)

  // Import modal
  const [importSummary, setImportSummary] = useState<AliExpressProductSummary | null>(null)

  // Table filters
  const [filterCategory, setFilterCategory] = useState<'all' | 'perros' | 'gatos'>('all')
  const [filterActive, setFilterActive] = useState<'all' | 'true' | 'false'>('all')
  const [filterSearch, setFilterSearch] = useState('')

  // Sync state
  const [syncing, setSyncing] = useState<Set<string>>(new Set())
  const [syncResult, setSyncResult] = useState<Record<string, 'ok' | 'error'>>({})
  const [bulkSyncing, setBulkSyncing] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setSearching(true)
    setSearchError(null)
    try {
      const res = await fetch(`/api/aliexpress/search?q=${encodeURIComponent(searchQuery)}&size=16`)
      const data = await res.json()
      setSearchResults(data.products ?? [])
    } catch {
      setSearchError('Error al buscar en AliExpress. Verifica tus credenciales de API.')
    } finally {
      setSearching(false)
    }
  }

  async function syncProduct(productId: string, aliexpressId: string) {
    setSyncing((prev) => new Set(prev).add(productId))
    try {
      const res = await fetch('/api/admin/sync-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, aliexpress_id: aliexpressId }),
      })
      setSyncResult((prev) => ({ ...prev, [productId]: res.ok ? 'ok' : 'error' }))
      if (res.ok) startTransition(() => router.refresh())
    } catch {
      setSyncResult((prev) => ({ ...prev, [productId]: 'error' }))
    } finally {
      setSyncing((prev) => { const s = new Set(prev); s.delete(productId); return s })
    }
  }

  async function handleBulkSync() {
    const withAE = initialProducts.filter((p) => p.aliexpress_id)
    if (!withAE.length) return
    setBulkSyncing(true)
    await Promise.all(withAE.map((p) => syncProduct(p.id, p.aliexpress_id!)))
    setBulkSyncing(false)
  }

  const filtered = initialProducts.filter((p) => {
    if (filterCategory !== 'all' && p.category !== filterCategory) return false
    if (filterActive === 'true' && !p.active) return false
    if (filterActive === 'false' && p.active) return false
    if (filterSearch && !p.name.toLowerCase().includes(filterSearch.toLowerCase())) return false
    return true
  })

  const withAECount = initialProducts.filter((p) => p.aliexpress_id).length

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Productos</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {initialProducts.length} productos · {withAECount} vinculados a AliExpress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleBulkSync}
            disabled={bulkSyncing || withAECount === 0}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={bulkSyncing ? 'animate-spin' : ''} />
            Sincronizar todo
          </button>
          <Link
            href="/admin/productos/nuevo"
            className="flex items-center gap-2 bg-orange hover:bg-orange-dark text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Plus size={16} />
            Nuevo producto
          </Link>
        </div>
      </div>

      {/* ── AliExpress Import Section ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-orange/15 flex items-center justify-center">
            <Import size={13} className="text-orange" />
          </div>
          <p className="text-white font-bold text-sm">Importar desde AliExpress</p>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar producto en AliExpress... (ej: collar gps perro)"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange/50"
            />
          </div>
          <button
            type="submit"
            disabled={searching || !searchQuery.trim()}
            className="flex items-center gap-2 bg-orange hover:bg-orange-dark text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            {searching ? <RefreshCw size={14} className="animate-spin" /> : <Search size={14} />}
            Buscar
          </button>
          {searchResults && (
            <button
              type="button"
              onClick={() => { setSearchResults(null); setSearchQuery('') }}
              className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </form>

        {searchError && (
          <div className="flex items-center gap-2 text-yellow-400 text-xs bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mb-3">
            <AlertCircle size={13} />
            {searchError}
          </div>
        )}

        {searching && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[1,2,3,4,5,6,7,8].map((i) => (
              <div key={i} className="bg-zinc-800 rounded-xl p-3 animate-pulse">
                <div className="aspect-square rounded-lg bg-zinc-700 mb-3" />
                <div className="h-3 bg-zinc-700 rounded w-3/4 mb-2" />
                <div className="h-3 bg-zinc-700 rounded w-1/3" />
              </div>
            ))}
          </div>
        )}

        {searchResults && !searching && (
          <>
            <p className="text-zinc-500 text-xs mb-3">{searchResults.length} resultados para «{searchQuery}»</p>
            {searchResults.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-8">No se encontraron productos</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {searchResults.map((p) => (
                  <div key={p.product_id} className="bg-zinc-800 border border-zinc-700 rounded-xl overflow-hidden group">
                    <div className="relative aspect-square">
                      <Image
                        src={p.product_main_image_url}
                        alt={p.product_title}
                        fill
                        sizes="200px"
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <div className="p-3">
                      <p className="text-white text-xs font-medium line-clamp-2 mb-2 leading-snug">
                        {p.product_title}
                      </p>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-orange font-bold text-sm font-mono">
                          {p.sale_price.toFixed(2)}€
                        </span>
                        {p.lastest_volume > 0 && (
                          <span className="text-zinc-500 text-xs">{p.lastest_volume} ventas</span>
                        )}
                      </div>
                      <button
                        onClick={() => setImportSummary(p)}
                        className="w-full text-xs font-bold py-2 bg-orange hover:bg-orange-dark text-white rounded-lg transition-colors"
                      >
                        Importar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {!searchResults && !searching && (
          <p className="text-zinc-600 text-xs text-center py-4">
            Busca un producto para importarlo directamente a tu tienda con un clic
          </p>
        )}
      </div>

      {/* ── Product Table ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {/* Table filters */}
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-zinc-800">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Filtrar por nombre..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-4 py-2 text-white text-xs focus:outline-none focus:border-orange/40"
            />
          </div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value as typeof filterCategory)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-300 text-xs focus:outline-none"
          >
            <option value="all">Todas las categorías</option>
            <option value="perros">Perros</option>
            <option value="gatos">Gatos</option>
          </select>
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value as typeof filterActive)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-300 text-xs focus:outline-none"
          >
            <option value="all">Todos</option>
            <option value="true">Activos</option>
            <option value="false">Inactivos</option>
          </select>
          <p className="text-zinc-600 text-xs ml-auto">{filtered.length} productos</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                {['Producto', 'AliExpress ID', 'Coste', 'Precio venta', 'Margen', 'Stock', 'Categoría', 'Badge', 'Activo', ''].map((h) => (
                  <th key={h} className="text-left text-zinc-500 text-xs font-bold uppercase tracking-wider px-5 py-3.5 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map((product) => {
                const m = product.cost_price ? margin(product.cost_price, product.price) : null
                const isSyncing = syncing.has(product.id)
                const syncStatus = syncResult[product.id]

                return (
                  <tr key={product.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
                          {product.image && (
                            <Image src={product.image} alt={product.name} fill sizes="40px" className="object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium line-clamp-1 max-w-[160px]">{product.name}</p>
                          <p className="text-zinc-600 text-xs font-mono">{product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {product.aliexpress_id ? (
                        <span className="text-xs font-mono text-zinc-400">{product.aliexpress_id}</span>
                      ) : (
                        <span className="text-zinc-700 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-zinc-400 text-sm font-mono">
                        {product.cost_price ? `${product.cost_price.toFixed(2)}€` : '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-white text-sm font-bold font-mono">{product.price.toFixed(2)}€</span>
                    </td>
                    <td className="px-5 py-4">
                      {m != null ? (
                        <span className={`text-sm font-bold ${m >= 100 ? 'text-green-400' : m >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {m.toFixed(0)}%
                        </span>
                      ) : (
                        <span className="text-zinc-700 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-medium ${product.stock < 10 ? 'text-red-400' : 'text-zinc-300'}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-zinc-400 text-sm capitalize">{product.category}</span>
                    </td>
                    <td className="px-5 py-4">
                      {product.badge ? (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLORS[product.badge] ?? 'bg-zinc-700 text-zinc-300'}`}>
                          {BADGE_LABELS[product.badge]}
                        </span>
                      ) : (
                        <span className="text-zinc-700 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <ToggleActive id={product.id} active={product.active} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {product.aliexpress_id && (
                          <button
                            onClick={() => syncProduct(product.id, product.aliexpress_id!)}
                            disabled={isSyncing}
                            title="Sincronizar stock y precio desde AliExpress"
                            className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                              syncStatus === 'ok'
                                ? 'bg-green-500/15 text-green-400'
                                : syncStatus === 'error'
                                ? 'bg-red-500/15 text-red-400'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {isSyncing ? (
                              <RefreshCw size={13} className="animate-spin" />
                            ) : syncStatus === 'ok' ? (
                              <Check size={13} />
                            ) : (
                              <RefreshCw size={13} />
                            )}
                          </button>
                        )}
                        <Link
                          href={`/admin/productos/${product.id}`}
                          className="text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 rounded-lg transition-colors"
                        >
                          Editar
                        </Link>
                        <DeleteProduct id={product.id} />
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-16">
                    <Package size={32} className="text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm">No hay productos con esos filtros</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Import modal */}
      {importSummary && (
        <ImportModal
          summary={importSummary}
          onClose={() => setImportSummary(null)}
          onSaved={() => {
            setImportSummary(null)
            startTransition(() => router.refresh())
          }}
        />
      )}
    </div>
  )
}
