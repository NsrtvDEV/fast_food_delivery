export const ORDER_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  created: { label: 'Создан', className: 'bg-slate-100 text-slate-600' },
  accepted: { label: 'Принят', className: 'bg-sky-100 text-sky-700' },
  cooking: { label: 'Готовится', className: 'bg-amber-100 text-amber-700' },
  'on the way': { label: 'В пути', className: 'bg-sky-100 text-sky-700' },
  delivered: { label: 'Доставлен', className: 'bg-emerald-100 text-emerald-700' },
  canceled: { label: 'Отменён', className: 'bg-red-100 text-red-700' },
}

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_CONFIG[status]?.label ?? status
}

export const ORDER_PROGRESS_STEPS = ['created', 'accepted', 'cooking', 'on the way', 'delivered']

export function orderProgressIndex(status: string): number {
  return ORDER_PROGRESS_STEPS.indexOf(status)
}
