'use client'
import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Plus, Edit2, Trash2, Eye, EyeOff, Calendar, BarChart2 } from 'lucide-react'
import { deleteBlogPost, toggleBlogPostStatus } from '@/lib/actions/blog'
import type { BlogPostRow } from '@/lib/supabase/types'

const categoryLabels: Record<string, string> = {
  perros: '🐶 Perros', gatos: '🐱 Gatos', salud: '❤️ Salud',
  alimentacion: '🍖 Alimentación', gadgets: '📱 Gadgets', general: '🐾 General',
}

export default function BlogClient({ posts }: { posts: BlogPostRow[] }) {
  const router = useRouter()
  const [list, setList] = useState(posts)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [toggling, setToggling] = useState<string | null>(null)

  async function handleToggle(post: BlogPostRow) {
    setToggling(post.id)
    const next = post.status === 'published' ? 'draft' : 'published'
    await toggleBlogPostStatus(post.id, next)
    setList((prev) => prev.map((p) => p.id === post.id ? { ...p, status: next } : p))
    setToggling(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este artículo? Esta acción no se puede deshacer.')) return
    setDeleting(id)
    await deleteBlogPost(id)
    setList((prev) => prev.filter((p) => p.id !== id))
    setDeleting(null)
    router.refresh()
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Blog</h1>
          <p className="text-zinc-500 text-sm mt-0.5">{list.length} artículos</p>
        </div>
        <Link
          href="/admin/blog/nuevo"
          className="flex items-center gap-2 bg-orange hover:bg-orange-dark text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <Plus size={16} /> Nuevo artículo
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="bg-zinc-800 rounded-3xl p-16 text-center border border-zinc-700">
          <p className="text-zinc-400 mb-4">Aún no hay artículos. Crea el primero.</p>
          <Link
            href="/admin/blog/nuevo"
            className="inline-flex items-center gap-2 bg-orange text-white font-bold px-6 py-3 rounded-xl text-sm hover:bg-orange-dark transition-colors"
          >
            <Plus size={15} /> Crear artículo
          </Link>
        </div>
      ) : (
        <div className="bg-zinc-800 rounded-3xl border border-zinc-700 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-700">
                <th className="text-left text-xs text-zinc-500 font-semibold px-5 py-3.5">Artículo</th>
                <th className="text-left text-xs text-zinc-500 font-semibold px-3 py-3.5 hidden md:table-cell">Categoría</th>
                <th className="text-left text-xs text-zinc-500 font-semibold px-3 py-3.5">Estado</th>
                <th className="text-left text-xs text-zinc-500 font-semibold px-3 py-3.5 hidden lg:table-cell">Fecha</th>
                <th className="text-left text-xs text-zinc-500 font-semibold px-3 py-3.5 hidden lg:table-cell">Vistas</th>
                <th className="text-right text-xs text-zinc-500 font-semibold px-5 py-3.5">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-700/50">
              {list.map((post) => (
                <tr key={post.id} className="hover:bg-zinc-700/30 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-700 flex-shrink-0 relative">
                        {post.featured_image_url ? (
                          <Image src={post.featured_image_url} alt={post.title} fill sizes="48px" className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">📝</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-white text-sm font-semibold line-clamp-1">{post.title}</p>
                        <p className="text-zinc-500 text-xs mt-0.5 line-clamp-1">/blog/{post.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 hidden md:table-cell">
                    <span className="text-zinc-400 text-xs">{categoryLabels[post.category] ?? post.category}</span>
                  </td>
                  <td className="px-3 py-4">
                    <button
                      onClick={() => handleToggle(post)}
                      disabled={toggling === post.id}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all disabled:opacity-50
                        ${post.status === 'published'
                          ? 'bg-green/10 text-green hover:bg-green/20'
                          : 'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'}`}
                    >
                      {post.status === 'published' ? <Eye size={11} /> : <EyeOff size={11} />}
                      {post.status === 'published' ? 'Publicado' : 'Borrador'}
                    </button>
                  </td>
                  <td className="px-3 py-4 hidden lg:table-cell">
                    <span className="flex items-center gap-1.5 text-zinc-500 text-xs">
                      <Calendar size={11} />
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </span>
                  </td>
                  <td className="px-3 py-4 hidden lg:table-cell">
                    <span className="flex items-center gap-1.5 text-zinc-500 text-xs">
                      <BarChart2 size={11} />
                      {post.views.toLocaleString('es-ES')}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/blog/${post.id}/editar`}
                        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-700 transition-colors"
                      >
                        <Edit2 size={15} />
                      </Link>
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deleting === post.id}
                        className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-zinc-700 transition-colors disabled:opacity-40"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
