import { useNavigate } from 'react-router-dom'
import { Hamburger, Search, ShoppingCart, LogOut } from 'lucide-react'
import { useAuthStore } from '../store/auth'
import { useCartStore } from '../store/cart'

export function Navbar({
  search,
  onSearchChange,
}: {
  search: string
  onSearchChange: (value: string) => void
}) {
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const cartCount = useCartStore((s) => s.count)

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-ink-100 bg-cream-50/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
            <Hamburger className="h-4.5 w-4.5" strokeWidth={2.5} />
          </div>
          <span className="hidden text-lg font-extrabold tracking-tight text-ink-900 sm:inline">
            Foodify
          </span>
        </div>

        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Искать блюда..."
            className="w-full rounded-full bg-ink-100/70 py-2.5 pl-11 pr-4 text-sm text-ink-900 outline-none transition-all placeholder:text-ink-400 focus:bg-white focus:ring-4 focus:ring-brand-100"
          />
        </div>

        <button
          type="button"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-100/70 text-ink-700 transition-colors hover:bg-ink-200"
        >
          <ShoppingCart className="h-4.5 w-4.5" />
          {cartCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-500 px-1 text-[11px] font-bold text-white">
              {cartCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={handleLogout}
          title={user?.email ?? user?.phone ?? 'Выйти'}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ink-100/70 text-ink-700 transition-colors hover:bg-ink-200"
        >
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </header>
  )
}
