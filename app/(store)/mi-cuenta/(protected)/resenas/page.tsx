import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { Star } from 'lucide-react'
import ReviewForm from '@/components/account/ReviewForm'

export default async function MisResenasPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Orders delivered — can be reviewed
  const { data: orders } = await supabase
    .from('orders')
    .select('id, items, created_at')
    .eq('user_id', user!.id)
    .eq('status', 'delivered')

  // Existing reviews
  const { data: reviews } = await supabase
    .from('reviews')
    .select('*, products(name)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const reviewedProductIds = new Set((reviews ?? []).map((r) => r.product_id))

  // Reviewable products: items from delivered orders not yet reviewed
  const reviewableItems: { productId: string; name: string; orderId: string }[] = []
  for (const order of orders ?? []) {
    for (const item of order.items as { id: string; name: string }[]) {
      if (!reviewedProductIds.has(item.id)) {
        reviewableItems.push({ productId: item.id, name: item.name, orderId: order.id })
      }
    }
  }

  return (
    <div>
      <h1 className="font-display font-black text-2xl text-text-primary mb-6">Mis reseñas</h1>

      {/* Pending reviews */}
      {reviewableItems.length > 0 && (
        <div className="mb-8">
          <h2 className="font-bold text-text-primary mb-4 flex items-center gap-2">
            <span className="w-5 h-5 bg-orange rounded-full flex items-center justify-center text-white text-xs font-black">{reviewableItems.length}</span>
            Productos por valorar
          </h2>
          <div className="space-y-3">
            {reviewableItems.map((item) => (
              <div key={`${item.orderId}-${item.productId}`} className="bg-white border-2 border-orange/20 rounded-3xl p-5 shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-xl">🛒</div>
                  <div>
                    <p className="font-medium text-text-primary text-sm">{item.name}</p>
                    <p className="text-xs text-text-muted">¿Qué te pareció?</p>
                  </div>
                </div>
                <ReviewForm productId={item.productId} orderId={item.orderId} userId={user!.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Published reviews */}
      {(reviews ?? []).length > 0 ? (
        <div>
          <h2 className="font-bold text-text-primary mb-4">Mis valoraciones</h2>
          <div className="space-y-3">
            {reviews!.map((review) => (
              <div key={review.id} className="bg-white border-2 border-cream-deep rounded-3xl p-5 shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-text-primary text-sm">
                    {(review.products as { name: string } | null)?.name ?? review.product_id}
                  </p>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13} className={i < review.rating ? 'text-orange fill-orange' : 'text-cream-deep'} />
                    ))}
                  </div>
                </div>
                {review.title && <p className="text-sm font-bold text-text-primary mb-1">{review.title}</p>}
                {review.body && <p className="text-sm text-text-secondary">{review.body}</p>}
                <p className="text-xs text-text-muted mt-2">
                  {new Date(review.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : reviewableItems.length === 0 ? (
        <div className="bg-white border-2 border-cream-deep rounded-4xl p-12 text-center shadow-card">
          <Star size={32} className="text-text-muted mx-auto mb-3" />
          <h2 className="font-bold text-text-primary mb-2">Sin reseñas aún</h2>
          <p className="text-text-muted text-sm">Las reseñas aparecen cuando tus pedidos sean entregados</p>
          <Link href="/productos" className="inline-block mt-4 text-orange text-sm font-bold hover:underline">
            Ver productos →
          </Link>
        </div>
      ) : null}
    </div>
  )
}
