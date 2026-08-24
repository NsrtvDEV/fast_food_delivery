import axios from 'axios'
import { useAuthStore } from '../store/auth'

export const API_BASE_URL = 'http://127.0.0.1:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refreshToken = useAuthStore.getState().refreshToken
      if (!refreshToken) {
        useAuthStore.getState().logout()
        return Promise.reject(error)
      }

      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${API_BASE_URL}/auth/refresh`, { refresh_token: refreshToken })
          .then((res) => {
            const newAccessToken = res.data.access_token as string
            useAuthStore.getState().setAccessToken(newAccessToken)
            return newAccessToken
          })
          .catch(() => {
            useAuthStore.getState().logout()
            return null
          })
          .finally(() => {
            refreshPromise = null
          })
      }

      const newAccessToken = await refreshPromise
      if (newAccessToken) {
        original.headers.Authorization = `Bearer ${newAccessToken}`
        return api(original)
      }
    }
    return Promise.reject(error)
  },
)

function extractErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
  }
  return fallback
}

export interface TokenPair {
  access_token: string
  refresh_token: string
}

export const authApi = {
  async register(email: string, password: string, password2: string) {
    try {
      await api.post('/auth/register/', { email, password, password2 })
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось зарегистрироваться'))
    }
  },

  async verifyEmail(code: string) {
    try {
      const res = await api.post(`/auth/register/verify/${encodeURIComponent(code)}`)
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Неверный код подтверждения'))
    }
  },

  async login(email: string, password: string): Promise<TokenPair> {
    try {
      const res = await api.post('/auth/login', { email, password })
      return { access_token: res.data.access_token, refresh_token: res.data.refresh_token }
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось войти'))
    }
  },

  async requestPhoneCode(phone: string) {
    try {
      await api.post('/auth/phone/request-code', { phone })
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось отправить код'))
    }
  },

  async verifyPhoneCode(phone: string, code: string): Promise<TokenPair> {
    try {
      const res = await api.post('/auth/phone/verify', { phone, code })
      return { access_token: res.data.access_token, refresh_token: res.data.refresh_token }
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Неверный код'))
    }
  },

  async me() {
    try {
      const res = await api.get('/users/me')
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось получить профиль'))
    }
  },
}
