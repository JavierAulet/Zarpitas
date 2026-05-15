import { AlertCircle } from 'lucide-react'
import { getOrders } from '@/lib/actions/orders'
import PedidosClient from './PedidosClient'
import type { OrderRow } from '@/lib/supabase/types'

export const dynamic = 'force-dynamic'

export default async function AdminPedidosPage() {
  let orders: OrderRow[] = []
  let dbConnected = true

  try {
    orders = (await getOrders()) as OrderRow[]
  } catch {
    dbConnected = false
  }

  return (
    <>
      {!dbConnected && (
        <div className="m-8 mb-0 flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <AlertCircle size={18} className="text-yellow-400 shrink-0" />
          <p className="text-yellow-400 text-sm">
            Supabase no configurado. Los pedidos aparecerán aquí cuando configures las variables de entorno.
          </p>
        </div>
      )}
      <PedidosClient initialOrders={orders} />
    </>
  )
}
