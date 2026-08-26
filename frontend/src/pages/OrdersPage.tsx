import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ClipboardList, MapPin, Store, Check } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { ordersApi, catalogApi, type CustomerOrder } from '../api/client'
import { ORDER_STATUS_CONFIG, orderStatusLabel, ORDER_PROGRESS_STEPS, orderProgressIndex } from '../lib/orderStatus'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function OrderProgress({ status }: { status: string }) {
  if (status === 'canceled') {
    return (
      <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-700">
        Заказ отменён
      </span>
    )
  }

  const currentIndex = orderProgressIndex(status)

  return (
    <div className="flex items-center">
      {ORDER_PROGRESS_STEPS.map((step, i) => {
        const done = i <= currentIndex
        const isLast = i === ORDER_PROGRESS_STEPS.length - 1
        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center gap-1">
              <div
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                  done ? 'bg-brand-500 text-white' : 'bg-ink-100 text-ink-300'
                }`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              <span
                className={`w-16 text-center text-[10px] font-semibold ${
                  done ? 'text-ink-700' : 'text-ink-300'
                }`}
              >
                {orderStatusLabel(step)}
              </span>
            </div>
            {!isLast && (
              <div className={`h-0.5 w-6 sm:w-10 ${i < currentIndex ? 'bg-brand-500' : 'bg-ink-100'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function OrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<CustomerOrder[] | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ordersApi
      .myList()
      .then(setOrders)
      .catch((err) => toast.error((err as Error).message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar search="" onSearchChange={() => {}} />

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-extrabold text-ink-900">
          <ClipboardList className="h-6 w-6 text-brand-500" />
          Мои заказы
        </h1>

        {loading ? (
          <p className="text-ink-500">Загрузка заказов...</p>
        ) : !orders || orders.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-ink-100">
            <ClipboardList className="mx-auto h-12 w-12 text-ink-200" />
            <p className="mt-3 font-semibold text-ink-700">У вас пока нет заказов</p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-5 rounded-full bg-brand-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600"
            >
              Перейти в меню
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusCfg = ORDER_STATUS_CONFIG[order.status] ?? {
                label: order.status,
                className: 'bg-slate-100 text-slate-600',
              }
              return (
                <div key={order.id} className="rounded-2xl bg-white p-5 ring-1 ring-ink-100">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-extrabold text-ink-900">Заказ #{order.id}</p>
                      <p className="text-xs text-ink-400">{formatDate(order.created_at)}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusCfg.className}`}>
                      {statusCfg.label}
                    </span>
                  </div>

                  <div className="mt-4 overflow-x-auto pb-1">
                    <OrderProgress status={order.status} />
                  </div>

                  <div className="mt-4 space-y-2 border-t border-ink-100 pt-4">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-ink-50">
                          {item.image_id && (
                            <img
                              src={catalogApi.productImageUrl(item.image_id)}
                              alt={item.product_name}
                              className="h-full w-full object-cover"
                            />
                          )}
                        </div>
                        <p className="flex-1 truncate text-sm text-ink-700">
                          {item.product_name} <span className="text-ink-400">x{item.quantity}</span>
                        </p>
                        <p className="text-sm font-semibold text-ink-900">
                          {(item.price * item.quantity).toLocaleString('ru-RU')} сум
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 pt-3 text-xs text-ink-500">
                    <div className="flex flex-wrap items-center gap-4">
                      {order.branch_name && (
                        <span className="flex items-center gap-1.5">
                          <Store className="h-3.5 w-3.5" />
                          {order.branch_name}
                        </span>
                      )}
                      {order.address_name && (
                        <span className="flex max-w-xs items-center gap-1.5 truncate">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{order.address_name}</span>
                        </span>
                      )}
                    </div>
                    <span className="text-base font-extrabold text-ink-900">
                      {order.total_price.toLocaleString('ru-RU')} сум
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
