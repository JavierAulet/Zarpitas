'use client'

import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { TrendingUp, ShoppingBag, Package, Euro } from 'lucide-react'

interface DayData { date: string; revenue: number; orders: number }
interface TopProduct { name: string; revenue: number; units: number }

interface Props {
  revenueData: DayData[]
  topProducts: TopProduct[]
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  conversionFunnel: { label: string; value: number }[]
}

const TOOLTIP_STYLE = {
  backgroundColor: '#18181b',
  border: '1px solid #27272a',
  borderRadius: '12px',
  color: '#fff',
  fontSize: '12px',
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string; sub?: string; icon: React.ElementType; color: string
}) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-zinc-400 text-sm">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={16} />
        </div>
      </div>
      <p className="text-white text-3xl font-bold">{value}</p>
      {sub && <p className="text-zinc-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

export default function AnalyticsClient({ revenueData, topProducts, totalRevenue, totalOrders, avgOrderValue, conversionFunnel }: Props) {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-white text-2xl font-bold">Analítica</h1>
        <p className="text-zinc-500 text-sm mt-1">Últimos 30 días</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Ingresos (30d)"
          value={`${totalRevenue.toFixed(2).replace('.', ',')}€`}
          sub="Pedidos no cancelados"
          icon={Euro}
          color="bg-green-500/15 text-green-400"
        />
        <StatCard
          label="Pedidos (30d)"
          value={String(totalOrders)}
          icon={ShoppingBag}
          color="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          label="Ticket medio"
          value={`${avgOrderValue.toFixed(2).replace('.', ',')}€`}
          icon={TrendingUp}
          color="bg-orange/15 text-orange"
        />
        <StatCard
          label="Productos vendidos"
          value={String(topProducts.reduce((s, p) => s + p.units, 0))}
          sub="Top 5 categorías"
          icon={Package}
          color="bg-purple-500/15 text-purple-400"
        />
      </div>

      {/* Revenue chart */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <p className="text-white font-bold mb-5">Ingresos diarios (últimos 30 días)</p>
        {revenueData.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">
            No hay datos de ingresos aún
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#FF6B35" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#71717a', fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} />
              <Tooltip
                contentStyle={TOOLTIP_STYLE}
                formatter={(v) => [`${Number(v).toFixed(2)}€`, 'Ingresos']}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#FF6B35"
                strokeWidth={2}
                fill="url(#revenueGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        {/* Orders per day */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-white font-bold mb-5">Pedidos por día</p>
          {revenueData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">Sin datos aún</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={revenueData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => [Number(v), 'Pedidos']} />
                <Bar dataKey="orders" fill="#FF6B35" radius={[4, 4, 0, 0]} opacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Top 5 products */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
          <p className="text-white font-bold mb-5">Top 5 productos más vendidos</p>
          {topProducts.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-zinc-600 text-sm">Sin ventas registradas aún</div>
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => {
                const maxRevenue = topProducts[0]?.revenue ?? 1
                const pct = (p.revenue / maxRevenue) * 100
                return (
                  <div key={p.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-zinc-600 text-xs w-4">{i + 1}</span>
                        <p className="text-zinc-300 text-sm line-clamp-1">{p.name}</p>
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-white text-sm font-bold">{p.revenue.toFixed(2)}€</p>
                        <p className="text-zinc-600 text-xs">{p.units} ud.</p>
                      </div>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Conversion funnel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <p className="text-white font-bold mb-5">Embudo de conversión (estimado)</p>
        <div className="grid grid-cols-4 gap-4">
          {conversionFunnel.map((step, i) => {
            const first = conversionFunnel[0]?.value ?? 1
            const pct = first > 0 ? (step.value / first) * 100 : 0
            return (
              <div key={step.label} className="text-center">
                <div
                  className="bg-orange/20 border-2 border-orange/30 rounded-2xl flex items-center justify-center mx-auto mb-2"
                  style={{ height: `${Math.max(40, pct * 1.2)}px`, minHeight: '40px' }}
                >
                  <span className="text-orange font-bold text-sm">{pct.toFixed(0)}%</span>
                </div>
                <p className="text-white text-lg font-bold">{step.value}</p>
                <p className="text-zinc-500 text-xs">{step.label}</p>
                {i < conversionFunnel.length - 1 && (
                  <p className="text-zinc-700 text-xs mt-1">↓</p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
