import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../components/AdminLayout'
import { ordersApi, VALID_ORDER_TRANSITIONS, type AdminOrder } from '../api/client'
import { ORDER_STATUS_CONFIG, orderStatusLabel } from '../lib/orderStatus'

const STATUS_FILTERS = ['all', 'created', 'accepted', 'cooking', 'on the way', 'delivered', 'canceled']

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  function load() {
    ordersApi
      .adminList()
      .then(setOrders)
      .catch((err) => toast.error((err as Error).message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  async function handleTransition(orderId: number, toStatus: string) {
    setUpdatingId(orderId)
    try {
      await ordersApi.transition(orderId, toStatus)
      toast.success(`Статус изменён на «${orderStatusLabel(toStatus)}»`)
      load()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setUpdatingId(null)
    }
  }

  const filtered = filter === 'all' ? orders : orders.filter((o) => o.status === filter)

  return (
    <AdminLayout>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-slate-900">Заказы</h2>
          <div className="flex flex-wrap gap-1.5">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilter(s)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filter === s
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s === 'all' ? 'Все' : orderStatusLabel(s)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Загрузка...</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">Заказов не найдено</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-3">Заказ</th>
                  <th className="py-2 pr-3">Клиент</th>
                  <th className="py-2 pr-3">Состав</th>
                  <th className="py-2 pr-3">Сумма</th>
                  <th className="py-2 pr-3">Статус</th>
                  <th className="py-2 pr-3">Время</th>
                  <th className="py-2 pr-3 text-right">Действие</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => {
                  const status = ORDER_STATUS_CONFIG[o.status] ?? {
                    label: o.status,
                    className: 'bg-slate-100 text-slate-600',
                  }
                  const nextOptions = VALID_ORDER_TRANSITIONS[o.status] ?? []
                  return (
                    <tr key={o.id} className="border-b border-slate-50">
                      <td className="py-2.5 pr-3 font-semibold text-slate-900">#{o.id}</td>
                      <td className="py-2.5 pr-3">
                        <p className="font-medium text-slate-800">{o.customer_name}</p>
                        <p className="text-xs text-slate-400">{o.customer_contact}</p>
                      </td>
                      <td className="max-w-xs truncate py-2.5 pr-3 text-slate-500">
                        {o.items_summary}
                      </td>
                      <td className="py-2.5 pr-3 font-semibold text-slate-900">
                        {o.total_price.toLocaleString('ru-RU')} сум
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-slate-400">
                        {formatDate(o.created_at)}
                      </td>
                      <td className="py-2.5 pr-3 text-right">
                        {nextOptions.length > 0 ? (
                          <select
                            defaultValue=""
                            disabled={updatingId === o.id}
                            onChange={(e) => {
                              if (e.target.value) handleTransition(o.id, e.target.value)
                            }}
                            className="admin-input py-1.5 text-xs"
                          >
                            <option value="" disabled>
                              Изменить →
                            </option>
                            {nextOptions.map((s) => (
                              <option key={s} value={s}>
                                {orderStatusLabel(s)}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
