'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search, X, Plus, RefreshCw, Check, AlertCircle, ExternalLink, Package, Link2, Upload,
} from 'lucide-react'
import { createProduct } from '@/lib/actions/products'
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
  // Direct numeric ID
  if (/^\d{10,}$/.test(trimmed)) return trimmed
  // URL: /item/DIGITS.html or ?id=DIGITS
  const fromItem = trimmed.match(/\/item\/(\d+)\.html/)
  if (fromItem) return fromItem[1]
  const fromId = trimmed.match(/[?&]id=(\d+)/)
  if (fromId) return fromId[1]
  const fromPath = trimmed.match(/(\d{10,})/)
  if (fromPath) return fromPath[1]
  return null
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

// ─── Mini image uploader for modal ───────────────────────────────────────────

function ProductImageUploadMini({ aliexpressId, value, onChange }: { aliexpressId: string; value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (file.size > 5 * 1024 * 1024) { setUploadError('Máx. 5 MB'); return }
    if (!file.type.startsWith('image/')) { setUploadError('Solo imágenes'); return }
    setUploadError(null)
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    fd.append('productId', aliexpressId || 'import')
    const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
    const json = await res.json()
    if (res.ok && json.url) onChange(json.url)
    else setUploadError(json.error ?? 'Error al subir')
    setUploading(false)
  }

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-zinc-800 group">
          <Image src={value} alt="" fill sizes="400px" className="object-cover" unoptimized />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} className="p-2 bg-orange rounded-lg text-white text-xs font-bold flex items-center gap-1">
              <Upload size={12} /> Cambiar
            </button>
            <button type="button" onClick={() => onChange('')} className="p-2 bg-red-500 rounded-lg text-white">
              <X size={12} />
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          className="border-2 border-dashed border-zinc-700 hover:border-orange/50 rounded-xl p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
        >
          {uploading
            ? <RefreshCw size={20} className="text-orange animate-spin" />
            : <><Upload size={18} className="text-zinc-500" /><p className="text-xs text-zinc-500">Subir desde dispositivo</p></>
          }
        </div>
      )}
      <input
        placeholder="O pega una URL de imagen..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-orange/50 font-mono"
      />
      {uploadError && <p className="text-red-400 text-xs">{uploadError}</p>}
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
    </div>
  )
}

// ─── Import Modal ─────────────────────────────────────────────────────────────

interface ImportModalProps {
  aliexpressId: string
  onClose: () => void
  onSaved: () => void
}

function ImportModal({ aliexpressId, onClose, onSaved }: ImportModalProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [allImages, setAllImages] = useState<string[]>([])

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [features, setFeatures] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [costPrice, setCostPrice] = useState('')
  const [salePrice, setSalePrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [sku, setSku] = useState('')
  const [category, setCategory] = useState<'perros' | 'gatos'>('perros')
  const [subcategory, setSubcategory] = useState('')
  const [badge, setBadge] = useState<'nuevo' | 'oferta' | 'mas-vendido' | ''>('')
  const [stock, setStock] = useState('99')

  // Auto-fetch product data on mount
  useEffect(() => {
    fetch(`/api/aliexpress/product?id=${aliexpressId}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          if (data.name) setName(data.name.slice(0, 80))
          if (data.price) setCostPrice(String(data.price))
          if (data.images?.length) {
            setAllImages(data.images)
            setImageUrl(data.images[0])
          }
          if (data.description) setDescription(data.description.slice(0, 500))
        }
      })
      .catch(() => {/* silent - user fills manually */})
      .finally(() => setLoading(false))
  }, [aliexpressId])

  const costNum = parseFloat(costPrice) || 0
  const saleNum = parseFloat(salePrice) || 0
  const marginPct = costNum > 0 && saleNum > 0 ? margin(costNum, saleNum) : null
  const profit = costNum > 0 && saleNum > 0 ? saleNum - costNum : null

  const aliUrl = `https://es.aliexpress.com/item/${aliexpressId}.html`

  async function handleSave() {
    if (!name || !salePrice || !category) return
    setSaving(true)
    setSaveError(null)
    try {
      const id = slugify(name)
      const images = imageUrl.trim() ? [imageUrl.trim()] : []
      const featuresList = features.split('\n').map((f) => f.trim()).filter(Boolean)
      await createProduct({
        id,
        sku: sku.trim().toUpperCase() || null,
        name,
        price: saleNum,
        cost_price: costNum || null,
        original_price: originalPrice ? parseFloat(originalPrice) : null,
        image: images[0] ?? null,
        images,
        description,
        features: featuresList,
        category,
        subcategory: subcategory || null,
        badge: badge || null,
        aliexpress_id: aliexpressId,
        stock: parseInt(stock) || 99,
        active: false,
      })
      onSaved()
      router.push(`/admin/productos/${id}`)
    } catch (e) {
      setSaveError(String(e))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <h2 className="text-white font-bold text-lg">Importar producto</h2>
            <a
              href={aliUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-orange text-xs mt-0.5 hover:underline"
            >
              <ExternalLink size={11} />
              Ver en AliExpress (ID: {aliexpressId})
            </a>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && (
            <div className="flex items-center gap-2 text-zinc-400 text-xs bg-zinc-800 rounded-xl p-3">
              <RefreshCw size={13} className="animate-spin text-orange" />
              Cargando datos del producto desde AliExpress...
            </div>
          )}

          {/* Image selector when multiple images available */}
          {allImages.length > 1 && (
            <div>
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">Seleccionar imagen principal</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {allImages.slice(0, 8).map((img, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setImageUrl(img)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      imageUrl === img ? 'border-orange' : 'border-zinc-700 hover:border-zinc-500'
                    }`}
                  >
                    <Image src={img} alt="" fill sizes="64px" className="object-cover" unoptimized />
                    {imageUrl === img && (
                      <div className="absolute inset-0 bg-orange/20 flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">
              Nombre en español *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Collar GPS Premium para perros"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange/50"
            />
            {name && <p className="text-zinc-600 text-xs mt-1">ID: {slugify(name)}</p>}
          </div>

          <div>
            <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">
              Imagen principal
            </label>
            {/* Upload from device */}
            <ProductImageUploadMini
              aliexpressId={aliexpressId}
              value={imageUrl}
              onChange={setImageUrl}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                Precio AliExpress (coste)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
                placeholder="12.50"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange/50"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                Precio de venta (€) *
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
          </div>

          {(costNum > 0 || saleNum > 0) && (
            <div className="p-3 bg-zinc-800 rounded-xl text-xs space-y-1.5">
              <div className="flex justify-between text-zinc-400">
                <span>Ganancia por unidad</span>
                <span className={`font-bold font-mono ${profit && profit > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {profit != null ? `${profit > 0 ? '+' : ''}${profit.toFixed(2)}€` : '—'}
                </span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Margen</span>
                <span className={`font-bold ${marginPct != null && marginPct > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {marginPct != null ? `${marginPct.toFixed(0)}%` : '—'}
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                Precio original / tachado (€)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={originalPrice}
                onChange={(e) => setOriginalPrice(e.target.value)}
                placeholder="69.99 (opcional)"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange/50"
              />
            </div>
            <div>
              <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                SKU (referencia interna)
              </label>
              <input
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="ZAR-DOG-001"
                className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-orange/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                Categoría *
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">
                Stock inicial
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
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
              Características (una por línea)
            </label>
            <textarea
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              rows={3}
              placeholder={"Resistente al agua\nBatería de 30 días\nRastreo GPS en tiempo real"}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1.5">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Descripción del producto en español..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange/50 resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="text-zinc-400 hover:text-white text-sm transition-colors">
              Cancelar
            </button>
            {saveError && <span className="text-red-400 text-xs">{saveError}</span>}
          </div>
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


// ─── Main ─────────────────────────────────────────────────────────────────────

interface Props {
  initialProducts: ProductRow[]
}

export default function ProductosClient({ initialProducts }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [urlInput, setUrlInput] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [importId, setImportId] = useState<string | null>(null)

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
      setUrlError('No se pudo extraer el ID. Pega la URL completa del producto o el ID numérico.')
      return
    }
    setImportId(id)
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

      {/* ── AliExpress Import ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-lg bg-orange/15 flex items-center justify-center">
            <Link2 size={13} className="text-orange" />
          </div>
          <p className="text-white font-bold text-sm">Importar desde AliExpress</p>
        </div>
        <p className="text-zinc-500 text-xs mb-4 ml-9">
          Pega la URL del producto de AliExpress o el ID numérico directamente
        </p>

        <form onSubmit={handleImportSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={urlInput}
              onChange={(e) => { setUrlInput(e.target.value); setUrlError(null) }}
              placeholder="https://es.aliexpress.com/item/1005006100091637.html  ó  1005006100091637"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-orange/50"
            />
          </div>
          <button
            type="submit"
            disabled={!urlInput.trim()}
            className="flex items-center gap-2 bg-orange hover:bg-orange-dark text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
          >
            <Plus size={14} />
            Importar
          </button>
        </form>

        {urlError && (
          <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl p-3 mt-3">
            <AlertCircle size={13} />
            {urlError}
          </div>
        )}
      </div>

      {/* ── Product Table ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
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
                {['Producto', 'SKU', 'AliExpress ID', 'Coste', 'Precio venta', 'Margen', 'Stock', 'Categoría', 'Badge', 'Activo', ''].map((h) => (
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
                            <Image src={product.image} alt={product.name} fill sizes="40px" className="object-cover" unoptimized />
                          )}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium line-clamp-1 max-w-[160px]">{product.name}</p>
                          <p className="text-zinc-600 text-xs font-mono">{product.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {product.sku ? (
                        <span className="text-xs font-mono font-bold text-zinc-300 bg-zinc-800 px-2 py-1 rounded-lg">{product.sku}</span>
                      ) : (
                        <span className="text-zinc-700 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {product.aliexpress_id ? (
                        <a
                          href={`https://es.aliexpress.com/item/${product.aliexpress_id}.html`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-mono text-orange hover:underline flex items-center gap-1"
                        >
                          {product.aliexpress_id}
                          <ExternalLink size={10} />
                        </a>
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
                            title="Sincronizar desde AliExpress"
                            className={`p-1.5 rounded-lg transition-colors ${
                              syncStatus === 'ok'
                                ? 'bg-green-500/15 text-green-400'
                                : syncStatus === 'error'
                                ? 'bg-red-500/15 text-red-400'
                                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {isSyncing ? <RefreshCw size={13} className="animate-spin" /> : syncStatus === 'ok' ? <Check size={13} /> : <RefreshCw size={13} />}
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
          onSaved={() => {
            setImportId(null)
            setUrlInput('')
            startTransition(() => router.refresh())
          }}
        />
      )}
    </div>
  )
}
