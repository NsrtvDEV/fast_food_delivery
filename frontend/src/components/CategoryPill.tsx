import type { LucideIcon } from 'lucide-react'

export function CategoryPill({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: LucideIcon
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex shrink-0 flex-col items-center gap-2 rounded-2xl px-5 py-4 transition-all ${
        active
          ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
          : 'bg-white text-ink-700 ring-1 ring-ink-100 hover:bg-ink-50'
      }`}
    >
      <Icon className="h-6 w-6" strokeWidth={active ? 2.25 : 1.75} />
      <span className="text-xs font-semibold capitalize">{label}</span>
    </button>
  )
}
