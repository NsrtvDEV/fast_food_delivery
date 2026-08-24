import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { KeyRound, ArrowRight, MailCheck } from 'lucide-react'
import { toast } from 'sonner'
import { AuthLayout } from '../components/AuthLayout'
import { Input } from '../components/Input'
import { Button } from '../components/Button'
import { authApi } from '../api/client'

export default function VerifyEmailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const email = (location.state as { email?: string } | null)?.email

  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await authApi.verifyEmail(code.trim())
      toast.success('Аккаунт подтверждён! Теперь можно войти.')
      navigate('/login')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Подтвердите email" subtitle="Введите код, который мы отправили вам на почту">
      {email && (
        <div className="mb-6 flex items-center gap-2.5 rounded-2xl bg-brand-50 px-4 py-3 text-sm text-brand-700">
          <MailCheck className="h-4 w-4 shrink-0" />
          <span>
            Код отправлен на <span className="font-semibold">{email}</span>
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Код подтверждения"
          type="text"
          icon={<KeyRound className="h-4 w-4" />}
          placeholder="Введите код из письма"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          required
        />
        <Button type="submit" loading={loading} className="mt-2 w-full">
          Подтвердить
          <ArrowRight className="h-4 w-4" />
        </Button>
      </form>

      <p className="mt-8 text-center text-sm text-ink-500">
        Ошиблись при регистрации?{' '}
        <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
          Начать заново
        </Link>
      </p>
    </AuthLayout>
  )
}
