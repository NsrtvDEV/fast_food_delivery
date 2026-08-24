import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { toast } from 'sonner'
import { AuthLayout } from '../components/AuthLayout'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { authApi } from '../api/client'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [errors, setErrors] = useState<{ password2?: string }>({})

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setErrors({})

    if (password.length < 8) {
      toast.error('Пароль должен быть не короче 8 символов')
      return
    }
    if (password !== password2) {
      setErrors({ password2: 'Пароли не совпадают' })
      return
    }

    setLoading(true)
    try {
      await authApi.register(email, password, password2)
      toast.success('Код подтверждения отправлен на почту')
      navigate('/verify-email', { state: { email } })
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout
      heading="Создать"
      highlight="аккаунт"
      subtitle="Пара шагов — и можно заказывать любимую еду"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          placeholder="Минимум 8 символов"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        <Input
          label="Повторите пароль"
          type="password"
          placeholder="••••••••"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
          error={errors.password2}
          required
        />
        <Button type="submit" loading={loading} className="mt-2 w-full">
          Зарегистрироваться
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-500">
        Уже есть аккаунт?{' '}
        <Link to="/login" className="font-semibold text-brand-500 hover:text-brand-600">
          Войти
        </Link>
      </p>
    </AuthLayout>
  )
}
