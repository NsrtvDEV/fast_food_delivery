import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CircleDollarSign, ShoppingBag, Receipt, Star, Flame } from 'lucide-react'
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
  BarChart,
  Bar,
} from 'recharts'
import { AdminLayout } from '../components/AdminLayout'
import { analyticsApi, catalogApi, type AnalyticsData } from '../api/client'
import { orderStatusLabel } from '../lib/orderStatus'

const STATUS_COLORS: Record<string, string> = {
  created: '#94a3b8',
  accepted: '#38bdf8',
  cooking: '#f59e0b',
  'on the way': '#38bdf8',
  delivered: '#22c55e',
  canceled: '#ef4444',
}

function weekdayLabel(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsApi
      .get()
      .then(setData)
      .catch((err) => toast.error((err as Error).message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <AdminLayout>
        <p className="text-slate-500">Загрузка аналитики...</p>
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

  return (
    <AdminLayout>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={CircleDollarSign}
          value={`${data.total_revenue.toLocaleString('ru-RU')} сум`}
          label="Общая выручка"
          iconClassName="text-emerald-600 bg-emerald-50"
        />
        <KpiCard
          icon={ShoppingBag}
          value={String(data.total_orders)}
          label="Всего заказов"
          iconClassName="text-brand-600 bg-brand-50"
        />
        <KpiCard
          icon={Receipt}
          value={`${data.average_order_value.toLocaleString('ru-RU')} сум`}
          label="Средний чек"
          iconClassName="text-sky-600 bg-sky-50"
        />
        <KpiCard
          icon={Star}
          value={data.average_rating != null ? String(data.average_rating) : '—'}
          label="Средний рейтинг"
          iconClassName="text-amber-500 bg-amber-50"
        />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 text-base font-bold text-slate-900">
            Выручка за последние 30 дней
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenue_trend} margin={{ left: -20, right: 4, top: 8 }}>
                <defs>
                  <linearGradient id="analyticsRevenue" x1="0" y1="0" x2="0" y2="1">
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
                  interval={4}
                />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value) => [`${Number(value).toLocaleString('ru-RU')} сум`, 'Выручка']}
                  labelFormatter={(label) => weekdayLabel(String(label))}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#f5a623"
                  strokeWidth={2}
                  fill="url(#analyticsRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-base font-bold text-slate-900">Заказы по статусу</h2>
          {data.status_breakdown.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Нет данных</p>
          ) : (
            <>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.status_breakdown}
                      dataKey="count"
                      nameKey="status"
                      innerRadius="55%"
                      outerRadius="90%"
                      stroke="none"
                    >
                      {data.status_breakdown.map((entry) => (
                        <Cell
                          key={entry.status}
                          fill={STATUS_COLORS[entry.status] ?? '#94a3b8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, _name, item) => [value, orderStatusLabel(item.payload.status)]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
                {data.status_breakdown.map((s) => (
                  <span key={s.status} className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: STATUS_COLORS[s.status] ?? '#94a3b8' }}
                    />
                    {orderStatusLabel(s.status)} ({s.count})
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 lg:col-span-2">
          <h2 className="mb-4 text-base font-bold text-slate-900">Топ товаров по выручке</h2>
          {data.top_products.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Нет данных</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {data.top_products.map((p, i) => (
                <div key={p.id} className="flex items-center gap-3 py-2.5">
                  <span className="w-5 shrink-0 text-sm font-bold text-slate-300">{i + 1}</span>
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {p.image_id && (
                      <img
                        src={catalogApi.productImageUrl(p.image_id)}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{p.name}</p>
                    <p className="flex items-center gap-1 text-xs text-slate-400">
                      <Flame className="h-3 w-3 text-brand-500" />
                      {p.orders_count} продано
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-emerald-600">
                    {p.revenue.toLocaleString('ru-RU')} сум
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-base font-bold text-slate-900">Категории</h2>
          {data.category_performance.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">Нет данных</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.category_performance}
                  layout="vertical"
                  margin={{ left: 0, right: 8 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="category_name"
                    width={90}
                    tick={{ fontSize: 11, fill: '#475569' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toLocaleString('ru-RU')} сум`, 'Выручка']}
                  />
                  <Bar dataKey="revenue" fill="#f5a623" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}

function KpiCard({
  icon: Icon,
  value,
  label,
  iconClassName,
}: {
  icon: typeof CircleDollarSign
  value: string
  label: string
  iconClassName: string
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${iconClassName}`}>
        <Icon className="h-4.5 w-4.5" />
      </div>
      <p className="text-2xl font-extrabold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  )
}
