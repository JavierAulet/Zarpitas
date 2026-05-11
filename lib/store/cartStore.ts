import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product, ProductVariant } from '@/types'

interface CartState {
  items: CartItem[]
  addItem: (product: Product, quantity?: number, variant?: ProductVariant) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  restoreCart: (items: CartItem[]) => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],

      addItem: (product, quantity = 1, variant?) =>
        set((state) => {
          const cartId = variant ? `${product.id}_${variant.id}` : product.id
          const effectivePrice = product.price + (variant?.priceModifier ?? 0)
          const existing = state.items.find((item) => item.id === cartId)
          if (existing) {
            return {
              items: state.items.map((item) =>
                item.id === cartId ? { ...item, quantity: item.quantity + quantity } : item
              ),
            }
          }
          return {
            items: [
              ...state.items,
              {
                id: cartId,
                productId: product.id,
                name: product.name,
                price: effectivePrice,
                originalPrice: product.originalPrice,
                image: product.image,
                images: product.images,
                category: product.category,
                subcategory: product.subcategory,
                badge: product.badge,
                rating: product.rating,
                reviews: product.reviews,
                description: product.description,
                features: product.features,
                aliexpressId: product.aliexpressId,
                stock: variant ? variant.stock : product.stock,
                quantity,
                variantId: variant?.id,
                variantName: variant?.name,
              },
            ],
          }
        }),

      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),

      updateQuantity: (id, quantity) =>
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((item) => item.id !== id) }
          }
          return {
            items: state.items.map((item) =>
              item.id === id ? { ...item, quantity } : item
            ),
          }
        }),

      clearCart: () => set({ items: [] }),

      restoreCart: (items) => set({ items }),
    }),
    { name: 'zarpitas-cart' }
  )
)

export const useCartTotal = () =>
  useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  )

export const useCartItemCount = () =>
  useCartStore((state) =>
    state.items.reduce((sum, item) => sum + item.quantity, 0)
  )
