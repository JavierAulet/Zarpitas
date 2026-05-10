import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import BlogEditor from '@/components/admin/BlogEditor'
import { getBlogPostAdmin } from '@/lib/actions/blog'
import { getActiveProducts } from '@/lib/actions/products'

interface Props {
  params: { id: string }
}

export default async function EditarArticuloPage({ params }: Props) {
  const [post, products] = await Promise.all([
    getBlogPostAdmin(params.id),
    getActiveProducts().catch(() => []),
  ])

  if (!post) notFound()

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/admin/blog"
          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 className="text-white text-2xl font-bold">Editar artículo</h1>
          <p className="text-zinc-500 text-sm mt-0.5 line-clamp-1">{post.title}</p>
        </div>
      </div>

      <BlogEditor
        post={post}
        products={products.map((p) => ({ id: p.id, name: p.name }))}
      />
    </div>
  )
}
