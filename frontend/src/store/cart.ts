import { create } from 'zustand'

interface CartState {
  count: number
  addOne: () => void
  reset: () => void
}

// Lightweight local counter for the nav badge. The full cart contents are
// fetched fresh on the cart page itself.
export const useCartStore = create<CartState>((set) => ({
  count: 0,
  addOne: () => set((s) => ({ count: s.count + 1 })),
  reset: () => set({ count: 0 }),
}))
