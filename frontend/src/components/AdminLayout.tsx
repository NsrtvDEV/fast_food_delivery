import { type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Hamburger,
  ChevronDown,
  LayoutGrid,
  ClipboardList,
  Truck,
  Star,
  Tag,
  BarChart3,
  Settings,
  Bell,
  LogOut,
} from 'lucide-react'
import { useAuthStore } from '../store/auth'

const NAV_ITEMS = [
  { label: 'Dashboard', icon: LayoutGrid, path: '/admin' },
  { label: 'Menu', icon: Hamburger, path: '/admin/menu' },
  { label: 'Orders', icon: ClipboardList, path: '/admin/orders' },
  { label: 'Delivery', icon: Truck, path: '/admin/delivery' },
  { label: 'Reviews', icon: Star, path: '/admin/reviews' },
  { label: 'Promotions', icon: Tag, path: '/admin/promotions' },
  { label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
  { label: 'Settings', icon: Settings, path: '/admin/settings' },
]

export function AdminLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  const initials =
    `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.trim() ||
    user?.email?.[0]?.toUpperCase() ||
    'A'

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex items-center gap-6 px-6 py-3">
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
              <Hamburger className="h-4.5 w-4.5" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-slate-900">Foodify</span>
          </div>

          <button
            type="button"
            className="flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Main Branch
            <ChevronDown className="h-3.5 w-3.5" />
          </button>

          <nav className="flex flex-1 items-center gap-1 overflow-x-auto">
            {NAV_ITEMS.map((item) => {
              const isActive = item.path === location.pathname
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    if (item.path) navigate(item.path)
                    else toast('Раздел в разработке')
                  }}
                  className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold transition-colors ${
                    isActive
                      ? 'border-brand-500 text-brand-600'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </button>
              )
            })}
          </nav>

          <button
            type="button"
            className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
          >
            <Bell className="h-4.5 w-4.5" />
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="flex shrink-0 items-center gap-2 rounded-lg py-1.5 pl-1 pr-2 hover:bg-slate-100"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
              {initials}
            </div>
            <span className="text-sm font-semibold text-slate-700">
              {user?.first_name || 'Admin'}
            </span>
            <LogOut className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </header>

      <main className="p-6">{children}</main>
    </div>
  )
}
