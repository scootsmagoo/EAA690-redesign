'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import type { StoreProduct } from '@/lib/sanity-types'
import {
  addProductToLines,
  countCartItems,
  loadCartFromStorage,
  removeLine,
  saveCartToStorage,
  setLineQuantity,
  type CartLine,
} from '@/lib/store-cart'

type StoreCartContextValue = {
  lines: CartLine[]
  ready: boolean
  totalItems: number
  addProduct: (product: StoreProduct, quantity?: number) => void
  setQuantity: (productId: string, quantity: number) => void
  remove: (productId: string) => void
  clear: () => void
}

const StoreCartContext = createContext<StoreCartContextValue | null>(null)

export function StoreCartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setLines(loadCartFromStorage())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    saveCartToStorage(lines)
  }, [lines, ready])

  const addProduct = useCallback((product: StoreProduct, quantity = 1) => {
    setLines((prev) => addProductToLines(prev, product, quantity))
  }, [])

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) => setLineQuantity(prev, productId, quantity))
  }, [])

  const remove = useCallback((productId: string) => {
    setLines((prev) => removeLine(prev, productId))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const totalItems = useMemo(() => countCartItems(lines), [lines])

  const value = useMemo(
    () => ({
      lines,
      ready,
      totalItems,
      addProduct,
      setQuantity,
      remove,
      clear,
    }),
    [lines, ready, totalItems, addProduct, setQuantity, remove, clear],
  )

  return <StoreCartContext.Provider value={value}>{children}</StoreCartContext.Provider>
}

export function useStoreCart(): StoreCartContextValue {
  const ctx = useContext(StoreCartContext)
  if (!ctx) {
    throw new Error('useStoreCart must be used within StoreCartProvider')
  }
  return ctx
}
