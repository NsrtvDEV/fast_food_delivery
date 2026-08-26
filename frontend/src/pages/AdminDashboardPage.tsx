import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  ArrowUp,
  ArrowDown,
  MapPin,
  Clock,
  CircleDollarSign,
  Flame,
  Plus,
  LayoutGrid,
  MapPinned,
  FileText,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { useNavigate } from 'react-router-dom'
import { AdminLayout } from '../components/AdminLayout'
import { adminApi, catalogApi, type DashboardData } from '../api/client'
import { ORDER_STATUS_CONFIG } from '../lib/orderStatus'

const QUICK_ACTIONS = [
  { label: 'New Order', icon: Plus, path: '/admin/orders' },
  { label: 'Manage Menu', icon: LayoutGrid, path: '/admin/menu' },
  { label: 'Delivery Zones', icon: MapPinned, path: '/admin/delivery' },
  { label: 'Reports', icon: FileText, path: '/admin/analytics' },
]

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'только что'
  if (minutes < 60) return `${minutes} мин назад`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ч назад`
  return `${Math.floor(hours / 24)} дн назад`
}

function weekdayLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', { weekday: 'short' })
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    adminApi
      .dashboard()
      .then(setData)
      .catch((err) => toast.error((err as Error).message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <AdminLayout>
        <p className="text-slate-500">Загрузка дашборда...</p>
      </AdminLayout>
    )
  }

  if (!data) {
    return (
      <AdminLayout>
        <p className="text-slate-500">Не удалось загрузить данные.</p>
      </AdminLayout>
    )
  }

  const perf = data.delivery_performance
  const total = perf.early + perf.on_time + perf.late
  const donutData =
    total > 0
      ? [
          { name: 'Early', value: perf.early, color: '#22c55e' },
          { name: 'On Time', value: perf.on_time, color: '#f5a623' },
          { name: 'Late', value: perf.late, color: '#ef4444' },
        ]
      : [{ name: 'No data', value: 1, color: '#e2e8f0' }]

  return (
    <AdminLayout>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          value={data.orders_today.toLocaleString('ru-RU')}
          label="Orders Today"
          change={data.orders_change_pct}
          changeLabel="vs yesterday"
        />
        <KpiCard
          value={data.out_for_delivery.toLocaleString('ru-RU')}
          label="Out for Delivery"
          icon={<MapPin className="h-3.5 w-3.5 text-brand-500" />}
        />
        <KpiCard
          value={data.avg_delivery_minutes != null ? `${data.avg_delivery_minutes} min` : '—'}
          label="Avg. Delivery Time"
          icon={<Clock className="h-3.5 w-3.5 text-brand-500" />}
        />
        <KpiCard
          value={`$${data.revenue_today.toLocaleString('ru-RU')}`}
          label="Revenue Today"
          change={data.revenue_change_pct}
          valueClassName="text-emerald-600"
          icon={<CircleDollarSign className="h-3.5 w-3.5 text-emerald-600" />}
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Recent Orders</h2>
            <button
              type="button"
              onClick={() => navigate('/admin/orders')}
              className="text-xs font-bold text-brand-600 hover:text-brand-700"
            >
              View All
            </button>
          </div>
          {data.recent_orders.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Заказов пока нет</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.recent_orders.map((order) => {
                const status = ORDER_STATUS_CONFIG[order.status] ?? {
                  label: order.status,
                  className: 'bg-slate-100 text-slate-600',
                }
                return (
                  <div key={order.id} className="flex items-center gap-3 py-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {order.customer_name[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        #{order.id} - {order.customer_name}
                      </p>
                      <p className="truncate text-xs text-slate-400">{order.items_summary}</p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                    >
                      {status.label}
                    </span>
                    <span className="hidden w-24 shrink-0 text-right text-xs text-slate-400 sm:block">
                      {timeAgo(order.created_at)}
                    </span>
                    <span className="w-16 shrink-0 text-right text-sm font-bold text-slate-900">
                      ${(order.total_price / 1000).toFixed(2)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-base font-bold text-slate-900">Delivery Performance</h2>
          <div className="relative mx-auto h-44 w-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  innerRadius="72%"
                  outerRadius="100%"
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                >
                  {donutData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold text-slate-900">
                {perf.on_time_rate != null ? `${perf.on_time_rate}%` : '—'}
              </span>
            </div>
          </div>
          <p className="mt-1 text-center text-xs text-slate-400">On-Time Delivery Rate</p>

          <div className="mt-5 flex justify-between text-center">
            <LegendStat color="#22c55e" label="Early" value={perf.early} />
            <LegendStat color="#f5a623" label="On Time" value={perf.on_time} />
            <LegendStat color="#ef4444" label="Late" value={perf.late} />
          </div>

          <h3 className="mb-2 mt-6 text-sm font-bold text-slate-900">Weekly Revenue</h3>
          <div className="h-36">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.weekly_revenue} margin={{ left: -20, right: 4, top: 8 }}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f5a623" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#f5a623" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="date"
                  tickFormatter={weekdayLabel}
                  tick={{ fontSize: 11, fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [`$${Number(value).toLocaleString('ru-RU')}`, 'Revenue']}
                  labelFormatter={(label) => weekdayLabel(String(label))}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f5a623"
                  strokeWidth={2}
                  fill="url(#revenueGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 text-base font-bold text-slate-900">Top Selling Today</h2>
          {data.top_selling.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">Продаж сегодня ещё нет</p>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {data.top_selling.map((product) => (
                <div key={product.id}>
                  <div className="mb-2 aspect-square overflow-hidden rounded-xl bg-slate-100">
                    {product.image_id ? (
                      <img
                        src={catalogApi.productImageUrl(product.image_id)}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-400">
                    <Flame className="h-3 w-3 text-brand-500" />
                    {product.orders_count} orders
                  </p>
                  <p className="text-sm font-bold text-emerald-600">${product.revenue}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-base font-bold text-slate-900">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => navigate(action.path)}
                className="flex flex-col items-center gap-2 rounded-xl py-4 text-slate-600 hover:bg-slate-50"
              >
                <action.icon className="h-5 w-5 text-brand-500" />
                <span className="text-xs font-semibold">{action.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

function KpiCard({
  value,
  label,
  change,
  changeLabel = '',
  icon,
  valueClassName = 'text-slate-900',
}: {
  value: string
  label: string
  change?: number | null
  changeLabel?: string
  icon?: React.ReactNode
  valueClassName?: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <p className={`text-3xl font-extrabold ${valueClassName}`}>{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
      {change != null ? (
        <p
          className={`mt-2 flex items-center gap-1 text-xs font-semibold ${
            change >= 0 ? 'text-emerald-600' : 'text-red-500'
          }`}
        >
          {change >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
          {Math.abs(change)}% {changeLabel}
        </p>
      ) : icon ? (
        <p className="mt-2 flex items-center gap-1 text-xs text-slate-400">{icon}</p>
      ) : (
        <p className="mt-2 text-xs text-slate-300">—</p>
      )}
    </div>
  )
}

function LegendStat({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div>
      <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </p>
      <p className="mt-1 text-lg font-bold text-slate-900">{value}</p>
    </div>
  )
}
