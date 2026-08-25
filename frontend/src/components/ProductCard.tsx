import { motion } from 'framer-motion'
import { Plus } from 'lucide-react'
import { getCategoryIcon } from '../lib/categoryIcons'
import type { Product, Category } from '../api/client'

const gradients = [
  'from-brand-200 to-brand-400',
  'from-orange-100 to-brand-300',
  'from-amber-100 to-brand-300',
  'from-brand-100 to-amber-300',
]

export function ProductCard({
  product,
  category,
  onAdd,
  adding,
}: {
  product: Product
  category?: Category
  onAdd: () => void
  adding: boolean
}) {
  const Icon = getCategoryIcon(category?.name ?? '')
  const gradient = gradients[product.id % gradients.length]
  const hasDeal = product.final_price < product.price

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm shadow-ink-900/5 ring-1 ring-ink-100 transition-shadow hover:shadow-lg hover:shadow-ink-900/10"
    >
      <div
        className={`relative flex h-36 items-center justify-center bg-gradient-to-br ${gradient}`}
      >
        <Icon className="h-14 w-14 text-white drop-shadow" strokeWidth={1.5} />
        {hasDeal && (
          <span className="absolute left-3 top-3 rounded-full bg-ink-900 px-2.5 py-1 text-xs font-bold text-white">
            -{Math.round((1 - product.final_price / product.price) * 100)}%
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-4">
        <h3 className="font-bold text-ink-900">{product.name}</h3>
        <p className="line-clamp-2 flex-1 text-xs text-ink-500">{product.description}</p>

        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-extrabold text-ink-900">
              {product.final_price.toLocaleString('ru-RU')}
            </span>
            {hasDeal && (
              <span className="text-xs font-medium text-ink-300 line-through">
                {product.price.toLocaleString('ru-RU')}
              </span>
            )}
            <span className="text-xs font-medium text-ink-400">сум</span>
          </div>

          <button
            type="button"
            onClick={onAdd}
            disabled={adding}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500 text-white shadow-md shadow-brand-500/30 transition-transform hover:bg-brand-600 active:scale-90 disabled:opacity-60"
          >
            <Plus className="h-4.5 w-4.5" strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </motion.div>
  )
}
