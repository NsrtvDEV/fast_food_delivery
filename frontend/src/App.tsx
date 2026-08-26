import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import HomePage from './pages/HomePage'
import CartPage from './pages/CartPage'
import OrdersPage from './pages/OrdersPage'
import ProfilePage from './pages/ProfilePage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import AdminMenuPage from './pages/AdminMenuPage'
import AdminSettingsPage from './pages/AdminSettingsPage'
import AdminOrdersPage from './pages/AdminOrdersPage'
import AdminDeliveryPage from './pages/AdminDeliveryPage'
import AdminPromotionsPage from './pages/AdminPromotionsPage'
import AdminReviewsPage from './pages/AdminReviewsPage'
import AdminAnalyticsPage from './pages/AdminAnalyticsPage'
import { ProtectedRoute } from './components/ProtectedRoute'
import { AdminRoute } from './components/AdminRoute'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cart"
          element={
            <ProtectedRoute>
              <CartPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <OrdersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboardPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/menu"
          element={
            <AdminRoute>
              <AdminMenuPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminRoute>
              <AdminSettingsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminRoute>
              <AdminOrdersPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/delivery"
          element={
            <AdminRoute>
              <AdminDeliveryPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/promotions"
          element={
            <AdminRoute>
              <AdminPromotionsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/reviews"
          element={
            <AdminRoute>
              <AdminReviewsPage />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <AdminRoute>
              <AdminAnalyticsPage />
            </AdminRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
