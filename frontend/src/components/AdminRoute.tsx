import { type ReactNode, useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { authApi } from '../api/client'
import { useAuthStore } from '../store/auth'

export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user, setUser, logout } = useAuthStore()
  const [checking, setChecking] = useState(user?.is_staff === undefined)

  useEffect(() => {
    if (!isAuthenticated || user?.is_staff !== undefined) return
    authApi
      .me()
      .then(setUser)
      .catch(() => logout())
      .finally(() => setChecking(false))
  }, [isAuthenticated, user, setUser, logout])

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (checking) {
    return null
  }

  if (!(user?.is_staff || user?.is_superuser)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
