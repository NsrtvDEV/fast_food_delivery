import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Star, EyeOff, Eye, Trash2 } from 'lucide-react'
import { AdminLayout } from '../components/AdminLayout'
import { reviewApi, type Review } from '../api/client'

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
          }`}
        />
      ))}
    </div>
  )
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden'>('all')

  function load() {
    reviewApi
      .adminList()
      .then(setReviews)
      .catch((err) => toast.error((err as Error).message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  async function handleToggle(id: number) {
    try {
      await reviewApi.toggleVisibility(id)
      toast.success('Видимость изменена')
      load()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Удалить отзыв навсегда?')) return
    try {
      await reviewApi.remove(id)
      toast.success('Отзыв удалён')
      load()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const filtered = reviews.filter((r) => {
    if (filter === 'visible') return !r.is_hidden
    if (filter === 'hidden') return r.is_hidden
    return true
  })

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '—'

  return (
    <AdminLayout>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-3xl font-extrabold text-slate-900">{reviews.length}</p>
          <p className="mt-1 text-sm text-slate-500">Всего отзывов</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="flex items-baseline gap-1 text-3xl font-extrabold text-slate-900">
            {avgRating}
            <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          </p>
          <p className="mt-1 text-sm text-slate-500">Средний рейтинг</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-3xl font-extrabold text-slate-900">
            {reviews.filter((r) => r.is_hidden).length}
          </p>
          <p className="mt-1 text-sm text-slate-500">Скрыто модератором</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Отзывы</h2>
          <div className="flex gap-1.5">
            {(['all', 'visible', 'hidden'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  filter === f
                    ? 'bg-brand-500 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {f === 'all' ? 'Все' : f === 'visible' ? 'Видимые' : 'Скрытые'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="py-8 text-center text-sm text-slate-400">Загрузка...</p>
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-slate-400">Отзывов не найдено</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {filtered.map((r) => (
              <div key={r.id} className="flex items-start gap-3 py-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                  {r.customer_name[0]?.toUpperCase() ?? '?'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{r.customer_name}</p>
                    <span className="text-xs text-slate-400">→ {r.product_name}</span>
                    <Stars rating={r.rating} />
                    {r.is_hidden && (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
                        Скрыт
                      </span>
                    )}
                  </div>
                  {r.comment && <p className="mt-1 text-sm text-slate-600">{r.comment}</p>}
                  <p className="mt-1 text-xs text-slate-400">{formatDate(r.created_at)}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleToggle(r.id)}
                    title={r.is_hidden ? 'Показать' : 'Скрыть'}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  >
                    {r.is_hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(r.id)}
                    title="Удалить"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
