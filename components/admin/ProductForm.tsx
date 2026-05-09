'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import ImageUploader from '@/components/admin/ImageUploader'
import { createProduct, updateProduct } from '@/lib/actions/products'
import type { ProductRow } from '@/lib/supabase/types'

type FormMode = 'create' | 'edit'

interface Props {
  mode: FormMode
  product?: ProductRow
}

const labelClass = 'block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5'
const inputClass = 'w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-orange/50 transition-colors'

function slugify(text: string) {
  return text.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function ProductForm({ mode, product }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
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
  const [aliexpressId, setAliexpressId] = useState(product?.aliexpress_id ?? '')
  const [stock, setStock] = useState(String(product?.stock ?? '0'))
  const [image, setImage] = useState(product?.image ?? '')
  const [active, setActive] = useState(product?.active ?? true)

  const handleNameChange = (v: string) => {
    setName(v)
    if (mode === 'create') setId(slugify(v))
  }

  const addFeature = () => setFeatures((f) => [...f, ''])
  const updateFeature = (i: number, v: string) => setFeatures((f) => f.map((x, j) => (j === i ? v : x)))
  const removeFeature = (i: number) => setFeatures((f) => f.filter((_, j) => j !== i))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const payload = {
      id: id.trim(),
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
      image: image || null,
      images: image ? [image] : [],
      active,
    }

    startTransition(async () => {
      try {
        if (mode === 'create') {
          await createProduct(payload)
        } else {
          await updateProduct(payload.id, payload)
        }
        router.push('/admin/productos')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
      {/* Left col — main fields */}
      <div className="lg:col-span-2 space-y-5">
        {/* Basic info */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold">Información básica</h2>
          <div>
            <label className={labelClass}>Nombre del producto</label>
            <input className={inputClass} value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Collar GPS Premium para Perros" required />
          </div>
          <div>
            <label className={labelClass}>ID / Slug</label>
            <input className={`${inputClass} font-mono`} value={id} onChange={(e) => setId(e.target.value)} placeholder="collar-gps-perro" required disabled={mode === 'edit'} />
            {mode === 'edit' && <p className="text-zinc-600 text-xs mt-1">El ID no se puede cambiar</p>}
          </div>
          <div>
            <label className={labelClass}>Descripción</label>
            <textarea className={`${inputClass} resize-none`} value={description} onChange={(e) => setDescription(e.target.value)} rows={4} placeholder="Descripción del producto..." />
          </div>
        </div>

        {/* Features */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-3">
          <h2 className="text-white font-bold">Características</h2>
          {features.map((f, i) => (
            <div key={i} className="flex gap-2">
              <input
                className={inputClass}
                value={f}
                onChange={(e) => updateFeature(i, e.target.value)}
                placeholder={`Característica ${i + 1}`}
              />
              <button type="button" onClick={() => removeFeature(i)} className="p-2.5 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
          <button type="button" onClick={addFeature} className="flex items-center gap-2 text-sm text-orange hover:text-orange-light font-medium transition-colors">
            <Plus size={15} /> Añadir característica
          </button>
        </div>

        {/* AliExpress */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-white font-bold mb-4">AliExpress</h2>
          <div>
            <label className={labelClass}>ID de producto AliExpress</label>
            <input className={`${inputClass} font-mono`} value={aliexpressId} onChange={(e) => setAliexpressId(e.target.value)} placeholder="ae_collar_gps_001" />
            <p className="text-zinc-600 text-xs mt-1">Se usará para sincronizar pedidos cuando la API esté activa</p>
          </div>
        </div>
      </div>

      {/* Right col — image, price, meta */}
      <div className="space-y-5">
        {/* Image */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <h2 className="text-white font-bold mb-4">Imagen principal</h2>
          <ImageUploader productId={id || 'nuevo'} currentImage={image} onUpload={setImage} />
          {image && (
            <div className="mt-3">
              <label className={labelClass}>URL actual</label>
              <input className={`${inputClass} font-mono text-xs`} value={image} onChange={(e) => setImage(e.target.value)} />
            </div>
          )}
        </div>

        {/* Price & Stock */}
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

        {/* Category & Meta */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-white font-bold">Categoría</h2>
          <div>
            <label className={labelClass}>Categoría</label>
            <select className={inputClass} value={category} onChange={(e) => setCategory(e.target.value as 'perros' | 'gatos')}>
              <option value="perros">🐶 Perros</option>
              <option value="gatos">🐱 Gatos</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Subcategoría</label>
            <input className={inputClass} value={subcategory} onChange={(e) => setSubcategory(e.target.value)} placeholder="Collares y Arneses" />
          </div>
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
