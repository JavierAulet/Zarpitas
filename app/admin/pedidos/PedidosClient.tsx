'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import {
  X, Search, Download, RefreshCw, AlertTriangle, Package,
  MapPin, Phone, Mail, CreditCard, Truck, Check
} from 'lucide-react'
import { updateOrderStatus } from '@/lib/actions/orders'
import type { OrderRow, OrderStatus } from '@/lib/supabase/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
  confirmed: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  processing: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  shipped: 'bg-orange/15 text-orange border-orange/20',
  delivered: 'bg-green-500/15 text-green-400 border-green-500/20',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/20',
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

const ALL_STATUSES = Object.keys(STATUS_LABELS) as OrderStatus[]

// ─── Order detail modal ───────────────────────────────────────────────────────

function OrderModal({ order, onClose }: { order: OrderRow; onClose: () => void }) {
  const router = useRouter()
  const [status, setStatus] = useState<OrderStatus>(order.status as OrderStatus)
  const [saving, setSaving] = useState(false)
  const [tracking, setTracking] = useState<{ events: { event_date: string; event_desc: string; address: string }[] } | null>(null)
  const [fetchingTracking, setFetchingTracking] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [retryResult, setRetryResult] = useState<{ ok: boolean; message: string } | null>(null)

  async function handleStatusChange(newStatus: OrderStatus) {
    setSaving(true)
    await updateOrderStatus(order.id, newStatus)
    setStatus(newStatus)
    setSaving(false)
    router.refresh()
  }

  async function handleRetryFulfillment() {
    setRetrying(true)
    setRetryResult(null)
    try {
      const res = await fetch('/api/orders/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: order.id }),
      })
      const data = await res.json()
      if (data.success) {
        const newStatus = data.status as OrderStatus
        setStatus(newStatus)
        setRetryResult({
          ok: true,
          message: data.already_confirmed
            ? 'El pedido ya estaba confirmado.'
            : data.needs_manual_review
            ? `Parcialmente procesado — estado: ${STATUS_LABELS[newStatus]}. Revisa AliExpress manualmente.`
            : `¡Éxito! Pedido enviado a AliExpress — estado: ${STATUS_LABELS[newStatus]}`,
        })
        router.refresh()
      } else {
        setRetryResult({ ok: false, message: data.error ?? 'Error desconocido al reintentar.' })
      }
    } catch {
      setRetryResult({ ok: false, message: 'Error de red al contactar el servidor.' })
    } finally {
      setRetrying(false)
    }
  }

  async function fetchTracking() {
    setFetchingTracking(true)
    try {
      const res = await fetch(`/api/orders/tracking?order_id=${order.id}`)
      const data = await res.json()
      setTracking(data)
    } catch {
      setTracking({ events: [] })
    } finally {
      setFetchingTracking(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <div>
            <p className="text-white font-bold">Pedido #{order.id.slice(0, 8).toUpperCase()}</p>
            <p className="text-zinc-500 text-xs mt-0.5">
              {new Date(order.created_at).toLocaleDateString('es-ES', {
                day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${STATUS_COLORS[status]}`}>
              {STATUS_LABELS[status]}
            </span>
            <button onClick={onClose} className="text-zinc-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {order.needs_manual_review && (
            <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
              <AlertTriangle size={16} className="text-yellow-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-400 text-sm font-bold">Revisión manual requerida</p>
                <p className="text-yellow-400/70 text-xs mt-0.5">
                  Uno o más productos no se pudieron fulfil·lar automáticamente en AliExpress. Gestiona este pedido manualmente.
                </p>
              </div>
            </div>
          )}

          {/* Customer info */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-zinc-800 rounded-xl p-4 space-y-2.5">
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Cliente</p>
              <div className="space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-zinc-300">
                  <Package size={13} className="text-zinc-500" />
                  {order.customer_name}
                </div>
                <div className="flex items-center gap-2 text-zinc-300">
                  <Mail size={13} className="text-zinc-500" />
                  {order.customer_email}
                </div>
                {order.customer_phone && (
                  <div className="flex items-center gap-2 text-zinc-300">
                    <Phone size={13} className="text-zinc-500" />
                    {order.customer_phone}
                  </div>
                )}
                {order.stripe_payment_intent_id && (
                  <div className="flex items-center gap-2 text-zinc-500 text-xs">
                    <CreditCard size={12} />
                    <span className="font-mono">{order.stripe_payment_intent_id.slice(0, 20)}…</span>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-zinc-800 rounded-xl p-4 space-y-2.5">
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Dirección de envío</p>
              <div className="space-y-1 text-sm text-zinc-300">
                <div className="flex items-start gap-2">
                  <MapPin size={13} className="text-zinc-500 mt-0.5 shrink-0" />
                  <div>
                    <p>{order.shipping_address.firstName} {order.shipping_address.lastName}</p>
                    <p>{order.shipping_address.address}</p>
                    <p>{order.shipping_address.postalCode} {order.shipping_address.city}</p>
                    <p>{order.shipping_address.province}, España</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-zinc-800 rounded-xl p-4">
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-3">
              Productos ({order.items.length})
            </p>
            <div className="space-y-3">
              {(order.items as { name: string; price: number; quantity: number; image?: string; aliexpress_id?: string }[]).map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-zinc-700 flex-shrink-0 overflow-hidden">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} width={40} height={40} className="object-cover w-full h-full" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">🛒</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium line-clamp-1">{item.name}</p>
                    {item.aliexpress_id && (
                      <p className="text-zinc-600 text-xs font-mono">AE: {item.aliexpress_id}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white text-sm font-bold">{(item.price * item.quantity).toFixed(2)}€</p>
                    <p className="text-zinc-500 text-xs">x{item.quantity} · {item.price.toFixed(2)}€/u</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-zinc-700 mt-3 pt-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-zinc-400">
                <span>Subtotal</span>
                <span>{order.subtotal.toFixed(2)}€</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Envío</span>
                <span>{order.shipping === 0 ? 'Gratis' : `${order.shipping.toFixed(2)}€`}</span>
              </div>
              <div className="flex justify-between text-white font-bold">
                <span>Total</span>
                <span>{order.total.toFixed(2)}€</span>
              </div>
            </div>
          </div>

          {/* AliExpress order refs */}
          {order.aliexpress_order_ids && order.aliexpress_order_ids.length > 0 && (
            <div className="bg-zinc-800 rounded-xl p-4">
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-2">IDs de AliExpress</p>
              <div className="space-y-1">
                {order.aliexpress_order_ids.map((ref, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs font-mono">
                    <span className="text-zinc-500">Producto {ref.product_id}:</span>
                    <span className="text-zinc-300">{ref.aliexpress_order_id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tracking */}
          <div className="bg-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Seguimiento</p>
              <button
                onClick={fetchTracking}
                disabled={fetchingTracking}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
              >
                <RefreshCw size={12} className={fetchingTracking ? 'animate-spin' : ''} />
                {tracking ? 'Actualizar' : 'Cargar tracking'}
              </button>
            </div>
            {tracking ? (
              tracking.events && tracking.events.length > 0 ? (
                <div className="space-y-3">
                  {tracking.events.map((ev, i) => (
                    <div key={i} className="flex gap-3 text-xs">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full mt-0.5 ${i === 0 ? 'bg-orange' : 'bg-zinc-600'}`} />
                        {i < tracking.events.length - 1 && <div className="w-px flex-1 bg-zinc-700 mt-1" />}
                      </div>
                      <div className="pb-3">
                        <p className="text-zinc-300">{ev.event_desc}</p>
                        <p className="text-zinc-600">{ev.event_date} · {ev.address}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-600 text-xs">Sin eventos de tracking disponibles aún</p>
              )
            ) : (
              <p className="text-zinc-600 text-xs">Haz clic en «Cargar tracking» para ver el estado del envío</p>
            )}
            {order.tracking_number && (
              <p className="text-zinc-500 text-xs mt-2 font-mono">
                Nº: {order.tracking_number} · {order.tracking_carrier}
              </p>
            )}
          </div>
        </div>

        {/* Footer — status actions */}
        <div className="px-6 py-4 border-t border-zinc-800">

          {/* Retry fulfillment */}
          {order.needs_manual_review && (
            <div className="mb-4">
              <button
                onClick={handleRetryFulfillment}
                disabled={retrying}
                className="flex items-center gap-2 w-full justify-center bg-orange hover:bg-orange/90 text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 mb-2"
              >
                <RefreshCw size={14} className={retrying ? 'animate-spin' : ''} />
                {retrying ? 'Reintentando...' : 'Reintentar fulfillment en AliExpress'}
              </button>
              {retryResult && (
                <p className={`text-xs px-3 py-2 rounded-lg ${retryResult.ok ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {retryResult.ok ? '✓' : '✗'} {retryResult.message}
                </p>
              )}
            </div>
          )}

          <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Cambiar estado</p>
          <div className="flex flex-wrap gap-2">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                onClick={() => handleStatusChange(s)}
                disabled={s === status || saving}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-colors disabled:cursor-not-allowed ${
                  s === status
                    ? STATUS_COLORS[s]
                    : 'border-zinc-700 text-zinc-500 hover:text-white hover:border-zinc-500'
                }`}
              >
                {s === status && <Check size={10} className="inline mr-1" />}
                {STATUS_LABELS[s]}
              </button>
            ))}
          </div>
          {status !== 'shipped' && (
            <button
              onClick={() => handleStatusChange('shipped')}
              disabled={saving}
              className="mt-3 flex items-center gap-2 w-full justify-center bg-orange hover:bg-orange-dark text-white font-bold px-4 py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
            >
              <Truck size={14} />
              Marcar como enviado
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main client component ────────────────────────────────────────────────────

interface Props {
  initialOrders: OrderRow[]
}

export default function PedidosClient({ initialOrders }: Props) {
  const [selectedOrder, setSelectedOrder] = useState<OrderRow | null>(null)
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all')
  const [filterSearch, setFilterSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const filtered = initialOrders.filter((o) => {
    if (filterStatus !== 'all' && o.status !== filterStatus) return false
    if (filterSearch) {
      const q = filterSearch.toLowerCase()
      if (!o.customer_name.toLowerCase().includes(q) && !o.customer_email.toLowerCase().includes(q) && !o.id.includes(q)) return false
    }
    if (dateFrom && new Date(o.created_at) < new Date(dateFrom)) return false
    if (dateTo && new Date(o.created_at) > new Date(dateTo + 'T23:59:59')) return false
    return true
  })

  const manualReviewCount = initialOrders.filter((o) => o.needs_manual_review).length

  function exportCSV() {
    const headers = ['ID', 'Cliente', 'Email', 'Teléfono', 'Total', 'Estado', 'Revisión manual', 'Fecha']
    const rows = filtered.map((o) => [
      o.id.slice(0, 8),
      o.customer_name,
      o.customer_email,
      o.customer_phone ?? '',
      o.total.toFixed(2),
      o.status,
      o.needs_manual_review ? 'Sí' : 'No',
      new Date(o.created_at).toLocaleDateString('es-ES'),
    ])
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pedidos-zarpitas-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Pedidos</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {initialOrders.length} pedidos en total
            {manualReviewCount > 0 && (
              <span className="ml-2 text-yellow-400">· {manualReviewCount} requieren revisión manual</span>
            )}
          </p>
        </div>
        <button
          onClick={exportCSV}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-medium px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <Download size={14} />
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-5">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Buscar por cliente, email o ID..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl pl-8 pr-4 py-2 text-white text-xs focus:outline-none focus:border-orange/40"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as OrderStatus | 'all')}
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-300 text-xs focus:outline-none"
          >
            <option value="all">Todos los estados</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-300 text-xs focus:outline-none"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-zinc-300 text-xs focus:outline-none"
          />
          {(filterStatus !== 'all' || filterSearch || dateFrom || dateTo) && (
            <button
              onClick={() => { setFilterStatus('all'); setFilterSearch(''); setDateFrom(''); setDateTo('') }}
              className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-500 hover:text-white text-xs transition-colors"
            >
              <X size={13} />
            </button>
          )}
          <p className="text-zinc-600 text-xs ml-auto self-center">{filtered.length} resultados</p>
        </div>
      </div>

      {/* Orders table */}
      {filtered.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl py-20 text-center">
          <Package size={36} className="text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 font-medium">No hay pedidos con esos filtros</p>
        </div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-800">
                  {['Pedido', 'Cliente', 'Productos', 'Total', 'Estado', 'Fecha', ''].map((h) => (
                    <th key={h} className="text-left text-zinc-500 text-xs font-bold uppercase tracking-wider px-5 py-3.5 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-zinc-800/40 transition-colors cursor-pointer"
                    onClick={() => setSelectedOrder(order)}
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-mono font-bold">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        {order.needs_manual_review && (
                          <AlertTriangle size={13} className="text-yellow-400" aria-label="Revisión manual requerida" />
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-white text-sm font-medium">{order.customer_name}</p>
                      <p className="text-zinc-500 text-xs">{order.customer_email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-zinc-300 text-sm">
                        {(order.items as { name: string }[]).length} artículo{(order.items as { name: string }[]).length !== 1 ? 's' : ''}
                      </p>
                      <p className="text-zinc-600 text-xs line-clamp-1">
                        {(order.items as { name: string }[]).map((i) => i.name).join(', ')}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-white text-sm font-bold">{order.total.toFixed(2)}€</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${STATUS_COLORS[order.status as OrderStatus]}`}>
                        {STATUS_LABELS[order.status as OrderStatus]}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-zinc-400 text-sm">
                        {new Date(order.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                      <p className="text-zinc-600 text-xs">
                        {new Date(order.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="px-5 py-4" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedOrder(order) }}
                        className="text-xs font-medium text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedOrder && (
        <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  )
}
