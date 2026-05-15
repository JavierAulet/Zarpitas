import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { createServerClient, createServiceClient } from '@/lib/supabase/server'
import OrderTracker from './OrderTracker'
import type { OrderRow, OrderStatus } from '@/lib/supabase/types'
import { MapPin, Package, Truck, CheckCircle, Clock, ArrowLeft } from 'lucide-react'

const STATUS_STEPS: { key: OrderStatus; label: string; icon: React.ElementType }[] = [
  { key: 'pending',    label: 'Pendiente',  icon: Clock },
  { key: 'confirmed',  label: 'Confirmado', icon: CheckCircle },
  { key: 'processing', label: 'Preparando', icon: Package },
  { key: 'shipped',    label: 'En camino',  icon: Truck },
  { key: 'delivered',  label: 'Entregado',  icon: CheckCircle },
]

interface Props { params: { id: string } }

export default async function OrderDetailPage({ params }: Props) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) notFound()

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
  const stepIndex = STATUS_STEPS.findIndex((s) => s.key === currentStatus)
  const isCancelled = currentStatus === 'cancelled'
  const items = o.items as { name: string; price: number; quantity: number; image?: string; variant?: string }[]

  return (
    <div className="max-w-2xl">
      {/* Back */}
      <Link href="/mi-cuenta/pedidos" className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-orange transition-colors mb-6">
        <ArrowLeft size={14} />
        Mis pedidos
      </Link>

      {/* Title */}
      <div className="mb-6">
        <h1 className="font-display font-black text-2xl text-text-primary">
          Pedido #{o.id.slice(0, 8).toUpperCase()}
        </h1>
        <p className="text-text-muted text-sm mt-1">
          {new Date(o.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Status timeline */}
      {!isCancelled ? (
        <div className="bg-white border-2 border-cream-deep rounded-3xl p-6 mb-5 shadow-card">
          <h2 className="font-bold text-text-primary mb-6 text-sm uppercase tracking-wider">Estado del pedido</h2>
          <div className="relative">
            {/* Track line */}
            <div className="absolute top-5 left-5 right-5 h-0.5 bg-cream-deep">
              <div
                className="h-full bg-orange transition-all duration-700"
                style={{ width: stepIndex <= 0 ? '0%' : `${(stepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
              />
            </div>
            <div className="flex justify-between relative">
              {STATUS_STEPS.map((step, i) => {
                const done = i <= stepIndex
                const active = i === stepIndex
                const Icon = step.icon
                return (
                  <div key={step.key} className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all z-10 ${
                      done ? 'bg-orange border-orange text-white' : 'bg-white border-cream-deep text-text-muted'
                    } ${active ? 'ring-4 ring-orange/20' : ''}`}>
                      <Icon size={16} />
                    </div>
                    <span className={`text-[11px] text-center leading-tight font-semibold ${done ? 'text-orange' : 'text-text-muted'}`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {o.needs_manual_review && (
            <div className="mt-5 p-3.5 rounded-2xl bg-yellow-50 border border-yellow-100 text-xs text-yellow-700 font-medium">
              ⚠️ Tu pedido está siendo procesado. Recibirás confirmación por email en breve.
            </div>
          )}
        </div>
      ) : (
        <div className="bg-red-50 border-2 border-red-100 rounded-3xl p-5 mb-5 text-center">
          <p className="text-red-500 font-bold">❌ Pedido cancelado</p>
          <p className="text-red-400 text-sm mt-1">Si tienes dudas contáctanos por email.</p>
        </div>
      )}

      {/* Live tracking */}
      {(currentStatus === 'shipped' || o.tracking_number || o.aliexpress_order_id) && (
        <OrderTracker orderId={o.id} initialEvents={o.tracking_events ?? []} />
      )}

      {/* Items */}
      <div className="bg-white border-2 border-cream-deep rounded-3xl p-6 mb-5 shadow-card">
        <h2 className="font-bold text-text-primary mb-5 text-sm uppercase tracking-wider">
          Productos ({items.length})
        </h2>
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-cream-warm border border-cream-deep flex-shrink-0 overflow-hidden">
                {item.image ? (
                  <Image src={item.image} alt={item.name} width={64} height={64} className="object-cover w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">🛒</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary line-clamp-2">{item.name}</p>
                {item.variant && (
                  <p className="text-xs text-text-muted mt-0.5">{item.variant}</p>
                )}
                <p className="text-xs text-text-muted mt-0.5">Cantidad: {item.quantity}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-text-primary">{(item.price * item.quantity).toFixed(2).replace('.', ',')}€</p>
                {item.quantity > 1 && (
                  <p className="text-xs text-text-muted">{item.price.toFixed(2).replace('.', ',')}€/u</p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="mt-5 pt-5 border-t border-cream-deep space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Subtotal</span>
            <span className="text-text-secondary">{o.subtotal.toFixed(2).replace('.', ',')}€</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-muted">Envío</span>
            <span className={o.shipping === 0 ? 'text-green-600 font-semibold' : 'text-text-secondary'}>
              {o.shipping === 0 ? '🎁 Gratis' : `${o.shipping.toFixed(2).replace('.', ',')}€`}
            </span>
          </div>
          <div className="flex justify-between font-black text-base pt-2.5 border-t border-cream-deep">
            <span className="text-text-primary">Total</span>
            <span className="text-orange">{o.total.toFixed(2).replace('.', ',')}€</span>
          </div>
        </div>
      </div>

      {/* Shipping address */}
      <div className="bg-white border-2 border-cream-deep rounded-3xl p-6 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <MapPin size={15} className="text-orange" />
          <h2 className="font-bold text-text-primary text-sm uppercase tracking-wider">Dirección de envío</h2>
        </div>
        <div className="text-sm text-text-secondary space-y-1">
          <p className="font-semibold text-text-primary">{o.shipping_address.firstName} {o.shipping_address.lastName}</p>
          <p>{o.shipping_address.address}</p>
          <p>{o.shipping_address.postalCode} {o.shipping_address.city}</p>
          <p>{o.shipping_address.province}, España</p>
        </div>
      </div>
    </div>
  )
}
