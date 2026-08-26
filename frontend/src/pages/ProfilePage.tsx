import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { User as UserIcon, KeyRound, MapPin, Send, LocateFixed, Trash2, Plus } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { geolocationErrorMessage } from '../lib/geolocation'
import {
  authApi,
  addressApi,
  type UserProfile,
  type Address,
} from '../api/client'

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newPassword2, setNewPassword2] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const [addresses, setAddresses] = useState<Address[]>([])
  const [addressesLoading, setAddressesLoading] = useState(true)
  const [locating, setLocating] = useState(false)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  function loadProfile() {
    return authApi.me().then((data) => {
      setProfile(data)
      setFirstName(data.first_name ?? '')
      setLastName(data.last_name ?? '')
      setEmail(data.email ?? '')
      setPhone(data.phone ?? '')
    })
  }

  function loadAddresses() {
    return addressApi.list().then(setAddresses)
  }

  useEffect(() => {
    Promise.all([loadProfile(), loadAddresses()])
      .catch((err) => toast.error((err as Error).message))
      .finally(() => {
        setLoading(false)
        setAddressesLoading(false)
      })
  }, [])

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSavingProfile(true)
    try {
      const updated = await authApi.updateProfile({
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
      })
      setProfile(updated)
      toast.success('Профиль обновлён')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSavingProfile(false)
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setChangingPassword(true)
    try {
      await authApi.changePassword(currentPassword, newPassword, newPassword2)
      toast.success('Пароль изменён')
      setCurrentPassword('')
      setNewPassword('')
      setNewPassword2('')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setChangingPassword(false)
    }
  }

  function handleDetectAddress() {
    if (!navigator.geolocation) {
      toast.error('Геолокация не поддерживается браузером')
      return
    }
    if (!window.isSecureContext) {
      toast.error(
        'Геолокация работает только по HTTPS (или на localhost). Откройте сайт по защищённому адресу.',
      )
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const created = await addressApi.create(
            position.coords.latitude,
            position.coords.longitude,
          )
          setAddresses((prev) => [created, ...prev])
          toast.success('Адрес добавлен')
        } catch (err) {
          toast.error((err as Error).message)
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        toast.error(geolocationErrorMessage(err))
        setLocating(false)
      },
      { timeout: 15000 },
    )
  }

  async function handleDeleteAddress(id: number) {
    setDeletingId(id)
    try {
      await addressApi.remove(id)
      setAddresses((prev) => prev.filter((a) => a.id !== id))
      toast.success('Адрес удалён')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar search="" onSearchChange={() => {}} />

      <section className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-extrabold text-ink-900">
          <UserIcon className="h-6 w-6 text-brand-500" />
          Профиль
        </h1>

        {loading ? (
          <p className="text-ink-500">Загрузка профиля...</p>
        ) : (
          <div className="space-y-6">
            <form
              onSubmit={handleSaveProfile}
              className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-ink-100"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-ink-900">Личные данные</h2>
                <span
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                    profile?.telegram_linked
                      ? 'bg-sky-100 text-sky-700'
                      : 'bg-ink-100 text-ink-400'
                  }`}
                >
                  <Send className="h-3 w-3" />
                  {profile?.telegram_linked ? 'Telegram привязан' : 'Telegram не привязан'}
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Имя">
                  <input
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-xl bg-ink-50 px-3 py-2.5 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </Field>
                <Field label="Фамилия">
                  <input
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-xl bg-ink-50 px-3 py-2.5 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </Field>
                <Field label="Email">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-xl bg-ink-50 px-3 py-2.5 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </Field>
                <Field label="Телефон">
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl bg-ink-50 px-3 py-2.5 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </Field>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="rounded-full bg-brand-500 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
              >
                {savingProfile ? 'Сохраняем...' : 'Сохранить'}
              </button>
            </form>

            <form
              onSubmit={handleChangePassword}
              className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-ink-100"
            >
              <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
                <KeyRound className="h-4.5 w-4.5 text-brand-500" />
                Сменить пароль
              </h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <Field label="Текущий пароль">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-xl bg-ink-50 px-3 py-2.5 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </Field>
                <Field label="Новый пароль">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-xl bg-ink-50 px-3 py-2.5 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </Field>
                <Field label="Повторите пароль">
                  <input
                    type="password"
                    value={newPassword2}
                    onChange={(e) => setNewPassword2(e.target.value)}
                    className="w-full rounded-xl bg-ink-50 px-3 py-2.5 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-brand-200"
                  />
                </Field>
              </div>

              <button
                type="submit"
                disabled={changingPassword || !currentPassword || !newPassword}
                className="rounded-full bg-ink-900 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-ink-800 disabled:opacity-60"
              >
                {changingPassword ? 'Меняем...' : 'Изменить пароль'}
              </button>
            </form>

            <div className="space-y-4 rounded-2xl bg-white p-5 ring-1 ring-ink-100">
              <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-bold text-ink-900">
                  <MapPin className="h-4.5 w-4.5 text-brand-500" />
                  Мои адреса
                </h2>
                <button
                  type="button"
                  onClick={handleDetectAddress}
                  disabled={locating}
                  className="flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-600 hover:bg-brand-100 disabled:opacity-60"
                >
                  {locating ? (
                    <LocateFixed className="h-3.5 w-3.5 animate-pulse" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  {locating ? 'Определяем...' : 'Добавить текущий адрес'}
                </button>
              </div>

              {addressesLoading ? (
                <p className="text-sm text-ink-400">Загрузка адресов...</p>
              ) : addresses.length === 0 ? (
                <p className="text-sm text-ink-400">Адресов пока нет</p>
              ) : (
                <div className="space-y-2">
                  {addresses.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-center gap-3 rounded-xl bg-ink-50 px-3 py-2.5"
                    >
                      <MapPin className="h-4 w-4 shrink-0 text-ink-400" />
                      <span className="min-w-0 flex-1 truncate text-sm text-ink-700">
                        {a.location_name}
                      </span>
                      <button
                        type="button"
                        disabled={deletingId === a.id}
                        onClick={() => handleDeleteAddress(a.id)}
                        className="shrink-0 text-ink-300 hover:text-red-500 disabled:opacity-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-ink-500">{label}</span>
      {children}
    </label>
  )
}
