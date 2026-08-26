import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { AdminLayout } from '../components/AdminLayout'
import { AdminModal } from '../components/AdminModal'
import { deliveryApi, branchApi, type AdminDelivery, type Branch } from '../api/client'
import { ORDER_STATUS_CONFIG } from '../lib/orderStatus'

function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminDeliveryPage() {
  const [deliveries, setDeliveries] = useState<AdminDelivery[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Branch | null>(null)

  function load() {
    Promise.all([deliveryApi.activeAdmin(), branchApi.list()])
      .then(([d, b]) => {
        setDeliveries(d)
        setBranches(b)
      })
      .catch((err) => toast.error((err as Error).message))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
  }, [])

  async function handleDeleteBranch(id: number) {
    if (!confirm('Удалить филиал?')) return
    try {
      await branchApi.remove(id)
      toast.success('Филиал удалён')
      load()
    } catch (err) {
      toast.error((err as Error).message)
    }
  }

  return (
    <AdminLayout>
      <div className="rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-4 text-base font-bold text-slate-900">Активные доставки</h2>
        {loading ? (
          <p className="py-6 text-center text-sm text-slate-400">Загрузка...</p>
        ) : deliveries.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">Нет активных доставок</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  <th className="py-2 pr-3">Заказ</th>
                  <th className="py-2 pr-3">Клиент</th>
                  <th className="py-2 pr-3">Курьер</th>
                  <th className="py-2 pr-3">Филиал</th>
                  <th className="py-2 pr-3">Статус</th>
                  <th className="py-2 pr-3">Сумма</th>
                  <th className="py-2 pr-3">Назначено</th>
                </tr>
              </thead>
              <tbody>
                {deliveries.map((d) => {
                  const status = ORDER_STATUS_CONFIG[d.order_status] ?? {
                    label: d.order_status,
                    className: 'bg-slate-100 text-slate-600',
                  }
                  return (
                    <tr key={d.delivery_id} className="border-b border-slate-50">
                      <td className="py-2.5 pr-3 font-semibold text-slate-900">
                        #{d.order_id}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-700">{d.customer_name}</td>
                      <td className="py-2.5 pr-3 text-slate-500">
                        {d.courier_name ?? 'Не назначен'}
                      </td>
                      <td className="py-2.5 pr-3 text-slate-500">{d.branch_name ?? '—'}</td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.className}`}
                        >
                          {status.label}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 font-semibold text-slate-900">
                        {d.total_price.toLocaleString('ru-RU')} сум
                      </td>
                      <td className="py-2.5 pr-3 text-xs text-slate-400">
                        {formatDate(d.assigned_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">Филиалы и зоны доставки</h2>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-600"
          >
            <Plus className="h-4 w-4" />
            Добавить филиал
          </button>
        </div>

        {branches.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">Филиалов пока нет</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {branches.map((b) => (
              <div key={b.id} className="rounded-xl border border-slate-100 p-4">
                <div className="flex items-start justify-between">
                  <p className="font-bold text-slate-900">{b.name || b.address}</p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(b)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBranch(b.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">{b.address}</p>
                <p className="mt-1 text-xs text-slate-500">{b.branch_phone}</p>
                <p className="mt-1 text-xs text-slate-400">{b.working_hours}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <BranchModal
        open={modalOpen}
        branch={null}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false)
          load()
        }}
      />
      <BranchModal
        open={!!editing}
        branch={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null)
          load()
        }}
      />
    </AdminLayout>
  )
}

function BranchModal({
  open,
  branch,
  onClose,
  onSaved,
}: {
  open: boolean
  branch: Branch | null
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [workingHours, setWorkingHours] = useState('')
  const [phone, setPhone] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setName(branch?.name ?? '')
      setAddress(branch?.address ?? '')
      setWorkingHours(branch?.working_hours ?? '')
      setPhone(branch?.branch_phone ?? '')
      setLatitude(branch?.latitude != null ? String(branch.latitude) : '')
      setLongitude(branch?.longitude != null ? String(branch.longitude) : '')
    }
  }, [open, branch])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (branch) {
        await branchApi.update(branch.id, {
          name,
          address,
          working_hours: workingHours,
          phone,
          latitude: latitude ? Number(latitude) : undefined,
          longitude: longitude ? Number(longitude) : undefined,
        })
        toast.success('Филиал обновлён')
      } else {
        await branchApi.create({
          name,
          address,
          working_hours: workingHours,
          phone,
          latitude: Number(latitude),
          longitude: Number(longitude),
        })
        toast.success('Филиал создан')
      }
      onSaved()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <AdminModal open={open} title={branch ? 'Редактировать филиал' : 'Новый филиал'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">Название</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="admin-input" />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-slate-500">Адрес</span>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            className="admin-input"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500">Телефон</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="admin-input"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500">Режим работы</span>
            <input
              value={workingHours}
              onChange={(e) => setWorkingHours(e.target.value)}
              required
              className="admin-input"
            />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500">Широта</span>
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              required={!branch}
              className="admin-input"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-slate-500">Долгота</span>
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              required={!branch}
              className="admin-input"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-2 rounded-lg bg-brand-500 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>
    </AdminModal>
  )
}
