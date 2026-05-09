import { create } from 'zustand'

interface UIState {
  isCartOpen: boolean
  isMobileMenuOpen: boolean
  searchQuery: string
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  openMobileMenu: () => void
  closeMobileMenu: () => void
  setSearchQuery: (query: string) => void
}

export const useUIStore = create<UIState>()((set) => ({
  isCartOpen: false,
  isMobileMenuOpen: false,
  searchQuery: '',

  openCart: () => set({ isCartOpen: true }),
  closeCart: () => set({ isCartOpen: false }),
  toggleCart: () => set((state) => ({ isCartOpen: !state.isCartOpen })),
  openMobileMenu: () => set({ isMobileMenuOpen: true }),
  closeMobileMenu: () => set({ isMobileMenuOpen: false }),
  setSearchQuery: (query) => set({ searchQuery: query }),
}))
