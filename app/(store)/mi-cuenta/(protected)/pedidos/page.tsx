import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'
import { ShoppingBag, ChevronRight } from 'lucide-react'
import type { OrderStatus } from '@/lib/supabase/types'
import { linkGuestOrders } from '@/lib/actions/orders'

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-50 text-yellow-600 border-yellow-100',
  confirmed: 'bg-blue-50 text-blue-600 border-blue-100',
  processing: 'bg-purple-50 text-purple-600 border-purple-100',
  shipped: 'bg-orange-50 text-orange border-orange/20',
  delivered: 'bg-green-50 text-green border-green/20',
  cancelled: 'bg-red-50 text-red-500 border-red-100',
}
const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '⏳ Pendiente',
  confirmed: '✅ Confirmado',
  processing: '🔄 Procesando',
  shipped: '🚀 Enviado',
  delivered: '🎉 Entregado',
  cancelled: '❌ Cancelado',
}

export default async function MisPedidosPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Link any guest orders placed with this email before querying
  if (user?.email) {
    await linkGuestOrders(user.id, user.email)
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const allOrders = orders ?? []

  return (
    <div>
      <h1 className="font-display font-black text-2xl text-text-primary mb-6">Mis pedidos</h1>

      {allOrders.length === 0 ? (
        <div className="bg-white border-2 border-cream-deep rounded-4xl p-12 text-center shadow-card">
          <div className="w-16 h-16 bg-cream-warm rounded-3xl flex items-center justify-center text-3xl mx-auto mb-4">
            <ShoppingBag size={28} className="text-text-muted" />
          </div>
          <h2 className="font-display font-bold text-xl text-text-primary mb-2">Aún no tienes pedidos</h2>
          <p className="text-text-muted text-sm mb-6">¡Explora nuestra tienda y encuentra algo para tu mascota!</p>
          <Link href="/productos" className="inline-flex items-center gap-2 bg-orange text-white font-bold px-6 py-3 rounded-2xl text-sm transition-colors hover:bg-orange-dark">
            Ver productos 🐾
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {allOrders.map((order) => (
            <Link key={order.id} href={`/mi-cuenta/pedidos/${order.id}`}>
              <div className="bg-white border-2 border-cream-deep hover:border-orange/30 rounded-3xl p-5 shadow-card hover:shadow-card-hover transition-all group">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <p className="text-xs text-text-muted font-mono mb-1">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-text-secondary text-sm">
                      {new Date(order.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${STATUS_COLORS[order.status as OrderStatus]}`}>
                      {STATUS_LABELS[order.status as OrderStatus]}
                    </span>
                    <ChevronRight size={16} className="text-text-muted group-hover:text-orange transition-colors" />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {(order.items as { name: string }[]).slice(0, 3).map((item, i) => (
                      <div key={i} className="w-10 h-10 bg-cream-warm rounded-xl flex items-center justify-center text-base border border-cream-deep">
                        🛒
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="w-10 h-10 bg-cream-warm rounded-xl flex items-center justify-center text-xs font-bold text-text-muted border border-cream-deep">
                        +{order.items.length - 3}
                      </div>
                    )}
                  </div>
                  <span className="font-display font-black text-lg text-orange">
                    {order.total.toFixed(2).replace('.', ',')}€
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
