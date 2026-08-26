import type { LucideIcon } from 'lucide-react'

export function CategoryPill({
  label,
  icon: Icon,
  imageUrl,
  active,
  onClick,
}: {
  label: string
  icon: LucideIcon
  imageUrl?: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button type="button" onClick={onClick} className="flex shrink-0 flex-col items-center gap-2">
      <div
        className={`flex h-16 w-16 items-center justify-center overflow-hidden rounded-full transition-all ${
          active ? 'ring-4 ring-brand-400' : 'ring-1 ring-ink-100'
        } ${imageUrl ? 'bg-ink-100' : active ? 'bg-brand-500 text-white' : 'bg-white text-ink-700'}`}
      >
        {imageUrl ? (
          <img src={imageUrl} alt={label} className="h-full w-full object-cover" />
        ) : (
          <Icon className="h-6 w-6" strokeWidth={active ? 2.25 : 1.75} />
        )}
      </div>
      <span
        className={`text-xs font-semibold capitalize ${active ? 'text-brand-600' : 'text-ink-700'}`}
      >
        {label}
      </span>
    </button>
  )
}
