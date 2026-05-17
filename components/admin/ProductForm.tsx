'use client'
import { useState, useTransition, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

import { Plus, Trash2, Loader2, Upload, X, Star, RefreshCw, Eye, EyeOff, Pencil, Check, GripVertical } from 'lucide-react'
import { createProduct, updateProduct } from '@/lib/actions/products'
import { createVariant, deleteVariant, updateVariant } from '@/lib/actions/variants'
import type { ProductRow, ProductVariantRow } from '@/lib/supabase/types'

type FormMode = 'create' | 'edit'

interface Props {
  mode: FormMode
  product?: ProductRow
  variants?: ProductVariantRow[]
}

const labelClass = 'block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5'
const inputClass = 'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-orange/50 transition-colors'

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function generateSku(category: 'perros' | 'gatos'): string {
  const prefix = category === 'perros' ? 'ZAR-DOG' : 'ZAR-CAT'
  const num = Math.floor(Math.random() * 900) + 100
  return `${prefix}-${num}`
}

// ─── Multi-image uploader ─────────────────────────────────────────────────────

interface MultiImageUploaderProps {
  productId: string
  images: string[]
  onChange: (images: string[]) => void
}

function MultiImageUploader({ productId, images, onChange }: MultiImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragIdx = useRef<number | null>(null)
  const [dragOver, setDragOver] = useState<number | null>(null)

  const moveImage = useCallback((from: number, to: number) => {
    if (from === to) return
    const arr = [...images]
    const [item] = arr.splice(from, 1)
    arr.splice(to, 0, item)
    onChange(arr)
  }, [images, onChange])

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    setError(null)
    setUploading(true)

    const uploaded: string[] = []
    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) { setError('Algún archivo supera 5 MB'); continue }
      if (!file.type.startsWith('image/')) continue

      const fd = new FormData()
      fd.append('file', file)
      fd.append('productId', productId || 'nuevo')

      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (res.ok && json.url) uploaded.push(json.url)
      else setError(json.error ?? 'Error al subir imagen')
    }

    if (uploaded.length > 0) onChange([...images, ...uploaded])
    setUploading(false)
  }

  function removeImage(idx: number) {
    onChange(images.filter((_, i) => i !== idx))
  }

  function setMainImage(idx: number) {
    if (idx === 0) return
    const reordered = [images[idx], ...images.filter((_, i) => i !== idx)]
    onChange(reordered)
  }

  return (
    <div className="space-y-3">
      {/* Grid of uploaded images */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((url, i) => (
            <div
              key={url + i}
              draggable
              onDragStart={(e) => {
                dragIdx.current = i
                e.dataTransfer.effectAllowed = 'move'
                e.dataTransfer.setData('text/plain', String(i))
              }}
              onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOver(i) }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null) }}
              onDrop={(e) => { e.preventDefault(); setDragOver(null); if (dragIdx.current !== null && dragIdx.current !== i) moveImage(dragIdx.current, i) }}
              onDragEnd={() => { dragIdx.current = null; setDragOver(null) }}
              className={`relative group aspect-square rounded-xl overflow-hidden bg-zinc-800 border-2 cursor-grab active:cursor-grabbing transition-all select-none ${
                dragOver === i ? 'border-orange ring-2 ring-orange/40 scale-95 opacity-70' : 'border-zinc-700'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" draggable={false} className="absolute inset-0 w-full h-full object-cover pointer-events-none" />

              {/* Main badge */}
              {i === 0 && (
                <div className="absolute top-1.5 left-1.5 bg-orange text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 pointer-events-none">
                  <Star size={8} fill="white" /> Principal
                </div>
              )}

              {/* Drag handle */}
              <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 rounded-lg p-0.5 pointer-events-none">
                <GripVertical size={12} className="text-white" />
              </div>

              {/* Hover actions */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center gap-1.5 pb-2">
                {i !== 0 && (
                  <button
                    type="button"
                    onClick={() => setMainImage(i)}
                    title="Poner como principal"
                    className="p-1.5 bg-orange rounded-lg text-white"
                  >
                    <Star size={12} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="p-1.5 bg-red-500 rounded-lg text-white"
                >
                  <X size={12} />
                </button>
              </div>
            </div>
          ))}

          {/* Add more slot */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="aspect-square rounded-xl border-2 border-dashed border-zinc-700 hover:border-orange/50 flex flex-col items-center justify-center text-zinc-500 hover:text-zinc-300 transition-colors disabled:opacity-50"
          >
            {uploading ? <Loader2 size={18} className="animate-spin text-orange" /> : <Plus size={18} />}
            <span className="text-xs mt-1">{uploading ? 'Subiendo' : 'Añadir'}</span>
          </button>
        </div>
      )}

      {/* Empty state drop zone */}
      {images.length === 0 && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files) }}
          className="border-2 border-dashed border-zinc-700 hover:border-orange/50 rounded-2xl p-8 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors group"
        >
          {uploading ? (
            <Loader2 size={28} className="text-orange animate-spin" />
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:bg-orange/10 transition-colors">
                <Upload size={20} className="text-zinc-500 group-hover:text-orange transition-colors" />
              </div>
              <p className="text-sm font-medium text-zinc-400 group-hover:text-zinc-200 transition-colors">Arrastra o haz clic para subir</p>
              <p className="text-xs text-zinc-600">JPG, PNG, WebP · máx. 5 MB · múltiples imágenes</p>
            </>
          )}
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
    </div>
  )
}

// ─── Variant row ─────────────────────────────────────────────────────────────

function VariantRow({ variant: v, onDelete, onChange }: {
  variant: ProductVariantRow
  onDelete: () => void
  onChange: (updated: Partial<ProductVariantRow>) => void
}) {
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState((v as ProductVariantRow & { display_name?: string }).display_name ?? '')
  const [saving, setSaving] = useState(false)

  const isActive = v.active !== false

  async function toggleActive() {
    const newActive = !isActive
    onChange({ active: newActive })
    await updateVariant(v.id, { active: newActive })
  }

  async function saveDisplayName() {
    setSaving(true)
    await updateVariant(v.id, { display_name: displayName || null } as Parameters<typeof updateVariant>[1])
    onChange({ display_name: displayName || null } as Partial<ProductVariantRow>)
    setSaving(false)
    setEditing(false)
  }

  return (
    <div className={`flex items-center gap-2 rounded-xl px-3 py-2.5 transition-colors ${isActive ? 'bg-zinc-800' : 'bg-zinc-900 opacity-60'}`}>
      {/* Active toggle */}
      <button type="button" onClick={toggleActive} className="text-zinc-500 hover:text-white transition-colors shrink-0" title={isActive ? 'Desactivar' : 'Activar'}>
        {isActive ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>

      {/* Names */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') saveDisplayName(); if (e.key === 'Escape') setEditing(false) }}
            placeholder={v.name}
            className="w-full bg-zinc-700 text-white text-sm rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-orange/50"
          />
        ) : (
          <div>
            <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-zinc-500'}`}>
              {(v as ProductVariantRow & { display_name?: string }).display_name || v.name}
            </span>
            {(v as ProductVariantRow & { display_name?: string }).display_name && (
              <span className="text-zinc-600 text-xs ml-2 font-mono truncate">({v.name})</span>
            )}
          </div>
        )}
      </div>

      {/* Price modifier */}
      {v.price_modifier !== 0 && (
        <span className={`text-xs font-mono shrink-0 ${v.price_modifier > 80 ? 'text-red-400' : 'text-orange'}`}>
          {v.price_modifier > 0 ? '+' : ''}{v.price_modifier.toFixed(2)}€
        </span>
      )}

      <span className="text-zinc-500 text-xs w-12 text-right shrink-0">{v.stock} uds.</span>

      {/* Edit name */}
      <button
        type="button"
        onClick={editing ? saveDisplayName : () => setEditing(true)}
        disabled={saving}
        className="p-1.5 rounded-lg text-zinc-600 hover:text-blue-400 hover:bg-blue-500/10 transition-colors shrink-0"
        title="Renombrar para la tienda"
      >
        {saving ? <Loader2 size={13} className="animate-spin" /> : editing ? <Check size={13} /> : <Pencil size={13} />}
      </button>

      {/* Delete */}
      <button type="button" onClick={onDelete} className="p-1.5 rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors shrink-0">
        <Trash2 size={13} />
      </button>
    </div>
  )
}

// ─── Main form ────────────────────────────────────────────────────────────────

export default function ProductForm({ mode, product, variants: initialVariants = [] }: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState(product?.name ?? '')
  const [id, setId] = useState(product?.id ?? '')
  const [category, setCategory] = useState<'perros' | 'gatos'>(product?.category ?? 'perros')
  const [subcategory, setSubcategory] = useState(product?.subcategory ?? '')
  const [price, setPrice] = useState(String(product?.price ?? ''))
  const [originalPrice, setOriginalPrice] = useState(String(product?.original_price ?? ''))
  const [badge, setBadge] = useState<string>(product?.badge ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [features, setFeatures] = useState<string[]>(product?.features ?? [''])
  const [sku, setSku] = useState(product?.sku ?? '')
  const [aliexpressId, setAliexpressId] = useState(product?.aliexpress_id ?? '')
  const [stock, setStock] = useState(String(product?.stock ?? '0'))
  const [images, setImages] = useState<string[]>(
    product?.images?.length ? product.images : product?.image ? [product.image] : []
  )
  const [active, setActive] = useState(product?.active ?? true)
  const [showInBoth, setShowInBoth] = useState(product?.show_in_both ?? false)

  // Variants state (edit mode only)
  const [variants, setVariants] = useState<ProductVariantRow[]>(initialVariants)
  const [newVariantName, setNewVariantName] = useState('')
  const [newVariantModifier, setNewVariantModifier] = useState('0')
  const [newVariantStock, setNewVariantStock] = useState('0')
  const [variantLoading, setVariantLoading] = useState(false)
  const [variantError, setVariantError] = useState<string | null>(null)

  const handleAddVariant = async () => {
    if (!newVariantName.trim() || !product?.id) return
    setVariantLoading(true)
    setVariantError(null)
    try {
      await createVariant({
        product_id: product.id,
        name: newVariantName.trim(),
        price_modifier: parseFloat(newVariantModifier) || 0,
        stock: parseInt(newVariantStock) || 0,
        sort_order: variants.length,
      })
      setVariants((prev) => [...prev, {
        id: crypto.randomUUID(),
        product_id: product.id,
        name: newVariantName.trim(),
        sku: null,
        price_modifier: parseFloat(newVariantModifier) || 0,
        stock: parseInt(newVariantStock) || 0,
        active: true,
        sort_order: prev.length,
        properties: null,
        created_at: new Date().toISOString(),
      }])
      setNewVariantName('')
      setNewVariantModifier('0')
      setNewVariantStock('0')
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setVariantError(
        msg.includes('product_variants') || msg.includes('relation') || msg.includes('does not exist')
          ? 'Ejecuta migration_variants.sql en Supabase primero'
          : msg
      )
    }
    setVariantLoading(false)
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!product?.id) return
    try {
      await deleteVariant(variantId, product.id)
      setVariants((prev) => prev.filter((v) => v.id !== variantId))
    } catch (err) {
      setVariantError(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  const handleNameChange = (v: string) => {
    setName(v)
    if (mode === 'create') setId(slugify(v))
  }

  const handleCategoryChange = (v: 'perros' | 'gatos') => {
    setCategory(v)
    if (mode === 'create' && !sku) setSku(generateSku(v))
  }

  const addFeature = () => setFeatures((f) => [...f, ''])
  const updateFeature = (i: number, v: string) => setFeatures((f) => f.map((x, j) => (j === i ? v : x)))
  const removeFeature = (i: number) => setFeatures((f) => f.filter((_, j) => j !== i))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsPending(true)

    const payload = {
      id: id.trim(),
      sku: sku.trim() || null,
      name: name.trim(),
      category,
      subcategory: subcategory || null,
      price: parseFloat(price),
      original_price: originalPrice ? parseFloat(originalPrice) : null,
      badge: (badge || null) as ProductRow['badge'],
      description: description || null,
      features: features.filter(Boolean),
      aliexpress_id: aliexpressId || null,
      stock: parseInt(stock) || 0,
      image: images[0] ?? null,
      images,
      active,
      show_in_both: showInBoth,
    }

    try {
      if (mode === 'create') {
        await createProduct(payload)
      } else {
        await updateProduct(payload.id, payload)
      }
      startTransition(() => router.push('/admin/productos'))
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error desconocido'
      setError(msg.includes('sku') || msg.includes('column')
        ? 'Falta ejecutar la migración SQL de SKU en Supabase. Ve a Supabase → SQL Editor y ejecuta el archivo supabase/migration_sku.sql'
        : msg)
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
      {/* Left col */}
      <div className="lg:col-span-2 space-y-5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold">Información básica</h2>
          <div>
            <label className={labelClass}>Nombre del producto</label>
            <input className={inputClass} value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Collar GPS Premium para Perros" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>ID / Slug</label>
              <input className={`${inputClass} font-mono`} value={id} onChange={(e) => setId(e.target.value)} placeholder="collar-gps-perro" required disabled={mode === 'edit'} />
              {mode === 'edit' && <p className="text-zinc-600 text-xs mt-1">El ID no se puede cambiar</p>}
            </div>
            <div>
              <label className={labelClass}>SKU</label>
              <div className="flex gap-2">
                <input
                  className={`${inputClass} font-mono`}
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="ZAR-DOG-001"
                />
                <button
                  type="button"
                  onClick={() => setSku(generateSku(category))}
                  title="Generar SKU automáticamente"
                  className="p-2.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-zinc-300 flex-shrink-0 transition-colors"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
              <p className="text-zinc-600 text-xs mt-1">Código de referencia interno</p>
            </div>
          </div>
          <div>
            <label className={labelClass}>Descripción</label>
            <textarea className={`${inputClass} resize-none`} value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Descripción del producto..." />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-white font-bold">Características</h2>
          {features.map((f, i) => (
            <div key={i} className="flex gap-2">
              <input className={inputClass} value={f} onChange={(e) => updateFeature(i, e.target.value)} placeholder={`Característica ${i + 1}`} />
              <button type="button" onClick={() => removeFeature(i)} className="p-2.5 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button type="button" onClick={addFeature} className="flex items-center gap-2 text-sm text-orange hover:text-orange-light font-medium transition-colors">
            <Plus size={15} /> Añadir característica
          </button>
        </div>

        {mode === 'edit' && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-bold">Variantes</h2>
              <span className="text-zinc-500 text-xs">Tallas, colores, etc.</span>
            </div>

            {/* Existing variants */}
            {variants.length > 0 && (
              <div className="space-y-2">
                {variants.map((v) => (
                  <VariantRow
                    key={v.id}
                    variant={v}
                    onDelete={() => handleDeleteVariant(v.id)}
                    onChange={(updated) => setVariants((prev) => prev.map((x) => x.id === v.id ? { ...x, ...updated } : x))}
                  />
                ))}
              </div>
            )}

            {/* Add new variant */}
            <div className="space-y-2.5 pt-2 border-t border-zinc-800">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Añadir variante</p>
              <input
                className={inputClass}
                placeholder="Nombre (ej: Talla S, Color Azul)"
                value={newVariantName}
                onChange={(e) => setNewVariantName(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-zinc-600 text-xs mb-1">Precio extra (€)</p>
                  <input
                    type="number"
                    step="0.01"
                    className={inputClass}
                    placeholder="0.00"
                    value={newVariantModifier}
                    onChange={(e) => setNewVariantModifier(e.target.value)}
                  />
                </div>
                <div>
                  <p className="text-zinc-600 text-xs mb-1">Stock</p>
                  <input
                    type="number"
                    min="0"
                    className={inputClass}
                    placeholder="0"
                    value={newVariantStock}
                    onChange={(e) => setNewVariantStock(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                disabled={!newVariantName.trim() || variantLoading}
                className="flex items-center gap-2 text-sm text-orange hover:text-orange-light font-medium transition-colors disabled:opacity-40"
              >
                {variantLoading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                Añadir variante
              </button>
              {variantError && (
                <p className="text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{variantError}</p>
              )}
            </div>
          </div>
        )}

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-white font-bold mb-4">AliExpress</h2>
          <label className={labelClass}>ID de producto AliExpress</label>
          <input className={`${inputClass} font-mono`} value={aliexpressId} onChange={(e) => setAliexpressId(e.target.value)} placeholder="1005006100091637" />
          <p className="text-zinc-600 text-xs mt-1">Se usará para sincronizar pedidos automáticamente</p>
        </div>
      </div>

      {/* Right col */}
      <div className="space-y-5">
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-bold">Imágenes</h2>
            <span className="text-zinc-600 text-xs">{images.length} imagen{images.length !== 1 ? 'es' : ''}</span>
          </div>
          <MultiImageUploader
            productId={id || 'nuevo'}
            images={images}
            onChange={setImages}
          />
          {images.length > 0 && (
            <p className="text-zinc-600 text-xs mt-2">La primera imagen es la principal · toca ★ para cambiarla</p>
          )}
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold">Precio y stock</h2>
          <div>
            <label className={labelClass}>Precio de venta (€)</label>
            <input type="number" step="0.01" min="0" className={inputClass} value={price} onChange={(e) => setPrice(e.target.value)} placeholder="49.99" required />
          </div>
          <div>
            <label className={labelClass}>Precio original (€)</label>
            <input type="number" step="0.01" min="0" className={inputClass} value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="69.99 (opcional)" />
          </div>
          <div>
            <label className={labelClass}>Stock</label>
            <input type="number" min="0" className={inputClass} value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" />
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold">Categoría</h2>
          <div>
            <label className={labelClass}>Categoría</label>
            <select className={inputClass} value={category} onChange={(e) => handleCategoryChange(e.target.value as 'perros' | 'gatos')}>
              <option value="perros">🐶 Perros</option>
              <option value="gatos">🐱 Gatos</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Subcategoría</label>
            <input className={inputClass} value={subcategory} onChange={(e) => setSubcategory(e.target.value)} placeholder="Collares y Arneses" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={showInBoth}
                onChange={(e) => setShowInBoth(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-zinc-700 peer-checked:bg-orange rounded-full transition-colors" />
              <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-4" />
            </div>
            <div>
              <p className="text-white text-sm font-medium">Mostrar en ambas categorías</p>
              <p className="text-zinc-500 text-xs">Aparece en Perros y Gatos al mismo tiempo</p>
            </div>
          </label>
          <div>
            <label className={labelClass}>Badge</label>
            <select className={inputClass} value={badge} onChange={(e) => setBadge(e.target.value)}>
              <option value="">Sin badge</option>
              <option value="nuevo">Nuevo</option>
              <option value="oferta">Oferta</option>
              <option value="mas-vendido">Más vendido</option>
            </select>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm font-medium text-zinc-300">Visible en tienda</span>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`relative w-10 h-6 rounded-full transition-colors ${active ? 'bg-orange' : 'bg-zinc-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${active ? 'translate-x-4' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-orange hover:bg-orange-dark text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
        >
          {isPending && <Loader2 size={16} className="animate-spin" />}
          {isPending ? 'Guardando...' : mode === 'create' ? 'Crear producto' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  )
}
