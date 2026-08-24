import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { AuthLayout } from '../components/AuthLayout'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { authApi } from '../api/client'
import { useAuthStore } from '../store/auth'

type Method = 'email' | 'phone'

export default function LoginPage() {
  const navigate = useNavigate()
  const setTokens = useAuthStore((s) => s.setTokens)

  const [method, setMethod] = useState<Method>('email')
  const [loading, setLoading] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  // email method
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // phone method
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)

  async function handleEmailLogin(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const tokens = await authApi.login(email, password)
      setTokens(tokens.access_token, tokens.refresh_token)
      toast.success('Добро пожаловать!')
      navigate('/')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRequestCode(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.requestPhoneCode(phone)
      setCodeSent(true)
      toast.success('Код отправлен в Telegram')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  async function handleVerifyCode(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const tokens = await authApi.verifyPhoneCode(phone, code)
      setTokens(tokens.access_token, tokens.refresh_token)
      toast.success('Добро пожаловать!')
      navigate('/')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      heading="С возвращением,"
      highlight="Вход"
      subtitle="Введите свои данные, чтобы войти в аккаунт"
    >
      <div className="mb-6 flex rounded-2xl bg-ink-100/70 p-1">
        <button
          type="button"
          onClick={() => setMethod('email')}
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
            method === 'email' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'
          }`}
        >
          Email
        </button>
        <button
          type="button"
          onClick={() => setMethod('phone')}
          className={`flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all ${
            method === 'phone' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'
          }`}
        >
          Телефон
        </button>
      </div>

      <AnimatePresence mode="wait">
        {method === 'email' ? (
          <motion.form
            key="email"
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 8 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleEmailLogin}
            className="flex flex-col gap-4"
          >
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Пароль"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <div className="flex items-center justify-between pt-1">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-ink-300 text-brand-500 accent-brand-500 focus:ring-brand-300"
                />
                Запомнить меня
              </label>
              <button
                type="button"
                onClick={() => toast('Восстановление пароля скоро появится')}
                className="text-sm font-semibold text-brand-500 hover:text-brand-600"
              >
                Забыли пароль?
              </button>
            </div>

            <Button type="submit" loading={loading} className="mt-2 w-full">
              Войти
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.form>
        ) : !codeSent ? (
          <motion.form
            key="phone"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleRequestCode}
            className="flex flex-col gap-4"
          >
            <Input
              label="Номер телефона"
              type="tel"
              placeholder="+998 90 123 45 67"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <p className="text-xs leading-relaxed text-ink-500">
              Номер должен быть привязан к нашему Telegram-боту. Откройте бота и поделитесь
              контактом, если ещё не привязали.
            </p>
            <Button type="submit" loading={loading} className="mt-2 w-full">
              Получить код в Telegram
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.form>
        ) : (
          <motion.form
            key="code"
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            onSubmit={handleVerifyCode}
            className="flex flex-col gap-4"
          >
            <Input
              label="Код из Telegram"
              type="text"
              inputMode="numeric"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
            />
            <Button type="submit" loading={loading} className="mt-2 w-full">
              Подтвердить и войти
              <ArrowRight className="h-4 w-4" />
            </Button>
            <button
              type="button"
              onClick={() => setCodeSent(false)}
              className="text-center text-xs font-medium text-ink-400 hover:text-ink-600"
            >
              Изменить номер телефона
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <p className="mt-8 text-center text-sm text-ink-500">
        Нет аккаунта?{' '}
        <Link to="/register" className="font-semibold text-brand-500 hover:text-brand-600">
          Зарегистрироваться
        </Link>
      </p>
    </AuthLayout>
  )
}
