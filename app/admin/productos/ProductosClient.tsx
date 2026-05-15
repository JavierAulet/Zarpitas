'use client'

import { useState, useTransition, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search, X, Plus, RefreshCw, Check, AlertCircle, ExternalLink,
  Package, Link2, Layers, ChevronRight, BarChart2,
} from 'lucide-react'
import { createProduct } from '@/lib/actions/products'
import { createVariant } from '@/lib/actions/variants'
import ToggleActive from '@/components/admin/ToggleActive'
import DeleteProduct from '@/components/admin/DeleteProduct'
import type { ProductRow } from '@/lib/supabase/types'

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

function extractAliExpressId(input: string): string | null {
  const trimmed = input.trim()
  if (/^\d{10,}$/.test(trimmed)) return trimmed
  const fromItem = trimmed.match(/\/item\/(\d+)\.html/)
  if (fromItem) return fromItem[1]
  const fromId = trimmed.match(/[?&]id=(\d+)/)
  if (fromId) return fromId[1]
  const fromPath = trimmed.match(/(\d{10,})/)
  if (fromPath) return fromPath[1]
  return null
}

function calcMargin(cost: number, sale: number) {
  if (!cost || !sale) return null
  return ((sale - cost) / cost) * 100
}

const BADGE_LABELS: Record<string, string> = {
  nuevo: 'Nuevo', oferta: 'Oferta', 'mas-vendido': 'Más vendido',
}
const STATUS_COLORS: Record<string, string> = {
  nuevo: 'bg-blue-500/15 text-blue-400',
  oferta: 'bg-red-500/15 text-red-400',
  'mas-vendido': 'bg-orange/15 text-orange',
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface AliSku {
  sku_id: string
  price: number
  stock: number
  properties: Array<{ name: string; value: string }>
}

interface AliProduct {
  name: string
  images: string[]
  price: number  // EUR cost
  stock: number
  description: string
  variants?: Array<{ property: string; values: string[] }>
  skus?: AliSku[]
  error?: string
}

async function fetchAliProduct(id: string): Promise<AliProduct> {
  const res = await fetch(`/api/aliexpress/product?id=${id}&country=ES&language=es`)
  const data = await res.json()
  if (!res.ok || data.error) throw new Error(data.error ?? 'Error al obtener producto')
  return data as AliProduct
}

async function saveProduct(
  aliexpressId: string,
  product: AliProduct,
  overrides: {
    name: string
    salePrice: number
    category: 'perros' | 'gatos'
    selectedImages: string[]
    badge?: string
  }
) {
  const id = slugify(overrides.name)
  const images = overrides.selectedImages
  await createProduct({
    id,
    name: overrides.name,
    price: overrides.salePrice,
    cost_price: product.price || null,
    original_price: null,
    image: images[0] ?? null,
    images,
    description: product.description,
    features: [],
    category: overrides.category,
    subcategory: null,
    badge: (overrides.badge as 'nuevo' | 'oferta' | 'mas-vendido') || null,
    aliexpress_id: aliexpressId,
    stock: product.stock || 99,
    active: false,
    sku: null,
  })

  // Save AliExpress SKUs as selectable variants
  const skus = product.skus ?? []
  const skusWithProps = skus.filter((s) => s.properties.length > 0)
  if (skusWithProps.length > 0) {
    for (let i = 0; i < skusWithProps.length; i++) {
      const sku = skusWithProps[i]
      const label = sku.properties.map((p) => p.value).join(' / ')
      const skuSalePrice = sku.price > 0 ? sku.price * 2.5 : overrides.salePrice
      const priceModifier = parseFloat((skuSalePrice - overrides.salePrice).toFixed(2))
      await createVariant({
        product_id: id,
        name: label,
        sku: sku.sku_id,
        price_modifier: priceModifier,
        stock: sku.stock,
        active: true,
        sort_order: i,
        properties: sku.properties,
      })
    }
  }

  return id
}

// ─── Import Modal ─────────────────────────────────────────────────────────────

function ImportModal({ aliexpressId, onClose, onSaved }: {
  aliexpressId: string
  onClose: () => void
  onSaved: () => void
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [product, setProduct] = useState<AliProduct | null>(null)

  const [name, setName] = useState('')
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [costPrice, setCostPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [category, setCategory] = useState<'perros' | 'gatos'>('perros')
  const [badge, setBadge] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const costNum = parseFloat(costPrice) || 0
  const saleNum = parseFloat(salePrice) || 0
  const marginPct = calcMargin(costNum, saleNum)
  const profit = costNum > 0 && saleNum > 0 ? saleNum - costNum : null

  // Fetch on mount
  useState(() => {
    fetchAliProduct(aliexpressId)
      .then((data) => {
        setProduct(data)
        setName(data.name.slice(0, 80))
        setSelectedImages(data.images)
        if (data.price > 0) {
          setCostPrice(data.price.toFixed(2))
          setSalePrice((data.price * 2.5).toFixed(2))
        }
      })
      .catch((err) => setFetchError(err.message))
      .finally(() => setLoading(false))
  })

  function toggleImage(url: string) {
    setSelectedImages((prev) =>
      prev.includes(url) ? prev.filter((u) => u !== url) : [...prev, url]
    )
  }

  async function handleSave() {
    if (!name || !salePrice || !product) return
    setSaving(true)
    setSaveError(null)
    try {
      const id = await saveProduct(aliexpressId, product, {
        name, salePrice: saleNum, category, selectedImages, badge,
      })
      onSaved()
      router.push(`/admin/productos/${id}`)
    } catch (e) {
      setSaveError(String(e))
      setSaving(false)
    }
  }

  const aliUrl = `https://es.aliexpress.com/item/${aliexpressId}.html`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">Importar producto</h2>
            <a href={aliUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 text-orange text-xs mt-0.5 hover:underline">
              <ExternalLink size={11} /> AliExpress ID: {aliexpressId}
            </a>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white p-1"><X size={20} /></button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <RefreshCw size={24} className="text-orange animate-spin" />
              <p className="text-zinc-400 text-sm">Cargando producto desde AliExpress...</p>
            </div>
          )}

          {fetchError && (
            <div className="m-6 flex items-center gap-2 text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <AlertCircle size={16} />
              <span>{fetchError}. Puedes rellenar los campos manualmente.</span>
            </div>
          )}

          {!loading && (
            <div className="p-6 space-y-5">

              {/* Image grid */}
              {(product?.images ?? []).length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">
                      Imágenes ({selectedImages.length}/{product!.images.length} seleccionadas)
                    </p>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setSelectedImages(product!.images)}
                        className="text-xs text-orange hover:underline">Todas</button>
                      <span className="text-zinc-700">·</span>
                      <button type="button" onClick={() => setSelectedImages([])}
                        className="text-xs text-zinc-500 hover:text-white">Ninguna</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {product!.images.map((img, i) => {
                      const selected = selectedImages.includes(img)
                      const isMain = selectedImages[0] === img
                      return (
                        <button key={i} type="button" onClick={() => toggleImage(img)}
                          className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                            selected ? 'border-orange' : 'border-zinc-700 opacity-50 hover:opacity-80'
                          }`}
                        >
                          <Image src={img} alt="" fill sizes="120px" className="object-cover" unoptimized />
                          {selected && (
                            <div className="absolute inset-0 bg-orange/20 flex items-end justify-start p-1">
                              {isMain
                                ? <span className="text-white text-[9px] font-bold bg-orange px-1 rounded">PRINCIPAL</span>
                                : <Check size={12} className="text-white" />
                              }
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-zinc-600 text-xs mt-1">La primera imagen seleccionada será la principal. Haz clic para deseleccionar.</p>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">Nombre *</label>
                <input value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Collar GPS Premium para perros"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange/50" />
                {name && <p className="text-zinc-600 text-xs mt-1">ID: {slugify(name)}</p>}
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">Coste AliExpress (€)</label>
                  <input type="number" step="0.01" min="0" value={costPrice}
                    onChange={(e) => {
                      setCostPrice(e.target.value)
                      const c = parseFloat(e.target.value) || 0
                      if (c > 0) setSalePrice((c * 2.5).toFixed(2))
                    }}
                    placeholder="12.50"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange/50" />
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                    Precio venta (€) * <span className="text-zinc-600 font-normal normal-case">sugerido ×2.5</span>
                  </label>
                  <input type="number" step="0.01" min="0" value={salePrice}
                    onChange={(e) => setSalePrice(e.target.value)}
                    placeholder="31.25"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange/50" />
                </div>
              </div>

              {/* Margin bar */}
              {(costNum > 0 || saleNum > 0) && (
                <div className="flex items-center gap-4 p-3 bg-zinc-800 rounded-xl text-xs">
                  <div className="flex items-center gap-1.5">
                    <BarChart2 size={13} className="text-zinc-500" />
                    <span className="text-zinc-400">Margen</span>
                    <span className={`font-bold font-mono ${marginPct != null && marginPct >= 100 ? 'text-green-400' : marginPct != null && marginPct >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {marginPct != null ? `${marginPct.toFixed(0)}%` : '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-zinc-400">Ganancia</span>
                    <span className={`font-bold font-mono ${profit != null && profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {profit != null ? `${profit > 0 ? '+' : ''}${profit.toFixed(2)}€` : '—'}
                    </span>
                  </div>
                  {product?.stock != null && (
                    <div className="ml-auto flex items-center gap-1.5">
                      <span className="text-zinc-400">Stock</span>
                      <span className="font-bold text-zinc-300">{product.stock}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Category + badge */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">Categoría *</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as 'perros' | 'gatos')}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange/50">
                    <option value="perros">Perros</option>
                    <option value="gatos">Gatos</option>
                  </select>
                </div>
                <div>
                  <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">Badge</label>
                  <select value={badge} onChange={(e) => setBadge(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange/50">
                    <option value="">Sin badge</option>
                    <option value="nuevo">Nuevo</option>
                    <option value="oferta">Oferta</option>
                    <option value="mas-vendido">Más vendido</option>
                  </select>
                </div>
              </div>

              {/* Variants preview */}
              {(product?.variants ?? []).length > 0 && (
                <div className="p-3 bg-zinc-800/60 rounded-xl space-y-1.5">
                  <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Variantes detectadas</p>
                  {product!.variants!.map((v) => (
                    <div key={v.property} className="flex items-start gap-2 text-xs">
                      <span className="text-zinc-500 w-20 flex-shrink-0">{v.property}</span>
                      <span className="text-zinc-300">{v.values.join(' · ')}</span>
                    </div>
                  ))}
                  <p className="text-zinc-600 text-xs">Las variantes se configuran en el editor del producto.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between gap-3 flex-shrink-0">
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-sm transition-colors">Cancelar</button>
          {saveError && <span className="text-red-400 text-xs flex-1">{saveError}</span>}
          <button onClick={handleSave} disabled={!name || !salePrice || saving || loading}
            className="flex items-center gap-2 bg-orange hover:bg-orange-dark text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
            {saving ? 'Guardando...' : 'Guardar en tienda'}
            {!saving && <ChevronRight size={14} />}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Bulk Import Modal ────────────────────────────────────────────────────────

function BulkImportModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [input, setInput] = useState('')
  const [category, setCategory] = useState<'perros' | 'gatos'>('perros')
  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [total, setTotal] = useState(0)
  const [log, setLog] = useState<Array<{ id: string; status: 'ok' | 'error'; name?: string; msg?: string }>>([])

  async function handleBulkImport() {
    const ids = input.split('\n')
      .map((line) => extractAliExpressId(line.trim()))
      .filter((id): id is string => id !== null)

    if (!ids.length) return
    setTotal(ids.length)
    setProgress(0)
    setLog([])
    setRunning(true)

    for (const id of ids) {
      try {
        const product = await fetchAliProduct(id)
        const salePrice = product.price > 0 ? parseFloat((product.price * 2.5).toFixed(2)) : 0
        await saveProduct(id, product, {
          name: product.name.slice(0, 80),
          salePrice,
          category,
          selectedImages: product.images,
          badge: '',
        })
        setLog((prev) => [...prev, { id, status: 'ok', name: product.name.slice(0, 50) }])
      } catch (e) {
        setLog((prev) => [...prev, { id, status: 'error', msg: String(e).slice(0, 80) }])
      }
      setProgress((p) => p + 1)
    }

    setRunning(false)
  }

  const done = progress === total && total > 0 && !running
  const okCount = log.filter((l) => l.status === 'ok').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 flex-shrink-0">
          <div>
            <h2 className="text-white font-bold text-lg">Importación masiva</h2>
            <p className="text-zinc-500 text-xs mt-0.5">Una URL o ID por línea · precio auto = coste ×2.5</p>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={running}
            rows={8}
            placeholder={"https://es.aliexpress.com/item/1005011845171353.html\n1005006100091637\nhttps://es.aliexpress.com/item/..."}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-xs font-mono focus:outline-none focus:border-orange/50 resize-none disabled:opacity-50"
          />

          <div className="flex items-center gap-3">
            <label className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Categoría por defecto</label>
            <select value={category} onChange={(e) => setCategory(e.target.value as 'perros' | 'gatos')}
              disabled={running}
              className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none">
              <option value="perros">Perros</option>
              <option value="gatos">Gatos</option>
            </select>
          </div>

          {/* Progress */}
          {total > 0 && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-zinc-400">{progress} / {total} procesados</span>
                <span className="text-zinc-500">{okCount} guardados · {progress - okCount} errores</span>
              </div>
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange transition-all duration-300 rounded-full"
                  style={{ width: `${total > 0 ? (progress / total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Log */}
          {log.length > 0 && (
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {log.map((entry, i) => (
                <div key={i} className={`flex items-start gap-2 text-xs rounded-lg px-3 py-1.5 ${
                  entry.status === 'ok' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                }`}>
                  {entry.status === 'ok' ? <Check size={11} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={11} className="mt-0.5 flex-shrink-0" />}
                  <span className="font-mono">{entry.id}</span>
                  <span className="text-zinc-400 truncate">{entry.name ?? entry.msg}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between gap-3 flex-shrink-0">
          <button onClick={done ? onDone : onClose} className="text-zinc-400 hover:text-white text-sm transition-colors">
            {done ? 'Cerrar y actualizar' : 'Cancelar'}
          </button>
          <button onClick={handleBulkImport}
            disabled={running || !input.trim() || done}
            className="flex items-center gap-2 bg-orange hover:bg-orange-dark text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {running ? <RefreshCw size={14} className="animate-spin" /> : <Layers size={14} />}
            {running ? `Importando ${progress}/${total}...` : done ? `✓ ${okCount} importados` : 'Importar todos'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props { initialProducts: ProductRow[] }

export default function ProductosClient({ initialProducts }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [importId, setImportId] = useState<string | null>(null)
  const [showBulk, setShowBulk] = useState(false)

  const [filterCategory, setFilterCategory] = useState<'all' | 'perros' | 'gatos'>('all')
  const [filterActive, setFilterActive] = useState<'all' | 'true' | 'false'>('all')
  const [filterSearch, setFilterSearch] = useState('')

  const [syncing, setSyncing] = useState<Set<string>>(new Set())
  const [syncResult, setSyncResult] = useState<Record<string, 'ok' | 'error'>>({})
  const [bulkSyncing, setBulkSyncing] = useState(false)

  function handleImportSubmit(e: React.FormEvent) {
    e.preventDefault()
    setUrlError(null)
    const id = extractAliExpressId(urlInput)
    if (!id) {
      setUrlError('No se pudo extraer el ID. Pega la URL completa o el ID numérico.')
      return
    }
    setImportId(id)
  }

  const refresh = useCallback(() => startTransition(() => router.refresh()), [router, startTransition])

  async function syncProduct(productId: string, aliexpressId: string) {
    setSyncing((prev) => new Set(prev).add(productId))
    try {
      const res = await fetch('/api/admin/sync-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId, aliexpress_id: aliexpressId }),
      })
      setSyncResult((prev) => ({ ...prev, [productId]: res.ok ? 'ok' : 'error' }))
      if (res.ok) refresh()
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Productos</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {initialProducts.length} productos · {withAECount} vinculados a AliExpress
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleBulkSync} disabled={bulkSyncing || withAECount === 0}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
            <RefreshCw size={14} className={bulkSyncing ? 'animate-spin' : ''} />
            Sincronizar todo
          </button>
          <Link href="/admin/productos/nuevo"
            className="flex items-center gap-2 bg-orange hover:bg-orange-dark text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors">
            <Plus size={16} /> Nuevo producto
          </Link>
        </div>
      </div>

      {/* ── Import section ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange/15 flex items-center justify-center">
              <Link2 size={13} className="text-orange" />
            </div>
            <p className="text-white font-bold text-sm">Importar desde AliExpress</p>
          </div>
          <button onClick={() => setShowBulk(true)}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-orange transition-colors bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg">
            <Layers size={12} /> Importación masiva
          </button>
        </div>

        <form onSubmit={handleImportSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={urlInput}
              onChange={(e) => { setUrlInput(e.target.value); setUrlError(null) }}
              placeholder="https://es.aliexpress.com/item/1005011845171353.html  ó  1005011845171353"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange/50"
            />
          </div>
          <button type="submit" disabled={!urlInput.trim()}
            className="flex items-center gap-2 bg-orange hover:bg-orange-dark text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50">
            <Plus size={14} /> Importar
          </button>
        </form>

        {urlError && (
          <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3 mt-3">
            <AlertCircle size={13} />{urlError}
          </div>
        )}
      </div>

      {/* ── Product table ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-zinc-800">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={filterSearch} onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Filtrar por nombre..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-4 py-2 text-white text-xs focus:outline-none focus:border-orange/40" />
          </div>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value as typeof filterCategory)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-300 text-xs focus:outline-none">
            <option value="all">Todas las categorías</option>
            <option value="perros">Perros</option>
            <option value="gatos">Gatos</option>
          </select>
          <select value={filterActive} onChange={(e) => setFilterActive(e.target.value as typeof filterActive)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-300 text-xs focus:outline-none">
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
                {['Producto', 'SKU', 'AliExpress ID', 'Coste', 'Precio venta', 'Margen', 'Stock', 'Categoría', 'Badge', 'Activo', ''].map((h) => (
                  <th key={h} className="text-left text-zinc-500 text-xs font-bold uppercase tracking-wider px-5 py-3.5 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filtered.map((product) => {
                const m = product.cost_price ? calcMargin(product.cost_price, product.price) : null
                const isSyncing = syncing.has(product.id)
                const syncStatus = syncResult[product.id]
                return (
                  <tr key={product.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-zinc-800 flex-shrink-0">
                          {product.image && <Image src={product.image} alt={product.name} fill sizes="40px" className="object-cover" unoptimized />}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium line-clamp-1 max-w-[160px]">{product.name}</p>
                          <p className="text-zinc-600 text-xs font-mono">{product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {product.sku
                        ? <span className="text-xs font-mono font-bold text-zinc-300 bg-zinc-800 px-2 py-1 rounded-lg">{product.sku}</span>
                        : <span className="text-zinc-700 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      {product.aliexpress_id
                        ? <a href={`https://es.aliexpress.com/item/${product.aliexpress_id}.html`} target="_blank" rel="noopener noreferrer"
                            className="text-xs font-mono text-orange hover:underline flex items-center gap-1">
                            {product.aliexpress_id}<ExternalLink size={10} />
                          </a>
                        : <span className="text-zinc-700 text-xs">—</span>}
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
                      {m != null
                        ? <span className={`text-sm font-bold ${m >= 100 ? 'text-green-400' : m >= 30 ? 'text-yellow-400' : 'text-red-400'}`}>{m.toFixed(0)}%</span>
                        : <span className="text-zinc-700 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-sm font-medium ${product.stock < 10 ? 'text-red-400' : 'text-zinc-300'}`}>{product.stock}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-zinc-400 text-sm capitalize">{product.category}</span>
                    </td>
                    <td className="px-5 py-4">
                      {product.badge
                        ? <span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLORS[product.badge] ?? 'bg-zinc-700 text-zinc-300'}`}>{BADGE_LABELS[product.badge]}</span>
                        : <span className="text-zinc-700 text-xs">—</span>}
                    </td>
                    <td className="px-5 py-4"><ToggleActive id={product.id} active={product.active} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5">
                        {product.aliexpress_id && (
                          <button onClick={() => syncProduct(product.id, product.aliexpress_id!)} disabled={isSyncing}
                            title="Sincronizar desde AliExpress"
                            className={`p-1.5 rounded-lg transition-colors ${
                              syncStatus === 'ok' ? 'bg-green-500/15 text-green-400'
                              : syncStatus === 'error' ? 'bg-red-500/15 text-red-400'
                              : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white'
                            }`}>
                            {isSyncing ? <RefreshCw size={13} className="animate-spin" /> : syncStatus === 'ok' ? <Check size={13} /> : <RefreshCw size={13} />}
                          </button>
                        )}
                        <Link href={`/admin/productos/${product.id}`}
                          className="text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-2.5 py-1.5 rounded-lg transition-colors">
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
                  <td colSpan={11} className="text-center py-16">
                    <Package size={32} className="text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500 text-sm">No hay productos con esos filtros</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {importId && (
        <ImportModal
          aliexpressId={importId}
          onClose={() => { setImportId(null); setUrlInput('') }}
          onSaved={() => { setImportId(null); setUrlInput(''); refresh() }}
        />
      )}

      {showBulk && (
        <BulkImportModal
          onClose={() => setShowBulk(false)}
          onDone={() => { setShowBulk(false); refresh() }}
        />
      )}
    </div>
  )
}
