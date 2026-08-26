import { useEffect, useState, type FormEvent } from 'react'
import { toast } from 'sonner'
import { AdminLayout } from '../components/AdminLayout'
import { settingsApi, type SiteSettings } from '../api/client'

const EMPTY: SiteSettings = {
  about_title: '',
  about_text: '',
  contact_phone: '',
  contact_email: '',
  contact_address: '',
  contact_hours: '',
}

export default function AdminSettingsPage() {
  const [form, setForm] = useState<SiteSettings>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    settingsApi
      .get()
      .then((data) =>
        setForm({
          about_title: data.about_title ?? '',
          about_text: data.about_text ?? '',
          contact_phone: data.contact_phone ?? '',
          contact_email: data.contact_email ?? '',
          contact_address: data.contact_address ?? '',
          contact_hours: data.contact_hours ?? '',
        }),
      )
      .catch((err) => toast.error((err as Error).message))
      .finally(() => setLoading(false))
  }, [])

  function set<K extends keyof SiteSettings>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await settingsApi.update(form)
      toast.success('Настройки сохранены')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AdminLayout>
        <p className="text-slate-500">Загрузка...</p>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <form onSubmit={handleSubmit} className="max-w-2xl">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-base font-bold text-slate-900">О нас</h2>
          <div className="flex flex-col gap-3">
            <Field label="Заголовок">
              <input
                value={form.about_title ?? ''}
                onChange={(e) => set('about_title', e.target.value)}
                className="admin-input"
              />
            </Field>
            <Field label="Текст">
              <textarea
                value={form.about_text ?? ''}
                onChange={(e) => set('about_text', e.target.value)}
                rows={4}
                className="admin-input resize-none"
              />
            </Field>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-base font-bold text-slate-900">Контакты</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Телефон">
              <input
                value={form.contact_phone ?? ''}
                onChange={(e) => set('contact_phone', e.target.value)}
                className="admin-input"
              />
            </Field>
            <Field label="Email">
              <input
                value={form.contact_email ?? ''}
                onChange={(e) => set('contact_email', e.target.value)}
                className="admin-input"
              />
            </Field>
            <Field label="Адрес">
              <input
                value={form.contact_address ?? ''}
                onChange={(e) => set('contact_address', e.target.value)}
                className="admin-input"
              />
            </Field>
            <Field label="Режим работы">
              <input
                value={form.contact_hours ?? ''}
                onChange={(e) => set('contact_hours', e.target.value)}
                className="admin-input"
              />
            </Field>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="mt-4 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>
    </AdminLayout>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      {children}
    </label>
  )
}
