'use client'
import { useTransition } from 'react'
import { updateOrderStatus } from '@/lib/actions/orders'
import type { OrderStatus } from '@/lib/supabase/types'

const statuses: { value: OrderStatus; label: string }[] = [
  { value: 'pending', label: 'Pendiente' },
  { value: 'confirmed', label: 'Confirmado' },
  { value: 'processing', label: 'Procesando' },
  { value: 'shipped', label: 'Enviado' },
  { value: 'delivered', label: 'Entregado' },
  { value: 'cancelled', label: 'Cancelado' },
]

export default function OrderStatusSelect({
  orderId,
  currentStatus,
}: {
  orderId: string
  currentStatus: OrderStatus
}) {
  const [isPending, startTransition] = useTransition()

  return (
    <select
      defaultValue={currentStatus}
      disabled={isPending}
      onChange={(e) =>
        startTransition(() => updateOrderStatus(orderId, e.target.value as OrderStatus))
      }
      className="bg-zinc-800 border border-zinc-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-orange/50 disabled:opacity-50 transition-colors"
    >
      {statuses.map(({ value, label }) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  )
}
