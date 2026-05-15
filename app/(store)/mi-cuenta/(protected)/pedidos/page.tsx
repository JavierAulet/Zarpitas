import Link from 'next/link'
import Image from 'next/image'
import { createServerClient } from '@/lib/supabase/server'
import { ShoppingBag, ChevronRight, Package, Truck, CheckCircle, Clock, XCircle } from 'lucide-react'
import type { OrderStatus } from '@/lib/supabase/types'
import { linkGuestOrders } from '@/lib/actions/orders'

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: React.ElementType }> = {
  pending:    { label: 'Pendiente',   color: 'bg-yellow-50 text-yellow-600 border-yellow-200',   icon: Clock },
  confirmed:  { label: 'Confirmado',  color: 'bg-blue-50 text-blue-600 border-blue-200',         icon: CheckCircle },
  processing: { label: 'Preparando',  color: 'bg-purple-50 text-purple-600 border-purple-200',   icon: Package },
  shipped:    { label: 'En camino',   color: 'bg-orange/10 text-orange border-orange/30',        icon: Truck },
  delivered:  { label: 'Entregado',   color: 'bg-green-50 text-green-600 border-green-200',      icon: CheckCircle },
  cancelled:  { label: 'Cancelado',   color: 'bg-red-50 text-red-500 border-red-200',            icon: XCircle },
}

const PROGRESS: Record<OrderStatus, number> = {
  pending: 0, confirmed: 25, processing: 50, shipped: 75, delivered: 100, cancelled: 0,
}

export default async function MisPedidosPage() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user?.email) await linkGuestOrders(user.id, user.email)

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })

  const allOrders = orders ?? []

  if (allOrders.length === 0) {
    return (
      <div>
        <h1 className="font-display font-black text-2xl text-text-primary mb-6">Mis pedidos</h1>
        <div className="bg-white border-2 border-cream-deep rounded-4xl p-16 text-center shadow-card">
          <div className="w-20 h-20 bg-cream-warm rounded-3xl flex items-center justify-center mx-auto mb-5">
            <ShoppingBag size={32} className="text-text-muted" />
          </div>
          <h2 className="font-display font-bold text-xl text-text-primary mb-2">Aún no tienes pedidos</h2>
          <p className="text-text-muted text-sm mb-6">¡Explora nuestra tienda y encuentra algo para tu mascota!</p>
          <Link href="/productos" className="inline-flex items-center gap-2 bg-orange text-white font-bold px-6 py-3 rounded-2xl text-sm hover:bg-orange-dark transition-colors">
            Ver productos 🐾
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-black text-2xl text-text-primary">Mis pedidos</h1>
        <span className="text-text-muted text-sm">{allOrders.length} pedido{allOrders.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="space-y-4">
        {allOrders.map((order) => {
          const status = order.status as OrderStatus
          const cfg = STATUS_CONFIG[status]
          const StatusIcon = cfg.icon
          const items = order.items as { name: string; price: number; quantity: number; image?: string }[]
          const progress = PROGRESS[status]
          const isCancelled = status === 'cancelled'

          return (
            <Link key={order.id} href={`/mi-cuenta/pedidos/${order.id}`}>
              <div className="bg-white border-2 border-cream-deep hover:border-orange/30 rounded-3xl shadow-card hover:shadow-card-hover transition-all group overflow-hidden">

                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-4">
                  <div>
                    <p className="text-xs text-text-muted font-mono mb-0.5">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-text-secondary text-sm">
                      {new Date(order.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${cfg.color}`}>
                      <StatusIcon size={11} />
                      {cfg.label}
                    </span>
                    <ChevronRight size={16} className="text-text-muted group-hover:text-orange transition-colors" />
                  </div>
                </div>

                {/* Progress bar */}
                {!isCancelled && (
                  <div className="h-1 bg-cream-deep mx-5 rounded-full mb-4 overflow-hidden">
                    <div
                      className="h-full bg-orange rounded-full transition-all duration-700"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                {/* Products */}
                <div className="px-5 pb-5">
                  <div className="flex items-center gap-3">
                    {/* Images */}
                    <div className="flex -space-x-2">
                      {items.slice(0, 3).map((item, i) => (
                        <div
                          key={i}
                          className="w-12 h-12 rounded-xl border-2 border-white bg-cream-warm flex-shrink-0 overflow-hidden shadow-sm"
                          style={{ zIndex: 3 - i }}
                        >
                          {item.image ? (
                            <Image src={item.image} alt={item.name} width={48} height={48} className="object-cover w-full h-full" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-lg">🛒</div>
                          )}
                        </div>
                      ))}
                      {items.length > 3 && (
                        <div className="w-12 h-12 rounded-xl border-2 border-white bg-cream-warm flex items-center justify-center text-xs font-bold text-text-muted shadow-sm" style={{ zIndex: 0 }}>
                          +{items.length - 3}
                        </div>
                      )}
                    </div>

                    {/* Names */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary line-clamp-1">
                        {items[0]?.name}
                      </p>
                      {items.length > 1 && (
                        <p className="text-xs text-text-muted mt-0.5">
                          y {items.length - 1} producto{items.length - 1 !== 1 ? 's' : ''} más
                        </p>
                      )}
                    </div>

                    {/* Total */}
                    <div className="text-right shrink-0">
                      <p className="font-display font-black text-lg text-orange">
                        {order.total.toFixed(2).replace('.', ',')}€
                      </p>
                      <p className="text-xs text-text-muted">
                        {items.reduce((s, i) => s + i.quantity, 0)} artículo{items.reduce((s, i) => s + i.quantity, 0) !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
