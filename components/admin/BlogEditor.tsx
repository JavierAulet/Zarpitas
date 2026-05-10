'use client'
import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Send, RefreshCw } from 'lucide-react'
import ImageUpload from '@/components/ui/ImageUpload'
import { createBlogPost, updateBlogPost } from '@/lib/actions/blog'
import type { BlogPostRow } from '@/lib/supabase/types'

const MDEditor = dynamic(() => import('@uiw/react-md-editor'), { ssr: false })

interface Product { id: string; name: string }

interface Props {
  post?: BlogPostRow
  products: Product[]
}

const CATEGORIES = [
  { value: 'perros', label: '🐶 Perros' },
  { value: 'gatos', label: '🐱 Gatos' },
  { value: 'salud', label: '❤️ Salud' },
  { value: 'alimentacion', label: '🍖 Alimentación' },
  { value: 'gadgets', label: '📱 Gadgets' },
  { value: 'general', label: '🐾 General' },
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

function calcReadTime(content: string): number {
  return Math.max(1, Math.round(content.split(/\s+/).length / 200))
}

export default function BlogEditor({ post, products }: Props) {
  const router = useRouter()
  const isEdit = !!post

  const [title, setTitle] = useState(post?.title ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [slugEdited, setSlugEdited] = useState(isEdit)
  const [content, setContent] = useState(post?.content ?? '')
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '')
  const [imageUrl, setImageUrl] = useState(post?.featured_image_url ?? '')
  const [category, setCategory] = useState(post?.category ?? 'general')
  const [metaTitle, setMetaTitle] = useState(post?.meta_title ?? '')
  const [metaDesc, setMetaDesc] = useState(post?.meta_description ?? '')
  const [relatedIds, setRelatedIds] = useState<string[]>(post?.related_product_ids ?? [])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!slugEdited) setSlug(slugify(title))
  }, [title, slugEdited])

  const readTime = calcReadTime(content)

  async function save(status: 'draft' | 'published') {
    if (!title.trim() || !content.trim()) {
      setError('El título y el contenido son obligatorios')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim(),
        content,
        excerpt: excerpt.trim() || null,
        featured_image_url: imageUrl || null,
        category,
        status,
        meta_title: metaTitle.trim() || null,
        meta_description: metaDesc.trim() || null,
        read_time: readTime,
        related_product_ids: relatedIds,
        published_at: status === 'published' ? (post?.published_at ?? new Date().toISOString()) : null,
      }

      if (isEdit && post) {
        await updateBlogPost(post.id, payload)
      } else {
        await createBlogPost(payload)
      }
      router.push('/admin/blog')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  function toggleProduct(id: string) {
    setRelatedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Left column */}
        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Título *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Los mejores collares GPS para perros en 2026"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-orange/50 transition-colors"
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-zinc-400 text-xs font-semibold mb-1.5">
              Slug (URL)
              <button
                type="button"
                onClick={() => { setSlug(slugify(title)); setSlugEdited(false) }}
                className="ml-2 text-orange/70 hover:text-orange"
              >
                <RefreshCw size={11} className="inline" />
              </button>
            </label>
            <div className="flex items-center bg-zinc-800 border border-zinc-700 rounded-2xl overflow-hidden focus-within:border-orange/50 transition-colors">
              <span className="pl-4 text-zinc-500 text-sm">/blog/</span>
              <input
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setSlugEdited(true) }}
                className="flex-1 bg-transparent py-3 pr-4 text-white text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Content editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-zinc-400 text-xs font-semibold">Contenido * (Markdown)</label>
              <span className="text-zinc-500 text-xs">{readTime} min de lectura</span>
            </div>
            <div data-color-mode="dark">
              <MDEditor
                value={content}
                onChange={(v) => setContent(v ?? '')}
                height={480}
                preview="live"
              />
            </div>
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Extracto (resumen breve)</label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              rows={3}
              placeholder="Breve descripción del artículo que aparece en el listado del blog..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white text-sm placeholder:text-zinc-500 focus:outline-none focus:border-orange/50 transition-colors resize-none"
            />
          </div>

          {/* SEO */}
          <div className="bg-zinc-800 rounded-3xl p-5 border border-zinc-700 space-y-4">
            <p className="text-zinc-300 text-sm font-bold">SEO</p>
            <div>
              <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Meta título</label>
              <input
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                placeholder={`${title} | Zarpitas`}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-orange/50 transition-colors"
              />
              <p className="text-zinc-600 text-xs mt-1">{metaTitle.length}/60 caracteres recomendados</p>
            </div>
            <div>
              <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Meta descripción</label>
              <textarea
                value={metaDesc}
                onChange={(e) => setMetaDesc(e.target.value)}
                rows={2}
                placeholder="Descripción para los resultados de búsqueda de Google..."
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-orange/50 transition-colors resize-none"
              />
              <p className="text-zinc-600 text-xs mt-1">{metaDesc.length}/155 caracteres recomendados</p>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Featured image */}
          <div>
            <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Imagen destacada</label>
            <ImageUpload
              bucket="blog-images"
              onUpload={setImageUrl}
              currentUrl={imageUrl || null}
              className="[&_.rounded-3xl]:rounded-2xl [&_.border-cream-deep]:border-zinc-700 [&_.bg-orange-50]:bg-zinc-800 [&_.border-orange\/15]:border-zinc-600 [&_.text-orange]:text-orange [&_.bg-cream-warm]:bg-zinc-900"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange/50 transition-colors"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Related products */}
          {products.length > 0 && (
            <div>
              <label className="block text-zinc-400 text-xs font-semibold mb-1.5">Productos relacionados</label>
              <div className="bg-zinc-800 border border-zinc-700 rounded-2xl p-3 space-y-1 max-h-52 overflow-y-auto">
                {products.map((p) => (
                  <label key={p.id} className="flex items-center gap-2.5 px-2 py-1.5 rounded-xl hover:bg-zinc-700 cursor-pointer transition-colors">
                    <input
                      type="checkbox"
                      checked={relatedIds.includes(p.id)}
                      onChange={() => toggleProduct(p.id)}
                      className="accent-orange"
                    />
                    <span className="text-sm text-zinc-300 line-clamp-1">{p.name}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-2.5 pt-2">
            <button
              type="button"
              onClick={() => save('published')}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-orange hover:bg-orange-dark text-white font-bold py-3.5 rounded-2xl text-sm transition-colors disabled:opacity-50"
            >
              <Send size={15} />
              {isEdit ? 'Actualizar' : 'Publicar'}
            </button>
            <button
              type="button"
              onClick={() => save('draft')}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-zinc-700 hover:bg-zinc-600 text-white font-bold py-3.5 rounded-2xl text-sm transition-colors disabled:opacity-50"
            >
              <Save size={15} />
              Guardar borrador
            </button>
          </div>

          {isEdit && post && (
            <div className="bg-zinc-800 rounded-2xl p-4 text-xs text-zinc-500 space-y-1 border border-zinc-700">
              <p>Estado: <span className={post.status === 'published' ? 'text-green' : 'text-zinc-400'}>{post.status === 'published' ? 'Publicado' : 'Borrador'}</span></p>
              <p>Vistas: {post.views.toLocaleString('es-ES')}</p>
              <p>Creado: {new Date(post.created_at).toLocaleDateString('es-ES')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
