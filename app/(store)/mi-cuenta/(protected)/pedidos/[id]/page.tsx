import { notFound } from 'next/navigation'
import { createServerClient, createServiceClient } from '@/lib/supabase/server'
import OrderTracker from './OrderTracker'
import type { OrderRow, OrderStatus } from '@/lib/supabase/types'

const STATUS_STEPS: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered']

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'Preparando',
  shipped: 'En camino',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const STATUS_ICONS: Record<OrderStatus, string> = {
  pending: '⏳',
  confirmed: '✅',
  processing: '📦',
  shipped: '🚀',
  delivered: '🎉',
  cancelled: '❌',
}

interface Props {
  params: { id: string }
}

export default async function OrderDetailPage({ params }: Props) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

  // Use service client to get full order data
  const db = createServiceClient()
  const { data: order, error } = await db
    .from('orders')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !order) notFound()

  const o = order as OrderRow
  const currentStatus = o.status as OrderStatus
  const stepIndex = STATUS_STEPS.indexOf(currentStatus)
  const isCancelled = currentStatus === 'cancelled'

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <a href="/mi-cuenta/pedidos" className="text-sm text-text-muted hover:text-orange transition-colors">
          ← Mis pedidos
        </a>
      </div>

      <h1 className="font-display font-black text-2xl text-text-primary mb-1">
        Pedido #{o.id.slice(0, 8).toUpperCase()}
      </h1>
      <p className="text-text-muted text-sm mb-6">
        {new Date(o.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>

      {/* Status timeline */}
      {!isCancelled && (
        <div className="bg-white border-2 border-cream-deep rounded-3xl p-6 mb-5 shadow-card">
          <h2 className="font-bold text-text-primary mb-5 text-sm uppercase tracking-wide">Estado del pedido</h2>
          <div className="relative">
            {/* Progress bar */}
            <div className="absolute top-4 left-4 right-4 h-0.5 bg-cream-deep">
              <div
                className="h-full bg-orange transition-all duration-700"
                style={{ width: stepIndex <= 0 ? '0%' : `${(stepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
              />
            </div>

            <div className="flex justify-between relative">
              {STATUS_STEPS.map((step, i) => {
                const done = i <= stepIndex
                const active = i === stepIndex
                return (
                  <div key={step} className="flex flex-col items-center gap-2 w-16">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition-all z-10 ${
                      done
                        ? 'bg-orange border-orange text-white'
                        : 'bg-white border-cream-deep text-text-muted'
                    } ${active ? 'ring-2 ring-orange/30 ring-offset-1' : ''}`}>
                      {done ? STATUS_ICONS[step] : <span className="w-2 h-2 rounded-full bg-current" />}
                    </div>
                    <span className={`text-[10px] text-center leading-tight font-medium ${done ? 'text-orange' : 'text-text-muted'}`}>
                      {STATUS_LABELS[step]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {o.needs_manual_review && (
            <div className="mt-4 p-3 rounded-xl bg-yellow-50 border border-yellow-100 text-xs text-yellow-700 font-medium">
              ⚠️ Tu pedido está siendo procesado manualmente. Recibirás confirmación por email en 24h.
            </div>
          )}
        </div>
      )}

      {/* Live tracking */}
      {(currentStatus === 'shipped' || o.tracking_number || o.aliexpress_order_id) && (
        <OrderTracker orderId={o.id} initialEvents={o.tracking_events ?? []} />
      )}

      {/* Items */}
      <div className="bg-white border-2 border-cream-deep rounded-3xl p-6 mb-5 shadow-card">
        <h2 className="font-bold text-text-primary mb-4 text-sm uppercase tracking-wide">Productos</h2>
        <div className="space-y-3">
          {o.items.map((item, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cream-warm border border-cream-deep flex items-center justify-center text-xl flex-shrink-0">
                🛒
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary line-clamp-1">{item.name}</p>
                <p className="text-xs text-text-muted">x{item.quantity}</p>
              </div>
              <span className="font-bold text-sm text-text-primary shrink-0">
                {(item.price * item.quantity).toFixed(2).replace('.', ',')}€
              </span>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-cream-deep space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Subtotal</span>
            <span>{o.subtotal.toFixed(2).replace('.', ',')}€</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Envío</span>
            <span>{o.shipping === 0 ? 'Gratis' : `${o.shipping.toFixed(2).replace('.', ',')}€`}</span>
          </div>
          <div className="flex justify-between font-black text-base pt-2 border-t border-cream-deep">
            <span>Total</span>
            <span className="text-orange">{o.total.toFixed(2).replace('.', ',')}€</span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      <div className="bg-white border-2 border-cream-deep rounded-3xl p-6 shadow-card">
        <h2 className="font-bold text-text-primary mb-3 text-sm uppercase tracking-wide">Dirección de envío</h2>
        <div className="text-sm text-text-secondary space-y-0.5">
          <p className="font-medium text-text-primary">{o.shipping_address.firstName} {o.shipping_address.lastName}</p>
          <p>{o.shipping_address.address}</p>
          <p>{o.shipping_address.postalCode} {o.shipping_address.city}</p>
          <p>{o.shipping_address.province}, España</p>
        </div>
      </div>
    </div>
  )
}
