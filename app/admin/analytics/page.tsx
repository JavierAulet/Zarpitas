import { getOrders } from '@/lib/actions/orders'
import AnalyticsClient from './AnalyticsClient'

export const dynamic = 'force-dynamic'

function getLast30DaysMap() {
  const map: Record<string, { revenue: number; orders: number }> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    map[key] = { revenue: 0, orders: 0 }
  }
  return map
}

export default async function AnalyticsPage() {
  let orders: Awaited<ReturnType<typeof getOrders>> = []

  try {
    orders = await getOrders()
  } catch {
    // show empty state
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentOrders = orders.filter(
    (o) => o.status !== 'cancelled' && new Date(o.created_at) >= thirtyDaysAgo
  )

  // Build daily revenue + orders map (last 30 days)
  const dailyMap = getLast30DaysMap()
  for (const o of recentOrders) {
    const d = new Date(o.created_at)
    const key = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
    if (dailyMap[key]) {
      dailyMap[key].revenue += o.total
      dailyMap[key].orders += 1
    }
  }
  const revenueData = Object.entries(dailyMap).map(([date, v]) => ({ date, ...v }))

  // Top 5 products by revenue
  const productMap: Record<string, { name: string; revenue: number; units: number }> = {}
  for (const o of recentOrders) {
    for (const item of o.items as { id: string; name: string; price: number; quantity: number }[]) {
      if (!productMap[item.id]) {
        productMap[item.id] = { name: item.name, revenue: 0, units: 0 }
      }
      productMap[item.id].revenue += item.price * item.quantity
      productMap[item.id].units += item.quantity
    }
  }
  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5)

  const totalRevenue = recentOrders.reduce((s, o) => s + o.total, 0)
  const totalOrders = recentOrders.length
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  // Conversion funnel (estimate based on available data)
  const allOrdersCount = orders.length
  const confirmedCount = orders.filter((o) => o.status !== 'pending' && o.status !== 'cancelled').length
  const shippedCount = orders.filter((o) => o.status === 'shipped' || o.status === 'delivered').length
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length

  const conversionFunnel = [
    { label: 'Pedidos', value: allOrdersCount },
    { label: 'Confirmados', value: confirmedCount },
    { label: 'Enviados', value: shippedCount },
    { label: 'Entregados', value: deliveredCount },
  ]

  return (
    <AnalyticsClient
      revenueData={revenueData}
      topProducts={topProducts}
      totalRevenue={totalRevenue}
      totalOrders={totalOrders}
      avgOrderValue={avgOrderValue}
      conversionFunnel={conversionFunnel}
    />
  )
}
