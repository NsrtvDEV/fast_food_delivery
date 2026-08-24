import { type ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean
  variant?: 'primary' | 'ghost'
}

export function Button({
  loading,
  variant = 'primary',
  className = '',
  children,
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]'

  const variants = {
    primary:
      'bg-brand-500 text-white shadow-lg shadow-brand-500/25 hover:bg-brand-600 hover:shadow-brand-600/30',
    ghost: 'bg-ink-100 text-ink-800 hover:bg-ink-200',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
