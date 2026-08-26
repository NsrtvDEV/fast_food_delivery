import { create } from 'zustand'

interface CartState {
  count: number
  setCount: (count: number) => void
  reset: () => void
}

// Lightweight local counter for the nav badge, kept in sync with the server
// cart's total item quantity by whichever screen last touched it (cart page,
// or an add-to-cart click on the home page).
export const useCartStore = create<CartState>((set) => ({
  count: 0,
  setCount: (count) => set({ count }),
  reset: () => set({ count: 0 }),
}))
