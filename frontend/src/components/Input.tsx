import { type InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor={inputId} className="text-sm font-semibold text-ink-800">
          {label}
        </label>
        <input
          id={inputId}
          ref={ref}
          className={`w-full rounded-2xl border border-transparent bg-ink-100/70 px-4 py-3.5 text-sm text-ink-900 outline-none transition-all duration-200 placeholder:text-ink-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100 ${
            error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : ''
          } ${className}`}
          {...props}
        />
        {error && <span className="text-xs font-medium text-red-500">{error}</span>}
      </div>
    )
  },
)

Input.displayName = 'Input'
