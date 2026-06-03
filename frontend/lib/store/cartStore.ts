import { create } from 'zustand'

export interface CartItem {
  id: string
  productId: string
  productName: string
  price: number
  quantity: number
  image: string
  vendorId: string
}

interface CartStore {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  getTotalPrice: () => number
  clearCart: () => void
}

export const useCart = create<CartStore>((set, get) => ({
  items: [],
  addItem: (item) => set((state) => {
    const existingIndex = state.items.findIndex((i) => i.productId === item.productId)
    if (existingIndex > -1) {
      const newItems = [...state.items]
      newItems[existingIndex].quantity += item.quantity
      return { items: newItems }
    }
    return { items: [...state.items, item] }
  }),
  removeItem: (productId) => set((state) => ({
    items: state.items.filter((i) => i.productId !== productId)
  })),
  updateQuantity: (productId, quantity) => set((state) => ({
    items: state.items.map((i) => i.productId === productId ? { ...i, quantity } : i)
  })),
  getTotalPrice: () => {
    return get().items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  },
  clearCart: () => set({ items: [] }),
}))
