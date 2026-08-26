import { motion } from 'framer-motion'
import burgerPhoto from '../assets/collage/burger.webp'
import pizzaPhoto from '../assets/collage/pizza.webp'
import friesPhoto from '../assets/collage/fries.webp'
import sodaPhoto from '../assets/collage/soda.webp'
import nuggetsPhoto from '../assets/collage/nuggets.webp'

export function FoodCollage({ className = '' }: { className?: string }) {
  return (
    <div className={`relative aspect-square ${className}`}>
      <div className="absolute inset-[-4%] rounded-full bg-[radial-gradient(circle,rgba(20,15,10,0.88)_0%,rgba(20,15,10,0.55)_45%,rgba(20,15,10,0)_72%)]" />
      <motion.svg
        viewBox="0 0 400 400"
        className="absolute inset-0 h-full w-full"
        initial={{ opacity: 0, scale: 0.8, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.6 }}
      >
        <polygon
          points="200.0,0.0 227.8,114.4 317.6,38.2 272.8,147.1 390.2,138.2 290.0,200.0 390.2,261.8 272.8,252.9 317.6,361.8 227.8,285.6 200.0,400.0 172.2,285.6 82.4,361.8 127.2,252.9 9.8,261.8 110.0,200.0 9.8,138.2 127.2,147.1 82.4,38.2 172.2,114.4"
          fill="#FFD873"
          opacity="0.9"
        />
      </motion.svg>
      <motion.img
        src={pizzaPhoto}
        alt=""
        initial={{ opacity: 0, y: -16, rotate: -14 }}
        animate={{ opacity: 1, y: 0, rotate: -10 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="absolute left-0 top-0 z-10 w-[42%] rounded-[1.5rem] object-cover shadow-2xl ring-4 ring-white"
      />
      <motion.img
        src={nuggetsPhoto}
        alt=""
        initial={{ opacity: 0, x: 16, y: -10, rotate: 16 }}
        animate={{ opacity: 1, x: 0, y: 0, rotate: 11 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="absolute -right-1 top-0 z-10 w-[32%] rounded-[1.5rem] object-cover shadow-2xl ring-4 ring-white"
      />
      <motion.img
        src={friesPhoto}
        alt=""
        initial={{ opacity: 0, y: 16, rotate: 12 }}
        animate={{ opacity: 1, y: 0, rotate: 7 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="absolute bottom-0 left-2 z-10 w-[44%] rounded-[1.5rem] object-cover shadow-2xl ring-4 ring-white"
      />
      <motion.img
        src={sodaPhoto}
        alt=""
        initial={{ opacity: 0, x: 16, rotate: 14 }}
        animate={{ opacity: 1, x: 0, rotate: 9 }}
        transition={{ duration: 0.5, delay: 0.35 }}
        className="absolute -right-2 bottom-2 z-10 w-[30%] rounded-[1.5rem] object-cover shadow-2xl ring-4 ring-white"
      />
      <motion.img
        src={burgerPhoto}
        alt="Foodify"
        initial={{ opacity: 0, scale: 0.85, rotate: -6 }}
        animate={{ opacity: 1, scale: 1, rotate: -3 }}
        transition={{ duration: 0.55, delay: 0.05 }}
        className="absolute left-1/2 top-1/2 z-20 w-[60%] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] object-cover shadow-2xl ring-4 ring-white"
      />
    </div>
  )
}
