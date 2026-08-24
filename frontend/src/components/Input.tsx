import { type InputHTMLAttributes, type ReactNode, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  icon?: ReactNode
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, icon, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-medium text-ink-700">
          {label}
        </label>
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400">
              {icon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full rounded-2xl border border-ink-200 bg-white py-3.5 text-sm text-ink-900 outline-none transition-all duration-200 placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100 ${
              icon ? 'pl-11 pr-4' : 'px-4'
            } ${error ? 'border-red-400 focus:border-red-400 focus:ring-red-100' : ''} ${className}`}
            {...props}
          />
        </div>
        {error && <span className="text-xs font-medium text-red-500">{error}</span>}
      </div>
    )
  },
)

Input.displayName = 'Input'
