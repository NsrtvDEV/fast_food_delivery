import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Truck, ShieldCheck, Gift, UtensilsCrossed } from 'lucide-react'
import { toast } from 'sonner'
import { Navbar } from '../components/Navbar'
import { ProductCard } from '../components/ProductCard'
import { CategoryPill } from '../components/CategoryPill'
import { catalogApi, authApi, cartApi, type Category, type Product } from '../api/client'
import { useAuthStore } from '../store/auth'
import { useCartStore } from '../store/cart'
import { getCategoryIcon } from '../lib/categoryIcons'
import heroBurger from '../assets/hero-burger.jpg'

const FEATURES = [
  { icon: Truck, title: 'Быстрая доставка', text: 'В среднем 30 минут' },
  { icon: ShieldCheck, title: 'Лучшее качество', text: 'Только свежие продукты' },
  { icon: Gift, title: 'Бесплатная доставка', text: 'При заказе от 100 000 сум' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { user, setUser, logout } = useAuthStore()
  const addOne = useCartStore((s) => s.addOne)

  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<number | null>(null)
  const [addingId, setAddingId] = useState<number | null>(null)

  useEffect(() => {
    if (user) return
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        toast.error('Сессия истекла, войдите заново')
        logout()
        navigate('/login')
      })
  }, [user, setUser, navigate, logout])

  useEffect(() => {
    Promise.all([catalogApi.categories(), catalogApi.products()])
      .then(([cats, prods]) => {
        setCategories(cats)
        setProducts(prods)
      })
      .catch((err) => toast.error((err as Error).message))
      .finally(() => setLoading(false))
  }, [])

  const categoryById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories])

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (activeCategory && p.category_id !== activeCategory) return false
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [products, activeCategory, search])

  async function handleAdd(productId: number) {
    setAddingId(productId)
    try {
      await cartApi.addItem(productId)
      addOne()
      toast.success('Добавлено в корзину')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="min-h-screen bg-cream-100">
      <Navbar search={search} onSearchChange={setSearch} />

      <section className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-white to-brand-50 p-8 ring-1 ring-ink-100 lg:grid-cols-2 lg:p-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-bold uppercase tracking-widest text-brand-500">
              Привет{user?.first_name ? `, ${user.first_name}` : ''} 👋
            </p>
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.1] text-ink-900 sm:text-5xl">
              Твоя любимая еда, <span className="text-brand-500">доставим быстро</span>
            </h1>
            <p className="mt-4 max-w-md text-ink-500">
              Свежие бургеры, шаурма, пицца и многое другое — из ближайшего филиала Foodify
              прямо к твоей двери.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative mx-auto w-full max-w-sm"
          >
            <div className="absolute inset-0 m-auto h-56 w-56 rounded-full bg-brand-300/40 blur-2xl" />
            <img
              src={heroBurger}
              alt="Сочный чизбургер"
              className="relative aspect-square w-full rounded-full object-cover shadow-2xl"
            />
          </motion.div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex items-center gap-4 rounded-2xl bg-white p-5 ring-1 ring-ink-100"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
                <f.icon className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-ink-900">{f.title}</p>
                <p className="text-xs text-ink-500">{f.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-xl font-extrabold text-ink-900">Категории</h2>
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
          <CategoryPill
            label="Все"
            icon={UtensilsCrossed}
            active={activeCategory === null}
            onClick={() => setActiveCategory(null)}
          />
          {categories.map((c) => (
            <CategoryPill
              key={c.id}
              label={c.name}
              icon={getCategoryIcon(c.name)}
              active={activeCategory === c.id}
              onClick={() => setActiveCategory(c.id)}
            />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <h2 className="mb-4 text-xl font-extrabold text-ink-900">
          {activeCategory ? categoryById.get(activeCategory)?.name : 'Все блюда'}
        </h2>

        {loading ? (
          <p className="text-ink-500">Загрузка меню...</p>
        ) : filteredProducts.length === 0 ? (
          <p className="text-ink-500">Ничего не найдено</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                category={categoryById.get(p.category_id)}
                onAdd={() => handleAdd(p.id)}
                adding={addingId === p.id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
