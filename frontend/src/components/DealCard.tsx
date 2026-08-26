import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import { catalogApi, type Product } from '../api/client'

export function DealCard({
  product,
  onOrder,
  ordering,
}: {
  product: Product
  onOrder: () => void
  ordering: boolean
}) {
  const discountPct = Math.round((1 - product.final_price / product.price) * 100)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="overflow-hidden rounded-2xl bg-white ring-1 ring-ink-100"
    >
      <div className="relative h-36 bg-ink-100">
        {product.image_id && (
          <img
            src={catalogApi.productImageUrl(product.image_id)}
            alt={product.name}
            className="h-full w-full object-cover"
          />
        )}
        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-brand-600 shadow">
          <Flame className="h-3 w-3" />
          -{discountPct}%
        </span>
      </div>

      <div className="p-4">
        <p className="truncate font-bold text-ink-900">{product.name}</p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="font-extrabold text-brand-600">
            {product.final_price.toLocaleString('ru-RU')}
          </span>
          <span className="text-xs text-ink-300 line-through">
            {product.price.toLocaleString('ru-RU')}
          </span>
          <span className="text-xs text-ink-400">сум</span>
        </div>
        <button
          type="button"
          onClick={onOrder}
          disabled={ordering}
          className="mt-2 text-xs font-bold text-brand-600 hover:text-brand-700 disabled:opacity-60"
        >
          {ordering ? 'Добавляем...' : 'Заказать →'}
        </button>
      </div>
    </motion.div>
  )
}
