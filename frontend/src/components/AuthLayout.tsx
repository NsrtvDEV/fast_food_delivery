import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { UtensilsCrossed } from 'lucide-react'

const floatingItems = [
  { emoji: '🍔', top: '12%', left: '15%', delay: 0 },
  { emoji: '🍕', top: '68%', left: '10%', delay: 0.6 },
  { emoji: '🥤', top: '20%', left: '78%', delay: 1.1 },
  { emoji: '🍟', top: '75%', left: '72%', delay: 0.3 },
  { emoji: '🌮', top: '45%', left: '85%', delay: 1.6 },
  { emoji: '🍩', top: '50%', left: '5%', delay: 2.1 },
]

export function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full bg-ink-950">
      <div className="relative hidden w-1/2 overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-14">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500 via-brand-600 to-ink-900" />
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-brand-300/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-16 h-[28rem] w-[28rem] rounded-full bg-brand-800/40 blur-3xl" />

        {floatingItems.map((item, i) => (
          <motion.span
            key={i}
            className="absolute text-4xl drop-shadow-lg select-none"
            style={{ top: item.top, left: item.left }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 0.9, y: [0, -14, 0] }}
            transition={{
              opacity: { delay: item.delay, duration: 0.6 },
              y: { delay: item.delay, duration: 4, repeat: Infinity, ease: 'easeInOut' },
            }}
          >
            {item.emoji}
          </motion.span>
        ))}

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex items-center gap-2.5 text-white"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
            <UtensilsCrossed className="h-5 w-5" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">Foodify</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative z-10 max-w-md"
        >
          <h2 className="text-4xl font-extrabold leading-tight text-white">
            Голод — это временно.
            <br />
            Foodify — навсегда.
          </h2>
          <p className="mt-4 text-base text-white/80">
            Любимая еда из ближайших филиалов, доставка в реальном времени и лучшие акции — всё в
            одном приложении.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative z-10 text-sm text-white/60"
        >
          © {new Date().getFullYear()} Foodify. Быстро. Вкусно. Рядом.
        </motion.div>
      </div>

      <div className="flex w-full flex-1 items-center justify-center bg-ink-50 px-6 py-12 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
              <UtensilsCrossed className="h-4.5 w-4.5" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-ink-900">Foodify</span>
          </div>

          <h1 className="text-2xl font-extrabold text-ink-900">{title}</h1>
          <p className="mt-1.5 text-sm text-ink-500">{subtitle}</p>

          <div className="mt-8">{children}</div>
        </motion.div>
      </div>
    </div>
  )
}
