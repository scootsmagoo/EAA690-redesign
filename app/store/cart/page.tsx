'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useStoreCart } from '@/components/StoreCartProvider'
import { startStoreCartCheckout } from '@/lib/store-checkout-client'

export default function StoreCartPage() {
  const { lines, ready, totalItems, setQuantity, remove } = useStoreCart()
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [checkingOut, setCheckingOut] = useState(false)
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (checkoutError && errorRef.current) {
      errorRef.current.focus()
    }
  }, [checkoutError])

  const handleCheckout = async () => {
    if (lines.length === 0) return
    setCheckoutError(null)
    setCheckingOut(true)
    try {
      await startStoreCartCheckout(lines.map((l) => ({ productId: l.productId, quantity: l.quantity })))
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setCheckingOut(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 id="cart-page-heading" className="text-4xl font-bold text-eaa-blue mb-2">
        Shopping cart
      </h1>
      <p className="text-gray-600 mb-8">
        Review your items, then continue to secure checkout (Stripe). You can add more from the{' '}
        <Link
          href="/store"
          className="text-eaa-light-blue font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 rounded-sm"
        >
          store
        </Link>
        .
      </p>

      {checkoutError && (
        <div
          ref={errorRef}
          id="cart-checkout-error"
          role="alert"
          aria-live="assertive"
          tabIndex={-1}
          className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-800 text-sm outline-none focus-visible:ring-2 focus-visible:ring-red-600 focus-visible:ring-offset-2"
        >
          {checkoutError}
        </div>
      )}

      {!ready ? (
        <p className="text-gray-600" aria-live="polite">
          Loading cart…
        </p>
      ) : lines.length === 0 ? (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
          <p className="text-gray-700 mb-4">Your cart is empty.</p>
          <Link
            href="/store"
            className="inline-flex bg-eaa-yellow text-eaa-blue px-5 py-2.5 rounded-lg font-semibold hover:bg-yellow-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
          >
            Browse the store
          </Link>
        </div>
      ) : (
        <section aria-labelledby="cart-items-heading">
          <h2 id="cart-items-heading" className="sr-only">
            Items in your cart
          </h2>
          <ul className="divide-y divide-gray-200 border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm mb-8">
            {lines.map((line) => (
              <li key={line.productId} className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-eaa-blue text-lg">{line.title}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">{line.priceDisplay} each</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <label className="sr-only" htmlFor={`qty-${line.productId}`}>
                    Quantity for {line.title}
                  </label>
                  <div className="flex items-center rounded-lg border border-gray-300 bg-white">
                    <button
                      type="button"
                      className="min-h-[44px] min-w-[44px] px-2 text-lg leading-none text-gray-700 hover:bg-gray-50 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-inset"
                      aria-label={`Decrease quantity for ${line.title}`}
                      disabled={line.quantity <= 1}
                      onClick={() => setQuantity(line.productId, line.quantity - 1)}
                    >
                      −
                    </button>
                    <input
                      id={`qty-${line.productId}`}
                      type="number"
                      min={1}
                      max={10}
                      inputMode="numeric"
                      value={line.quantity}
                      onChange={(e) => {
                        const v = parseInt(e.target.value, 10)
                        if (Number.isFinite(v)) setQuantity(line.productId, v)
                      }}
                      onBlur={() => {
                        const v = line.quantity
                        if (!Number.isFinite(v) || v < 1) setQuantity(line.productId, 1)
                        else if (v > 10) setQuantity(line.productId, 10)
                      }}
                      className="w-12 min-h-[44px] text-center border-x border-gray-300 py-2 text-sm [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-inset"
                    />
                    <button
                      type="button"
                      className="min-h-[44px] min-w-[44px] px-2 text-lg leading-none text-gray-700 hover:bg-gray-50 disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-inset"
                      aria-label={`Increase quantity for ${line.title}`}
                      disabled={line.quantity >= 10}
                      onClick={() => setQuantity(line.productId, line.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-red-800 hover:underline font-medium min-h-[44px] px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2 rounded"
                    onClick={() => remove(line.productId)}
                    aria-label={`Remove ${line.title} from cart`}
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <p className="text-gray-700">
              <span className="font-semibold text-eaa-blue">{totalItems}</span>{' '}
              {totalItems === 1 ? 'item' : 'items'} in cart — totals and tax are shown in Stripe checkout.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/store"
                className="inline-flex min-h-[44px] items-center justify-center px-5 py-2.5 rounded-lg border border-eaa-blue text-eaa-blue font-semibold hover:bg-blue-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
              >
                Continue shopping
              </Link>
              <button
                type="button"
                onClick={handleCheckout}
                disabled={checkingOut}
                aria-busy={checkingOut}
                className="inline-flex min-h-[44px] items-center justify-center bg-eaa-yellow text-eaa-blue px-6 py-2.5 rounded-lg font-semibold hover:bg-yellow-400 transition-colors disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2"
              >
                {checkingOut ? 'Redirecting…' : 'Proceed to checkout'}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
