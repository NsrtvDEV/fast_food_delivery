import axios from 'axios'
import { useAuthStore } from '../store/auth'

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
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

  async me(): Promise<UserProfile> {
    try {
      const res = await api.get('/users/me')
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось получить профиль'))
    }
  },

  async updateProfile(data: {
    first_name?: string
    last_name?: string
    email?: string
    phone?: string
  }): Promise<UserProfile> {
    try {
      const res = await api.put('/users/me/update/', data)
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось обновить профиль'))
    }
  },

  async changePassword(currentPassword: string, newPassword: string, newPassword2: string) {
    try {
      await api.post('/users/me/change-password/', {
        current_password: currentPassword,
        new_password: newPassword,
        new_password2: newPassword2,
      })
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось изменить пароль'))
    }
  },
}

export interface UserProfile {
  id: number
  email: string | null
  first_name: string | null
  last_name: string | null
  phone: string | null
  is_active: boolean
  is_staff: boolean
  is_courier: boolean
  is_superuser: boolean
  is_deleted: boolean
  telegram_linked: boolean
}

export interface Category {
  id: number
  name: string
}

export interface Product {
  id: number
  category_id: number
  image_id: number | null
  discount_id: number | null
  name: string
  description: string
  price: number
  final_price: number
  is_active: boolean
  average_rating: number | null
  review_count: number
}

export const catalogApi = {
  async categories(): Promise<Category[]> {
    try {
      const res = await api.get('/category/list/')
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось загрузить категории'))
    }
  },

  async products(search?: string): Promise<Product[]> {
    try {
      const res = await api.get('/products/list/', { params: search ? { search } : {} })
      return res.data
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return []
      }
      throw new Error(extractErrorMessage(error, 'Не удалось загрузить товары'))
    }
  },

  productImageUrl(imageId: number): string {
    return `${API_BASE_URL}/products/image/${imageId}`
  },

  async allProducts(): Promise<Product[]> {
    try {
      const res = await api.get('/products/admin/list/')
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось загрузить товары'))
    }
  },

  async createProduct(data: {
    category_id: number
    name: string
    description: string
    price: number
    image: File
  }) {
    try {
      const form = new FormData()
      form.append('category_id', String(data.category_id))
      form.append('name', data.name)
      form.append('description', data.description)
      form.append('price', String(data.price))
      form.append('image', data.image)
      const res = await api.post('/products/create', form)
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось создать товар'))
    }
  },

  async updateProduct(
    id: number,
    data: Partial<{
      category_id: number
      name: string
      description: string
      price: number
      is_active: boolean
      discount_id: number | null
    }>,
  ) {
    try {
      const res = await api.put(`/products/${id}`, data)
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось обновить товар'))
    }
  },

  async updateProductImage(id: number, image: File) {
    try {
      const form = new FormData()
      form.append('image', image)
      const res = await api.put(`/products/${id}/image`, form)
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось обновить фото'))
    }
  },

  async deleteProduct(id: number) {
    try {
      await api.delete(`/products/${id}/`)
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось удалить товар'))
    }
  },

  async createCategory(name: string): Promise<Category> {
    try {
      const res = await api.post('/category/create', { name })
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось создать категорию'))
    }
  },

  async deleteCategory(id: number) {
    try {
      await api.delete(`/category/${id}`)
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось удалить категорию'))
    }
  },
}

export interface CartProduct {
  id: number
  name: string
  description: string
  price: number
  image_id: number | null
}

export interface CartItem {
  id: number
  product: CartProduct
  quantity: number
  price: number
  subtotal: number
  created_at: string
}

export interface CartData {
  id: number
  user_id: number
  total_price: number
  items: CartItem[]
  created_at: string
  updated_at: string
}

export const cartApi = {
  async addItem(productId: number, quantity = 1): Promise<{ cart: CartData }> {
    try {
      const res = await api.post('/cart/items', { items: [{ product_id: productId, quantity }] })
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось добавить в корзину'))
    }
  },

  async get(): Promise<CartData> {
    try {
      const res = await api.get('/cart/mine')
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось загрузить корзину'))
    }
  },

  async updateItem(itemId: number, quantity: number): Promise<CartData> {
    try {
      const res = await api.patch(`/cart/items/${itemId}`, { quantity })
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось обновить корзину'))
    }
  },

  async removeItem(itemId: number): Promise<CartData> {
    try {
      const res = await api.delete(`/cart/items/${itemId}`)
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось удалить товар'))
    }
  },

  async clear(): Promise<CartData> {
    try {
      const res = await api.delete('/cart')
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось очистить корзину'))
    }
  },
}

export function cartItemCount(cart: CartData): number {
  return cart.items.reduce((sum, item) => sum + item.quantity, 0)
}

export interface RecentOrder {
  id: number
  customer_name: string
  items_summary: string
  status: string
  created_at: string
  total_price: number
}

export interface DeliveryPerformance {
  on_time_rate: number | null
  early: number
  on_time: number
  late: number
}

export interface DailyRevenue {
  date: string
  revenue: number
}

export interface TopSellingProduct {
  id: number
  name: string
  image_id: number | null
  orders_count: number
  revenue: number
}

export interface DashboardData {
  orders_today: number
  orders_change_pct: number | null
  out_for_delivery: number
  avg_delivery_minutes: number | null
  revenue_today: number
  revenue_change_pct: number | null
  delivery_performance: DeliveryPerformance
  recent_orders: RecentOrder[]
  weekly_revenue: DailyRevenue[]
  top_selling: TopSellingProduct[]
}

export const adminApi = {
  async dashboard(): Promise<DashboardData> {
    try {
      const res = await api.get('/admin/dashboard/')
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось загрузить дашборд'))
    }
  },
}

export interface Address {
  id: number
  location_name: string
  latitude: number
  longitude: number
}

export const addressApi = {
  async list(): Promise<Address[]> {
    try {
      const res = await api.get('/address/list/')
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось загрузить адреса'))
    }
  },

  async create(latitude: number, longitude: number): Promise<Address> {
    try {
      const res = await api.post('/address/create', {
        location_name: '',
        latitude,
        longitude,
      })
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось определить адрес'))
    }
  },

  async remove(id: number) {
    try {
      await api.delete(`/address/${id}`)
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось удалить адрес'))
    }
  },
}

export interface SiteSettings {
  about_title: string | null
  about_text: string | null
  contact_phone: string | null
  contact_email: string | null
  contact_address: string | null
  contact_hours: string | null
}

export const settingsApi = {
  async get(): Promise<SiteSettings> {
    try {
      const res = await api.get('/settings/')
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось загрузить настройки'))
    }
  },

  async update(data: Partial<SiteSettings>): Promise<SiteSettings> {
    try {
      const res = await api.put('/settings/', data)
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось сохранить настройки'))
    }
  },
}

export interface AdminOrder {
  id: number
  customer_name: string
  customer_contact: string
  items_summary: string
  branch_address: string | null
  status: string
  total_price: number
  created_at: string
}

export const VALID_ORDER_TRANSITIONS: Record<string, string[]> = {
  created: ['accepted', 'canceled'],
  accepted: ['cooking', 'canceled'],
  cooking: ['on the way'],
  'on the way': ['delivered'],
  delivered: [],
  canceled: [],
}

export interface CreatedOrder {
  id: number
  total_price: number
}

export interface CustomerOrderItem {
  id: number
  product_id: number
  product_name: string
  image_id: number | null
  quantity: number
  price: number
}

export interface OrderStatusHistoryEntry {
  to_status: string
  created_at: string
}

export interface CustomerOrder {
  id: number
  status: string
  total_price: number
  created_at: string
  branch_name: string | null
  branch_address: string | null
  address_name: string | null
  items: CustomerOrderItem[]
  status_history: OrderStatusHistoryEntry[]
}

export const ordersApi = {
  async myList(): Promise<CustomerOrder[]> {
    try {
      const res = await api.get('/orders/list')
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось загрузить заказы'))
    }
  },

  async adminList(): Promise<AdminOrder[]> {
    try {
      const res = await api.get('/orders/admin/list')
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось загрузить заказы'))
    }
  },

  async transition(orderId: number, toStatus: string) {
    try {
      const res = await api.post(`/orders/${orderId}/transitions`, { to_status: toStatus })
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось изменить статус'))
    }
  },

  async create(branchId: number, addressId: number, promocode?: string): Promise<CreatedOrder> {
    try {
      const res = await api.post('/orders/create', {
        branch_id: branchId,
        address_id: addressId,
        promocode: promocode || undefined,
      })
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось оформить заказ'))
    }
  },
}

export interface AdminDelivery {
  delivery_id: number
  order_id: number
  order_status: string
  customer_name: string
  courier_name: string | null
  branch_name: string | null
  total_price: number
  assigned_at: string | null
}

export interface Branch {
  id: number
  name: string | null
  address: string
  working_hours: string
  branch_phone: string
  latitude: number | null
  longitude: number | null
}

export const deliveryApi = {
  async activeAdmin(): Promise<AdminDelivery[]> {
    try {
      const res = await api.get('/delivery/admin/active')
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось загрузить доставки'))
    }
  },
}

export const branchApi = {
  async list(): Promise<Branch[]> {
    try {
      const res = await api.get('/branches/all')
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось загрузить филиалы'))
    }
  },

  async create(data: {
    name: string
    address: string
    working_hours: string
    phone: string
    latitude: number
    longitude: number
  }): Promise<Branch> {
    try {
      const res = await api.post('/branches/create', data)
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось создать филиал'))
    }
  },

  async update(
    id: number,
    data: Partial<{
      name: string
      address: string
      working_hours: string
      phone: string
      latitude: number
      longitude: number
    }>,
  ): Promise<Branch> {
    try {
      const res = await api.patch('/branches/update', { id, ...data })
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось обновить филиал'))
    }
  },

  async remove(id: number) {
    try {
      await api.delete(`/branches/delete/${id}`)
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось удалить филиал'))
    }
  },
}

export interface Promocode {
  id: number
  code: string
  discount_percentage: number
  max_uses: number
  used_count: number
  is_active: boolean
}

export const promocodeApi = {
  async list(): Promise<Promocode[]> {
    try {
      const res = await api.get('/promocodes/list/')
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось загрузить промокоды'))
    }
  },

  async create(data: {
    code: string
    discount_percentage: number
    max_uses: number
    is_active: boolean
  }): Promise<Promocode> {
    try {
      const res = await api.post('/promocodes/', data)
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось создать промокод'))
    }
  },

  async remove(id: number) {
    try {
      await api.delete(`/promocodes/delete/${id}`)
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось удалить промокод'))
    }
  },
}

export interface Discount {
  id: number
  name: string | null
  discount_type: string
  value: number
  start_date: string
  end_date: string
  is_active: boolean
}

export const discountApi = {
  async list(): Promise<Discount[]> {
    try {
      const res = await api.get('/discounts/list')
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось загрузить скидки'))
    }
  },

  async create(data: {
    name: string
    discount_type: string
    value: number
    start_date: string
    end_date: string
    is_active: boolean
  }): Promise<Discount> {
    try {
      const res = await api.post('/discounts/create', data)
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось создать скидку'))
    }
  },

  async remove(id: number) {
    try {
      await api.delete(`/discounts/${id}`)
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось удалить скидку'))
    }
  },
}

export interface Review {
  id: number
  product_id: number
  product_name: string
  customer_name: string
  rating: number
  comment: string | null
  is_hidden: boolean
  created_at: string
}

export interface ProductRatingSummary {
  average_rating: number | null
  review_count: number
}

export const reviewApi = {
  async create(data: { product_id: number; rating: number; comment?: string }): Promise<Review> {
    try {
      const res = await api.post('/reviews/', data)
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось оставить отзыв'))
    }
  },

  async forProduct(productId: number): Promise<Review[]> {
    try {
      const res = await api.get(`/reviews/product/${productId}`)
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось загрузить отзывы'))
    }
  },

  async summary(productId: number): Promise<ProductRatingSummary> {
    try {
      const res = await api.get(`/reviews/product/${productId}/summary`)
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось загрузить рейтинг'))
    }
  },

  async adminList(): Promise<Review[]> {
    try {
      const res = await api.get('/reviews/admin/list')
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось загрузить отзывы'))
    }
  },

  async toggleVisibility(id: number): Promise<Review> {
    try {
      const res = await api.patch(`/reviews/${id}/toggle-visibility`)
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось изменить видимость'))
    }
  },

  async remove(id: number) {
    try {
      await api.delete(`/reviews/${id}`)
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось удалить отзыв'))
    }
  },
}

export interface DailyRevenuePoint {
  date: string
  revenue: number
  orders_count: number
}

export interface StatusBreakdownItem {
  status: string
  count: number
}

export interface TopProductItem {
  id: number
  name: string
  image_id: number | null
  orders_count: number
  revenue: number
}

export interface CategoryPerformanceItem {
  category_id: number
  category_name: string
  revenue: number
  orders_count: number
}

export interface AnalyticsData {
  total_revenue: number
  total_orders: number
  average_order_value: number
  average_rating: number | null
  revenue_trend: DailyRevenuePoint[]
  status_breakdown: StatusBreakdownItem[]
  top_products: TopProductItem[]
  category_performance: CategoryPerformanceItem[]
}

export const analyticsApi = {
  async get(): Promise<AnalyticsData> {
    try {
      const res = await api.get('/admin/analytics/')
      return res.data
    } catch (error) {
      throw new Error(extractErrorMessage(error, 'Не удалось загрузить аналитику'))
    }
  },
}
