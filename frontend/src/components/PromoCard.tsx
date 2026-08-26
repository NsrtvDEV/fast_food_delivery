import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import burgerPhoto from '../assets/collage/burger.webp'
import friesPhoto from '../assets/collage/fries.webp'
import type { Product } from '../api/client'

const STAR_POINTS =
  '40,0 45.6,22.9 63.5,7.6 54.6,29.4 78,27.6 58,40 78,52.4 54.6,50.6 63.5,72.4 45.6,57.1 40,80 34.4,57.1 16.5,72.4 25.4,50.6 2,52.4 22,40 2,27.6 25.4,29.4 16.5,7.6 34.4,22.9'

export function PromoCard({
  product,
  onOrder,
  ordering,
  className = '',
}: {
  product: Product
  onOrder: () => void
  ordering: boolean
  className?: string
}) {
  const discountPct = Math.round((1 - product.final_price / product.price) * 100)

  return (
    <div className={`relative aspect-square ${className}`}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-br from-brand-200 via-brand-300 to-brand-500" />

      <motion.svg
        viewBox="0 0 80 80"
        className="absolute left-0 top-2 w-16"
        initial={{ opacity: 0, rotate: -10, scale: 0.7 }}
        animate={{ opacity: 1, rotate: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <polygon points={STAR_POINTS} fill="#FFFFFF" opacity="0.85" />
      </motion.svg>

      <motion.img
        src={friesPhoto}
        alt=""
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="absolute right-2 top-10 z-10 w-[38%] rounded-2xl object-cover shadow-xl ring-4 ring-white"
      />
      <motion.img
        src={burgerPhoto}
        alt={product.name}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55 }}
        className="absolute left-1/2 top-[38%] z-20 w-[62%] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] object-cover shadow-2xl ring-4 ring-white"
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="absolute -bottom-4 right-0 z-30 w-[72%] rounded-2xl bg-white p-4 shadow-2xl"
      >
        <span className="flex w-fit items-center gap-1 rounded-full bg-brand-50 px-2 py-1 text-xs font-bold text-brand-600">
          <Flame className="h-3 w-3" />
          Super Deal
        </span>
        <p className="mt-1.5 truncate text-sm font-extrabold text-ink-900">{product.name}</p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="text-lg font-extrabold text-brand-600">
            {product.final_price.toLocaleString('ru-RU')}
          </span>
          <span className="text-xs font-medium text-ink-300 line-through">
            {product.price.toLocaleString('ru-RU')}
          </span>
          <span className="text-xs font-medium text-ink-400">сум · -{discountPct}%</span>
        </div>
        <button
          type="button"
          onClick={onOrder}
          disabled={ordering}
          className="mt-2.5 w-full rounded-full bg-brand-500 py-2 text-sm font-bold text-white transition-colors hover:bg-brand-600 disabled:opacity-60"
        >
          {ordering ? 'Добавляем...' : 'Order Now'}
        </button>
      </motion.div>
    </div>
  )
}
