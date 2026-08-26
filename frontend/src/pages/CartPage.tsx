import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Minus, Plus, Trash2, ShoppingCart, MapPin, Store, Tag, LocateFixed } from 'lucide-react'
import { Navbar } from '../components/Navbar'
import { AddressBar } from '../components/AddressBar'
import { geolocationErrorMessage } from '../lib/geolocation'
import {
  cartApi,
  branchApi,
  addressApi,
  ordersApi,
  catalogApi,
  cartItemCount,
  type CartData,
  type Branch,
  type Address,
} from '../api/client'
import { useCartStore } from '../store/cart'

export default function CartPage() {
  const navigate = useNavigate()
  const setCartCount = useCartStore((s) => s.setCount)

  const [cart, setCart] = useState<CartData | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyItemId, setBusyItemId] = useState<number | null>(null)

  const [branches, setBranches] = useState<Branch[]>([])
  const [branchId, setBranchId] = useState<number | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [addressId, setAddressId] = useState<number | null>(null)
  const [locating, setLocating] = useState(false)
  const [promocode, setPromocode] = useState('')
  const [placingOrder, setPlacingOrder] = useState(false)

  function loadCart() {
    return cartApi
      .get()
      .then((data) => {
        setCart(data)
        setCartCount(cartItemCount(data))
      })
      .catch((err) => toast.error((err as Error).message))
  }

  useEffect(() => {
    setLoading(true)
    Promise.all([loadCart(), branchApi.list().then(setBranches), addressApi.list().then(setAddresses)])
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (branches.length > 0 && branchId === null) {
      setBranchId(branches[0].id)
    }
  }, [branches, branchId])

  useEffect(() => {
    if (addresses.length > 0 && (addressId === null || !addresses.some((a) => a.id === addressId))) {
      setAddressId(addresses[0].id)
    }
    if (addresses.length === 0) {
      setAddressId(null)
    }
  }, [addresses, addressId])

  function handleAddAddress() {
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
          setAddressId(created.id)
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

  const total = useMemo(() => cart?.total_price ?? 0, [cart])

  async function handleQuantityChange(itemId: number, nextQuantity: number) {
    setBusyItemId(itemId)
    try {
      const data = await cartApi.updateItem(itemId, nextQuantity)
      setCart(data)
      setCartCount(cartItemCount(data))
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusyItemId(null)
    }
  }

  async function handleRemove(itemId: number) {
    setBusyItemId(itemId)
    try {
      const data = await cartApi.removeItem(itemId)
      setCart(data)
      setCartCount(cartItemCount(data))
      toast.success('Товар удалён из корзины')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setBusyItemId(null)
    }
  }

  async function handleCheckout() {
    if (!cart || cart.items.length === 0) return
    if (!addressId) {
      toast.error('Сначала укажите адрес доставки')
      return
    }
    if (!branchId) {
      toast.error('Выберите филиал')
      return
    }
    setPlacingOrder(true)
    try {
      const order = await ordersApi.create(branchId, addressId, promocode.trim() || undefined)
      toast.success(`Заказ #${order.id} оформлен на ${order.total_price.toLocaleString('ru-RU')} сум`)
      setCartCount(0)
      navigate('/orders')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setPlacingOrder(false)
    }
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar search="" onSearchChange={() => {}} />

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <h1 className="mb-6 flex items-center gap-2 text-2xl font-extrabold text-ink-900">
          <ShoppingCart className="h-6 w-6 text-brand-500" />
          Корзина
        </h1>

        {loading ? (
          <p className="text-ink-500">Загрузка корзины...</p>
        ) : !cart || cart.items.length === 0 ? (
          <div className="rounded-2xl bg-white p-10 text-center ring-1 ring-ink-100">
            <ShoppingCart className="mx-auto h-12 w-12 text-ink-200" />
            <p className="mt-3 font-semibold text-ink-700">Ваша корзина пуста</p>
            <p className="mt-1 text-sm text-ink-400">Добавьте блюда из меню, чтобы оформить заказ</p>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="mt-5 rounded-full bg-brand-500 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-600"
            >
              Перейти в меню
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-3 lg:col-span-2">
              {cart.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-2xl bg-white p-4 ring-1 ring-ink-100"
                >
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink-50">
                    {item.product.image_id && (
                      <img
                        src={catalogApi.productImageUrl(item.product.image_id)}
                        alt={item.product.name}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-bold text-ink-900">{item.product.name}</p>
                    <p className="text-sm text-ink-400">
                      {item.price.toLocaleString('ru-RU')} сум / шт
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2 rounded-full bg-ink-50 p-1">
                    <button
                      type="button"
                      disabled={busyItemId === item.id}
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink-600 shadow-sm hover:bg-ink-100 disabled:opacity-50"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-5 text-center text-sm font-bold text-ink-900">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      disabled={busyItemId === item.id}
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-ink-600 shadow-sm hover:bg-ink-100 disabled:opacity-50"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <p className="w-24 shrink-0 text-right font-extrabold text-ink-900">
                    {item.subtotal.toLocaleString('ru-RU')}
                  </p>

                  <button
                    type="button"
                    disabled={busyItemId === item.id}
                    onClick={() => handleRemove(item.id)}
                    className="shrink-0 text-ink-300 hover:text-red-500 disabled:opacity-50"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="h-fit space-y-4 rounded-2xl bg-white p-5 ring-1 ring-ink-100">
              <h2 className="text-base font-bold text-ink-900">Оформление заказа</h2>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                  <MapPin className="h-3.5 w-3.5" />
                  Адрес доставки
                </label>
                {addresses.length === 0 ? (
                  <AddressBar />
                ) : (
                  <>
                    <select
                      value={addressId ?? ''}
                      onChange={(e) => setAddressId(Number(e.target.value))}
                      className="w-full rounded-xl bg-ink-50 px-3 py-2.5 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-brand-200"
                    >
                      {addresses.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.location_name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddAddress}
                      disabled={locating}
                      className="mt-1.5 flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 disabled:opacity-60"
                    >
                      <LocateFixed className="h-3 w-3" />
                      {locating ? 'Определяем...' : 'Добавить текущий адрес'}
                    </button>
                  </>
                )}
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                  <Store className="h-3.5 w-3.5" />
                  Филиал
                </label>
                <select
                  value={branchId ?? ''}
                  onChange={(e) => setBranchId(Number(e.target.value))}
                  className="w-full rounded-xl bg-ink-50 px-3 py-2.5 text-sm text-ink-900 outline-none focus:ring-2 focus:ring-brand-200"
                >
                  {branches.length === 0 && <option value="">Нет доступных филиалов</option>}
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name ?? b.address}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-ink-500">
                  <Tag className="h-3.5 w-3.5" />
                  Промокод
                </label>
                <input
                  type="text"
                  value={promocode}
                  onChange={(e) => setPromocode(e.target.value)}
                  placeholder="Введите код"
                  className="w-full rounded-xl bg-ink-50 px-3 py-2.5 text-sm uppercase text-ink-900 outline-none placeholder:normal-case placeholder:text-ink-400 focus:ring-2 focus:ring-brand-200"
                />
              </div>

              <div className="flex items-center justify-between border-t border-ink-100 pt-3">
                <span className="text-sm font-semibold text-ink-500">Итого</span>
                <span className="text-xl font-extrabold text-ink-900">
                  {total.toLocaleString('ru-RU')} сум
                </span>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={placingOrder}
                className="w-full rounded-full bg-brand-500 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
              >
                {placingOrder ? 'Оформляем...' : 'Оформить заказ'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
