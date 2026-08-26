import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { AdminLayout } from '../components/AdminLayout'
import { AdminModal } from '../components/AdminModal'
import {
  promocodeApi,
  discountApi,
  catalogApi,
  type Promocode,
  type Discount,
  type Product,
} from '../api/client'

export default function AdminPromotionsPage() {
  const [promocodes, setPromocodes] = useState<Promocode[]>([])
  const [discounts, setDiscounts] = useState<Discount[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [promoModalOpen, setPromoModalOpen] = useState(false)
  const [discountModalOpen, setDiscountModalOpen] = useState(false)

  function load() {
    Promise.all([promocodeApi.list(), discountApi.list(), catalogApi.allProducts()])
      .then(([p, d, prods]) => {
        setPromocodes(p)
        setDiscounts(d)
        setProducts(prods)
      })
      .catch((err) => toast.error((err as Error).message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDeletePromocode(id: number) {
    if (!confirm('Удалить промокод?')) return
    try {
      await promocodeApi.remove(id)
      toast.success('Промокод удалён')
      load()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  async function handleDeleteDiscount(id: number) {
    if (!confirm('Удалить скидку? Она будет снята со всех товаров.')) return
    try {
      await discountApi.remove(id)
      toast.success('Скидка удалена')
      load()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  const productsByDiscount = new Map<number, Product[]>()
  for (const p of products) {
    if (p.discount_id) {
      const list = productsByDiscount.get(p.discount_id) ?? []
      list.push(p)
      productsByDiscount.set(p.discount_id, list)
    }
  }

  return (
    <AdminLayout>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Промокоды</h2>
          <button
            type="button"
            onClick={() => setPromoModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            Новый промокод
          </button>
        </div>
        {loading ? (
          <p className="py-6 text-center text-sm text-slate-400">Загрузка...</p>
        ) : promocodes.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">Промокодов пока нет</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-3">Код</th>
                <th className="py-2 pr-3">Скидка</th>
                <th className="py-2 pr-3">Использовано</th>
                <th className="py-2 pr-3">Статус</th>
                <th className="py-2 pr-3 text-right">Действие</th>
              </tr>
            </thead>
            <tbody>
              {promocodes.map((p) => (
                <tr key={p.id} className="border-b border-slate-50">
                  <td className="py-2.5 pr-3 font-mono font-bold text-slate-900">{p.code}</td>
                  <td className="py-2.5 pr-3 text-slate-600">-{p.discount_percentage}%</td>
                  <td className="py-2.5 pr-3 text-slate-500">
                    {p.used_count} / {p.max_uses}
                  </td>
                  <td className="py-2.5 pr-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        p.is_active
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {p.is_active ? 'Активен' : 'Выключен'}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 text-right">
                    <button
                      type="button"
                      onClick={() => handleDeletePromocode(p.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Скидки на товары</h2>
          <button
            type="button"
            onClick={() => setDiscountModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            Новая скидка
          </button>
        </div>
        {loading ? (
          <p className="py-6 text-center text-sm text-slate-400">Загрузка...</p>
        ) : discounts.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">Скидок пока нет</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="py-2 pr-3">Название</th>
                <th className="py-2 pr-3">Размер</th>
                <th className="py-2 pr-3">Товары</th>
                <th className="py-2 pr-3">Статус</th>
                <th className="py-2 pr-3 text-right">Действие</th>
              </tr>
            </thead>
            <tbody>
              {discounts.map((d) => {
                const usedBy = productsByDiscount.get(d.id) ?? []
                return (
                  <tr key={d.id} className="border-b border-slate-50">
                    <td className="py-2.5 pr-3 font-semibold text-slate-900">{d.name}</td>
                    <td className="py-2.5 pr-3 text-slate-600">
                      {d.discount_type === 'percentage' ? `-${d.value}%` : `-${d.value} сум`}
                    </td>
                    <td className="py-2.5 pr-3 text-slate-500">
                      {usedBy.length === 0
                        ? '— не назначена —'
                        : usedBy.map((p) => p.name).join(', ')}
                    </td>
                    <td className="py-2.5 pr-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          d.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {d.is_active ? 'Активна' : 'Выключена'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-right">
                      <button
                        type="button"
                        onClick={() => handleDeleteDiscount(d.id)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      <PromocodeModal
        open={promoModalOpen}
        onClose={() => setPromoModalOpen(false)}
        onCreated={() => {
          setPromoModalOpen(false)
          load()
        }}
      />
      <DiscountModal
        open={discountModalOpen}
        products={products}
        onClose={() => setDiscountModalOpen(false)}
        onCreated={() => {
          setDiscountModalOpen(false)
          load()
        }}
      />
    </AdminLayout>
  )
}

function PromocodeModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: () => void
}) {
  const [code, setCode] = useState('')
  const [percentage, setPercentage] = useState('10')
  const [maxUses, setMaxUses] = useState('100')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setCode('')
      setPercentage('10')
      setMaxUses('100')
    }
  }, [open])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await promocodeApi.create({
        code,
        discount_percentage: Number(percentage),
        max_uses: Number(maxUses),
        is_active: true,
      })
      toast.success('Промокод создан')
      onCreated()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminModal open={open} title="Новый промокод" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">Код</span>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            required
            className="admin-input font-mono"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500">Скидка (%)</span>
            <input
              type="number"
              min={1}
              max={100}
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              required
              className="admin-input"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500">Лимит использований</span>
            <input
              type="number"
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              required
              className="admin-input"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? 'Сохранение...' : 'Создать'}
        </button>
      </form>
    </AdminModal>
  )
}

function DiscountModal({
  open,
  products,
  onClose,
  onCreated,
}: {
  open: boolean
  products: Product[]
  onClose: () => void
  onCreated: () => void
}) {
  const [name, setName] = useState('')
  const [value, setValue] = useState('10')
  const [days, setDays] = useState('30')
  const [productId, setProductId] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName('')
      setValue('10')
      setDays('30')
      setProductId(products[0] ? String(products[0].id) : '')
    }
  }, [open, products])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const now = new Date()
      const end = new Date(now.getTime() + Number(days) * 24 * 60 * 60 * 1000)
      const created = await discountApi.create({
        name,
        discount_type: 'percentage',
        value: Number(value),
        start_date: now.toISOString(),
        end_date: end.toISOString(),
        is_active: true,
      })
      if (productId) {
        await catalogApi.updateProduct(Number(productId), { discount_id: created.id })
      }
      toast.success('Скидка создана')
      onCreated()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminModal open={open} title="Новая скидка" onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">Название</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="admin-input"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500">Скидка (%)</span>
            <input
              type="number"
              min={1}
              max={100}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              required
              className="admin-input"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500">Дней действия</span>
            <input
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              required
              className="admin-input"
            />
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">Товар</span>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="admin-input"
          >
            <option value="">Не назначать</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? 'Сохранение...' : 'Создать'}
        </button>
      </form>
    </AdminModal>
  )
}
