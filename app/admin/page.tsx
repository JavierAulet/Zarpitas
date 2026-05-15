export const dynamic = 'force-dynamic'

import Link from 'next/link'
import { getProducts } from '@/lib/actions/products'
import { getOrders } from '@/lib/actions/orders'
import {
  Package, ShoppingBag, TrendingUp, AlertTriangle,
  CheckCircle, AlertCircle, ExternalLink, RefreshCw,
  Euro, Zap, Users, BarChart2, ArrowRight
} from 'lucide-react'
import type { OrderRow } from '@/lib/supabase/types'

const STATUS_COLORS: Record<string, string> = {
  pending:    'bg-yellow-500/15 text-yellow-400',
  confirmed:  'bg-blue-500/15 text-blue-400',
  processing: 'bg-purple-500/15 text-purple-400',
  shipped:    'bg-orange/15 text-orange',
  delivered:  'bg-green-500/15 text-green-400',
  cancelled:  'bg-red-500/15 text-red-400',
}

const STATUS_LABELS: Record<string, string> = {
  pending:    'Pendiente',
  confirmed:  'Confirmado',
  processing: 'Procesando',
  shipped:    'Enviado',
  delivered:  'Entregado',
  cancelled:  'Cancelado',
}

function fmt(n: number) {
  return n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '€'
}

function stripeFee(total: number) {
  return parseFloat((total * 0.029 + 0.30).toFixed(2))
}

function orderCost(order: OrderRow) {
  const items = order.items as { price: number; quantity: number; cost_price?: number }[]
  return items.reduce((sum, i) => sum + ((i.cost_price ?? 0) * i.quantity), 0)
}

function KpiCard({
  label, value, sub, icon: Icon, color, href,
}: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string; href?: string
}) {
  const inner = (
    <div className={`bg-zinc-900 border border-zinc-800 rounded-2xl p-5 h-full ${href ? 'hover:border-zinc-600 transition-colors' : ''}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-zinc-400 text-sm font-medium">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={17} />
        </div>
      </div>
      <p className="text-white text-2xl font-bold">{value}</p>
      {sub && <p className="text-zinc-500 text-xs mt-1">{sub}</p>}
    </div>
  )
  return href ? <Link href={href}>{inner}</Link> : <div>{inner}</div>
}

function AlertBanner({ type, children }: { type: 'warning' | 'error' | 'info'; children: React.ReactNode }) {
  const styles = {
    warning: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    error:   'bg-red-500/10 border-red-500/20 text-red-400',
    info:    'bg-blue-500/10 border-blue-500/20 text-blue-400',
  }
  const icons = { warning: AlertTriangle, error: AlertCircle, info: AlertCircle }
  const Icon = icons[type]
  return (
    <div className={`flex items-center gap-3 border rounded-xl p-3.5 text-sm ${styles[type]}`}>
      <Icon size={15} className="shrink-0" />
      {children}
    </div>
  )
}

export default async function AdminDashboard() {
  let products: Awaited<ReturnType<typeof getProducts>> = []
  let orders: OrderRow[] = []
  let dbConnected = true

  try {
    const [p, o] = await Promise.all([getProducts(), getOrders()])
    products = p
    orders = o as OrderRow[]
  } catch {
    dbConnected = false
  }

  // ── Date ranges ──────────────────────────────────────────────────────────────
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

  const activeOrders = orders.filter((o) => o.status !== 'cancelled')
  const todayOrders = activeOrders.filter((o) => o.created_at >= todayStart)
  const monthOrders = activeOrders.filter((o) => o.created_at >= monthStart)
  const lastMonthOrders = activeOrders.filter(
    (o) => o.created_at >= lastMonthStart && o.created_at <= lastMonthEnd
  )

  // ── Revenue ──────────────────────────────────────────────────────────────────
  const revenueToday = todayOrders.reduce((s, o) => s + o.total, 0)
  const revenueMonth = monthOrders.reduce((s, o) => s + o.total, 0)
  const revenueLastMonth = lastMonthOrders.reduce((s, o) => s + o.total, 0)
  const monthGrowth = revenueLastMonth > 0
    ? ((revenueMonth - revenueLastMonth) / revenueLastMonth) * 100
    : null

  // ── Profit (net of Stripe fees + product cost) ───────────────────────────────
  const calcProfit = (list: OrderRow[]) => {
    return list.reduce((sum, o) => {
      const cost = orderCost(o)
      const fee = stripeFee(o.total)
      return sum + o.total - cost - fee
    }, 0)
  }
  const profitToday = calcProfit(todayOrders)
  const profitMonth = calcProfit(monthOrders)
  const hasCostData = monthOrders.some((o) => orderCost(o) > 0)

  // ── Alerts ───────────────────────────────────────────────────────────────────
  const manualReviewOrders = orders.filter((o) => o.needs_manual_review)
  const lowStockProducts = products.filter((p) => p.active && (p.stock ?? 0) <= 3 && (p.stock ?? 0) >= 0)
  const outOfStockProducts = products.filter((p) => p.active && (p.stock ?? 0) === 0)
  const unlinkedProducts = products.filter((p) => p.active && !p.aliexpress_id)
  const confirmedUnfulfilled = orders.filter((o) => o.status === 'confirmed' && !o.aliexpress_order_id)

  // ── Recent orders ────────────────────────────────────────────────────────────
  const recentOrders = orders.slice(0, 8)

  // ── Top products this month ──────────────────────────────────────────────────
  const productSales: Record<string, { name: string; units: number; revenue: number }> = {}
  for (const order of monthOrders) {
    for (const item of order.items as { name: string; price: number; quantity: number }[]) {
      if (!productSales[item.name]) productSales[item.name] = { name: item.name, units: 0, revenue: 0 }
      productSales[item.name].units += item.quantity
      productSales[item.name].revenue += item.price * item.quantity
    }
  }
  const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  // ── Unique customers this month ──────────────────────────────────────────────
  const uniqueCustomers = new Set(monthOrders.map((o) => o.customer_email)).size
  const avgTicket = monthOrders.length > 0 ? revenueMonth / monthOrders.length : 0

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Dashboard</h1>
          <p className="text-zinc-500 text-sm mt-1">
            {now.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>
        <Link
          href="/admin/analytics"
          className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <BarChart2 size={14} />
          Ver analítica completa
        </Link>
      </div>

      {/* ── Alerts ── */}
      {dbConnected && (manualReviewOrders.length > 0 || confirmedUnfulfilled.length > 0 || outOfStockProducts.length > 0) && (
        <div className="space-y-2">
          {manualReviewOrders.length > 0 && (
            <AlertBanner type="error">
              <span>
                <strong>{manualReviewOrders.length} pedido{manualReviewOrders.length > 1 ? 's' : ''}</strong> requieren revisión manual en AliExpress.{' '}
                <Link href="/admin/pedidos" className="underline font-bold">Gestionar →</Link>
              </span>
            </AlertBanner>
          )}
          {confirmedUnfulfilled.length > 0 && (
            <AlertBanner type="warning">
              <span>
                <strong>{confirmedUnfulfilled.length} pedido{confirmedUnfulfilled.length > 1 ? 's' : ''} confirmados</strong> sin crear en AliExpress todavía.{' '}
                <Link href="/admin/pedidos" className="underline font-bold">Revisar →</Link>
              </span>
            </AlertBanner>
          )}
          {outOfStockProducts.length > 0 && (
            <AlertBanner type="warning">
              <span>
                <strong>{outOfStockProducts.length} producto{outOfStockProducts.length > 1 ? 's' : ''} sin stock.</strong>{' '}
                <Link href="/admin/productos" className="underline font-bold">Ver productos →</Link>
              </span>
            </AlertBanner>
          )}
        </div>
      )}

      {!dbConnected && (
        <AlertBanner type="warning">
          Base de datos no configurada. Añade las variables de Supabase en Vercel.
        </AlertBanner>
      )}

      {/* ── KPIs hoy ── */}
      <div>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">Hoy</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Ingresos hoy"
            value={dbConnected ? fmt(revenueToday) : '—'}
            sub={`${todayOrders.length} pedido${todayOrders.length !== 1 ? 's' : ''}`}
            icon={Euro}
            color="bg-green-500/15 text-green-400"
          />
          <KpiCard
            label="Beneficio neto hoy"
            value={dbConnected && hasCostData ? fmt(profitToday) : '—'}
            sub="Tras Stripe + coste producto"
            icon={TrendingUp}
            color="bg-emerald-500/15 text-emerald-400"
          />
          <KpiCard
            label="Pedidos hoy"
            value={dbConnected ? String(todayOrders.length) : '—'}
            icon={ShoppingBag}
            color="bg-blue-500/15 text-blue-400"
            href="/admin/pedidos"
          />
          <KpiCard
            label="Revisión manual"
            value={dbConnected ? String(manualReviewOrders.length) : '—'}
            sub={manualReviewOrders.length > 0 ? 'Acción requerida' : 'Todo correcto'}
            icon={manualReviewOrders.length > 0 ? AlertTriangle : CheckCircle}
            color={manualReviewOrders.length > 0 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-green-500/15 text-green-400'}
            href="/admin/pedidos"
          />
        </div>
      </div>

      {/* ── KPIs este mes ── */}
      <div>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-3">
          Este mes — {now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Ingresos del mes"
            value={dbConnected ? fmt(revenueMonth) : '—'}
            sub={monthGrowth !== null
              ? `${monthGrowth >= 0 ? '+' : ''}${monthGrowth.toFixed(0)}% vs mes anterior`
              : `${monthOrders.length} pedidos`}
            icon={Euro}
            color="bg-green-500/15 text-green-400"
          />
          <KpiCard
            label="Beneficio neto mes"
            value={dbConnected && hasCostData ? fmt(profitMonth) : '—'}
            sub="Tras Stripe + coste producto"
            icon={TrendingUp}
            color="bg-emerald-500/15 text-emerald-400"
          />
          <KpiCard
            label="Clientes únicos"
            value={dbConnected ? String(uniqueCustomers) : '—'}
            sub={`Ticket medio ${fmt(avgTicket)}`}
            icon={Users}
            color="bg-purple-500/15 text-purple-400"
          />
          <KpiCard
            label="Pedidos del mes"
            value={dbConnected ? String(monthOrders.length) : '—'}
            sub={`${activeOrders.length} total histórico`}
            icon={ShoppingBag}
            color="bg-blue-500/15 text-blue-400"
            href="/admin/pedidos"
          />
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid lg:grid-cols-3 gap-5">

        {/* Recent orders */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
            <h2 className="text-white font-bold">Últimos pedidos</h2>
            <Link href="/admin/pedidos" className="flex items-center gap-1 text-orange text-sm font-medium hover:underline">
              Ver todos <ArrowRight size={13} />
            </Link>
          </div>
          {recentOrders.length === 0 ? (
            <div className="py-16 text-center">
              <ShoppingBag size={32} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-500 text-sm">No hay pedidos aún</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {recentOrders.map((order) => {
                const cost = orderCost(order)
                const profit = order.total - cost - stripeFee(order.total)
                return (
                  <div key={order.id} className="flex items-center gap-4 px-6 py-3.5">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-white text-sm font-mono font-bold">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </span>
                        {order.needs_manual_review && (
                          <AlertTriangle size={12} className="text-yellow-400 shrink-0" />
                        )}
                      </div>
                      <p className="text-zinc-500 text-xs mt-0.5 truncate">
                        {order.customer_name} · {(order.items as { name: string }[]).map((i) => i.name).join(', ')}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-2 justify-end">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status]}`}>
                          {STATUS_LABELS[order.status]}
                        </span>
                        <span className="text-white text-sm font-bold">{fmt(order.total)}</span>
                      </div>
                      {cost > 0 && (
                        <p className={`text-xs mt-0.5 font-mono ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {profit >= 0 ? '+' : ''}{fmt(profit)} neto
                        </p>
                      )}
                    </div>
                    {order.aliexpress_order_id && (
                      <a
                        href={`https://www.aliexpress.com/p/order/detail.html?orderId=${order.aliexpress_order_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-600 hover:text-orange transition-colors shrink-0"
                        title="Ver en AliExpress"
                      >
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Top products */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <h2 className="text-white font-bold mb-4">Top productos (mes)</h2>
            {topProducts.length === 0 ? (
              <p className="text-zinc-600 text-sm text-center py-6">Sin ventas este mes</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, i) => {
                  const max = topProducts[0]?.revenue ?? 1
                  return (
                    <div key={p.name}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-zinc-600 text-xs w-4 shrink-0">{i + 1}</span>
                          <p className="text-zinc-300 text-xs truncate">{p.name}</p>
                        </div>
                        <div className="text-right shrink-0 ml-2">
                          <p className="text-white text-xs font-bold">{fmt(p.revenue)}</p>
                          <p className="text-zinc-600 text-xs">{p.units} ud.</p>
                        </div>
                      </div>
                      <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-orange rounded-full" style={{ width: `${(p.revenue / max) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Catalog status */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-white font-bold">Catálogo</h2>
              <Link href="/admin/productos" className="text-orange text-xs hover:underline flex items-center gap-1">
                Gestionar <ArrowRight size={11} />
              </Link>
            </div>
            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Productos activos</span>
                <span className="text-white font-bold">{products.filter((p) => p.active).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Stock bajo (≤3 ud.)</span>
                <span className={lowStockProducts.length > 0 ? 'text-yellow-400 font-bold' : 'text-white font-bold'}>
                  {lowStockProducts.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Sin stock</span>
                <span className={outOfStockProducts.length > 0 ? 'text-red-400 font-bold' : 'text-white font-bold'}>
                  {outOfStockProducts.length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Sin AliExpress ID</span>
                <span className={unlinkedProducts.length > 0 ? 'text-orange font-bold' : 'text-white font-bold'}>
                  {unlinkedProducts.length}
                </span>
              </div>
            </div>
            {lowStockProducts.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-800 space-y-1.5">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Stock bajo</p>
                {lowStockProducts.slice(0, 4).map((p) => (
                  <div key={p.id} className="flex justify-between text-xs">
                    <span className="text-zinc-400 truncate mr-2">{p.name}</span>
                    <span className={p.stock === 0 ? 'text-red-400 font-bold' : 'text-yellow-400 font-bold'}>
                      {p.stock} ud.
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* System status */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={14} className="text-orange" />
              <h2 className="text-white font-bold">Estado del sistema</h2>
            </div>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Base de datos</span>
                <span className={`flex items-center gap-1 font-bold ${dbConnected ? 'text-green-400' : 'text-red-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${dbConnected ? 'bg-green-400' : 'bg-red-400'}`} />
                  {dbConnected ? 'Conectada' : 'Error'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">API VPS</span>
                <span className="flex items-center gap-1 text-zinc-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                  <Link href="/admin/health" className="hover:text-white transition-colors">
                    Verificar →
                  </Link>
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Fulfill automático</span>
                <span className={`flex items-center gap-1 font-bold ${confirmedUnfulfilled.length === 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${confirmedUnfulfilled.length === 0 ? 'bg-green-400' : 'bg-yellow-400'}`} />
                  {confirmedUnfulfilled.length === 0 ? 'OK' : `${confirmedUnfulfilled.length} pendiente${confirmedUnfulfilled.length > 1 ? 's' : ''}`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Sync de precios</span>
                <span className="flex items-center gap-1 text-zinc-400">
                  <RefreshCw size={10} />
                  Manual
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
