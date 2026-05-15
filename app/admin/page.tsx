export const dynamic = 'force-dynamic'

import { getProducts } from '@/lib/actions/products'
import { getOrders } from '@/lib/actions/orders'
import { Package, ShoppingBag, TrendingUp, Clock, CheckCircle, AlertCircle } from 'lucide-react'

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color,
}: {
  label: string
  value: string | number
  sub?: string
  icon: React.ElementType
  color: string
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-zinc-400 text-sm font-medium">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={17} />
        </div>
      </div>
      <p className="text-white text-3xl font-bold">{value}</p>
      {sub && <p className="text-zinc-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/15 text-yellow-400',
  confirmed: 'bg-blue-500/15 text-blue-400',
  processing: 'bg-purple-500/15 text-purple-400',
  shipped: 'bg-orange/15 text-orange',
  delivered: 'bg-green-500/15 text-green-400',
  cancelled: 'bg-red-500/15 text-red-400',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  processing: 'Procesando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
}

export default async function AdminDashboard() {
  let products: Awaited<ReturnType<typeof getProducts>> = []
  let orders: Awaited<ReturnType<typeof getOrders>> = []
  let dbConnected = true

  try {
    ;[products, orders] = await Promise.all([getProducts(), getOrders()])
  } catch {
    dbConnected = false
  }

  const activeProducts = products.filter((p) => p.active).length
  const pendingOrders = orders.filter((o) => o.status === 'pending').length
  const revenue = orders
    .filter((o) => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0)
  const recentOrders = orders.slice(0, 5)

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-white text-2xl font-bold">Dashboard</h1>
        <p className="text-zinc-500 text-sm mt-1">Bienvenido al panel de Zarpitas 🐾</p>
      </div>

      {!dbConnected && (
        <div className="mb-6 flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4">
          <AlertCircle size={18} className="text-yellow-400 shrink-0" />
          <div>
            <p className="text-yellow-400 text-sm font-bold">Base de datos no configurada</p>
            <p className="text-yellow-400/70 text-xs mt-0.5">
              Añade las variables de entorno de Supabase en <code className="font-mono">.env.local</code> para activar todas las funciones.
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Productos activos"
          value={dbConnected ? activeProducts : '—'}
          sub={dbConnected ? `${products.length} en total` : 'Configura Supabase'}
          icon={Package}
          color="bg-orange/15 text-orange"
        />
        <StatCard
          label="Pedidos totales"
          value={dbConnected ? orders.length : '—'}
          sub={dbConnected ? `${pendingOrders} pendientes` : 'Configura Supabase'}
          icon={ShoppingBag}
          color="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          label="Ingresos totales"
          value={dbConnected ? `${revenue.toFixed(2).replace('.', ',')}€` : '—'}
          sub="Pedidos no cancelados"
          icon={TrendingUp}
          color="bg-green-500/15 text-green-400"
        />
        <StatCard
          label="Pendientes de enviar"
          value={dbConnected ? pendingOrders : '—'}
          sub="Requieren acción"
          icon={Clock}
          color="bg-yellow-500/15 text-yellow-400"
        />
      </div>

      {/* Recent orders */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
          <h2 className="text-white font-bold">Últimos pedidos</h2>
          <a href="/admin/pedidos" className="text-orange text-sm font-medium hover:underline">
            Ver todos →
          </a>
        </div>

        {!dbConnected || recentOrders.length === 0 ? (
          <div className="py-16 text-center">
            <CheckCircle size={32} className="text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">
              {dbConnected ? 'No hay pedidos aún' : 'Conecta Supabase para ver pedidos'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between px-6 py-4">
                <div>
                  <p className="text-white text-sm font-medium">{order.customer_name}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    {order.items.length} producto{order.items.length !== 1 ? 's' : ''} ·{' '}
                    {new Date(order.created_at).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_COLORS[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                  <span className="text-white font-bold text-sm">
                    {order.total.toFixed(2).replace('.', ',')}€
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
