import {
  Sandwich,
  Hamburger,
  Flame,
  Popcorn,
  CupSoda,
  Pizza,
  Salad,
  Cake,
  ChefHat,
  Beef,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react'

const iconByCategory: Record<string, LucideIcon> = {
  lavash: Sandwich,
  burgers: Hamburger,
  'hot-dogs': Flame,
  snaks: Popcorn,
  snacks: Popcorn,
  drinks: CupSoda,
  pizzas: Pizza,
  salads: Salad,
  desserts: Cake,
  duets: ChefHat,
  doners: Beef,
}

export function getCategoryIcon(name: string): LucideIcon {
  return iconByCategory[name.toLowerCase()] ?? UtensilsCrossed
}
