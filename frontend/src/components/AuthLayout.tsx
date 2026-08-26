import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Hamburger, Search } from 'lucide-react'
import { FoodCollage } from './FoodCollage'
import { ParsleyAccent, ChiliAccent } from './FoodAccents'

export function AuthLayout({
  heading,
  highlight,
  subtitle,
  children,
}: {
  heading: string
  highlight: string
  subtitle: string
  children: ReactNode
}) {
  return (
    <div className="flex min-h-screen w-full bg-cream-100 p-3 lg:p-4">
      <div className="relative hidden w-[46%] shrink-0 overflow-hidden rounded-[2.5rem] lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-200 via-brand-300 to-brand-500" />
        <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -right-10 bottom-24 h-72 w-72 rounded-full bg-ink-900/10 blur-3xl" />

        <div className="flex h-full items-center justify-center p-10">
          <FoodCollage className="w-[85%] max-w-md" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute left-8 top-8 flex items-center gap-2 rounded-2xl bg-white/90 px-3.5 py-2 shadow-lg backdrop-blur"
        >
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-500 text-white">
            <Hamburger className="h-4 w-4" strokeWidth={2.5} />
          </div>
          <span className="text-base font-extrabold tracking-tight text-ink-900">Foodify</span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="absolute bottom-8 left-8 right-8"
        >
          <p className="text-2xl font-extrabold leading-snug text-white drop-shadow-sm">
            Сочно. Быстро.
            <br />
            Прямо к твоей двери.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="absolute bottom-8 right-8 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg"
        >
          <Search className="h-4.5 w-4.5 text-brand-600" strokeWidth={2.5} />
        </motion.div>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-6 py-10 sm:px-12">
        <ParsleyAccent className="pointer-events-none absolute left-6 top-6 h-14 w-14 opacity-70 lg:left-10 lg:top-10" />
        <ChiliAccent className="pointer-events-none absolute bottom-8 right-6 h-16 w-16 rotate-12 opacity-70 lg:bottom-12 lg:right-10" />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="mb-10 flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500 text-white">
              <Hamburger className="h-4.5 w-4.5" strokeWidth={2.5} />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-ink-900">Foodify</span>
          </div>

          <h1 className="text-3xl font-extrabold leading-tight text-ink-900 sm:text-4xl">
            {heading} <span className="text-brand-500">{highlight}</span>
          </h1>
          <p className="mt-2.5 text-sm text-ink-500">{subtitle}</p>

          <div className="mt-8">{children}</div>

          <div className="mt-10 flex flex-col items-center gap-1.5 text-center">
            <p className="text-xs font-medium text-ink-400">
              <a href="#" className="hover:text-ink-600">
                Privacy Policy
              </a>{' '}
              <span className="text-ink-300">|</span>{' '}
              <a href="#" className="hover:text-ink-600">
                Terms of Use
              </a>
            </p>
            <p className="text-xs text-ink-300">
              © {new Date().getFullYear()} Foodify. Все права защищены.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
