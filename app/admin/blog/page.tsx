import { getBlogPostsAdmin } from '@/lib/actions/blog'
import { getActiveProducts } from '@/lib/actions/products'
import BlogClient from './BlogClient'

export const dynamic = 'force-dynamic'

export default async function AdminBlogPage() {
  const [posts] = await Promise.all([
    getBlogPostsAdmin(),
    getActiveProducts().catch(() => []),
  ])

  return (
    <div className="p-8">
      <BlogClient posts={posts} />
    </div>
  )
}
