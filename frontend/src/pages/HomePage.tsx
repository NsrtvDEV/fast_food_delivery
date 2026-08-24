import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, Hamburger } from 'lucide-react'
import { toast } from 'sonner'
import { authApi } from '../api/client'
import { useAuthStore } from '../store/auth'
import { Button } from '../components/Button'

export default function HomePage() {
  const navigate = useNavigate()
  const { user, setUser, logout } = useAuthStore()
  const [loading, setLoading] = useState(!user)

  useEffect(() => {
    if (user) {
      return
    }
    authApi
      .me()
      .then(setUser)
      .catch(() => {
        toast.error('Сессия истекла, войдите заново')
        logout()
        navigate('/login')
      })
      .finally(() => setLoading(false))
  }, [user, setUser, logout, navigate])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen flex-col bg-cream-100">
      <header className="flex items-center justify-between border-b border-ink-100 bg-white px-6 py-4 lg:px-10">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
            <Hamburger className="h-4.5 w-4.5" strokeWidth={2.5} />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-ink-900">Foodify</span>
        </div>
        <Button variant="ghost" onClick={handleLogout} className="py-2.5">
          <LogOut className="h-4 w-4" />
          Выйти
        </Button>
      </header>

      <main className="flex flex-1 items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center"
        >
          {loading ? (
            <p className="text-ink-500">Загрузка профиля...</p>
          ) : (
            <>
              <p className="text-sm font-semibold uppercase tracking-wider text-brand-500">
                Вы вошли в систему
              </p>
              <h1 className="mt-2 text-3xl font-extrabold text-ink-900">
                Добро пожаловать{user?.first_name ? `, ${user.first_name}` : ''}! 👋
              </h1>
              <p className="mt-3 text-ink-500">{user?.email ?? user?.phone}</p>
              <p className="mt-8 text-sm text-ink-400">
                Каталог, корзина и оформление заказа — на следующем шаге.
              </p>
            </>
          )}
        </motion.div>
      </main>
    </div>
  )
}
