'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { StoreCategory, StoreProduct } from '@/lib/sanity-types'
import { urlFor } from '@/lib/sanity'
import { useStoreCart } from '@/components/StoreCartProvider'
import { productCanCheckoutOnSite } from '@/lib/store-product'
import { startStoreCartCheckout } from '@/lib/store-checkout-client'

const LIVE_STORE = 'https://www.eaa690.org/store'

type Props = {
  categories: StoreCategory[]
  products: StoreProduct[]
  fromSanity: boolean
}

function isSafeSameOriginPath(href: string): boolean {
  if (!href.startsWith('/')) return false
  if (href.startsWith('//')) return false
  if (href.includes('\\')) return false
  return true
}

function ExternalPurchaseLink({ item }: { item: StoreProduct }) {
  const href = item.externalPurchaseUrl || LIVE_STORE
  const isInternal = isSafeSameOriginPath(href)
  const label = item.externalPurchaseUrl ? 'Purchase' : 'View on chapter store'
  const className =
    'bg-eaa-yellow text-eaa-blue px-4 py-2 rounded-md font-semibold hover:bg-yellow-400 transition-colors text-center text-sm whitespace-nowrap'
  const aria = item.externalPurchaseUrl
    ? `Purchase ${item.title}${isInternal ? '' : ' (opens external site)'}`
    : `View ${item.title} on the chapter store (opens external site)`

  if (isInternal) {
    return (
      <Link href={href} className={className} aria-label={aria}>
        {label}
      </Link>
    )
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      aria-label={aria}
    >
      {label}
    </a>
  )
}

export default function StoreCatalog({ categories, products, fromSanity }: Props) {
  const { addProduct } = useStoreCart()
  const [activeSlug, setActiveSlug] = useState<string | 'all'>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const handleBuyNow = async (item: StoreProduct) => {
    if (!productCanCheckoutOnSite(item)) return
    setLoadingId(item._id)
    setCheckoutError(null)
    try {
      await startStoreCartCheckout([{ productId: item._id, quantity: 1 }])
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setLoadingId(null)
    }
  }

  const filtered = useMemo(() => {
    if (activeSlug === 'all') return products
    return products.filter((p) =>
      (p.categories || []).some((c) => c.slug?.current === activeSlug),
    )
  }, [products, activeSlug])

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-lg text-gray-700 max-w-3xl">
          Show your support for EAA 690 — memberships, chapter merch, event meals, prints, and more.
          Purchases are processed securely (Stripe). Add items to your cart and check out once, or use
          Buy now for a single-item checkout. Use the filters to browse by category (food, plaques,
          prints, memberships, etc.).
        </p>
        {!fromSanity && (
          <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 shrink-0">
            Showing sample inventory. Add products in{' '}
            <a
              href="/studio"
              className="underline font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 rounded-sm"
            >
              Sanity Studio
            </a>{' '}
            to manage this page.
          </p>
        )}
      </div>

      <section className="mb-8" aria-labelledby="store-filter-heading">
        <h2 id="store-filter-heading" className="text-sm font-semibold text-eaa-blue mb-2">
          Filters
        </h2>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <button
            type="button"
            onClick={() => setActiveSlug('all')}
            aria-pressed={activeSlug === 'all'}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-1 ${
              activeSlug === 'all'
                ? 'bg-eaa-blue text-white'
                : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat._id}
              type="button"
              onClick={() => setActiveSlug(cat.slug.current)}
              aria-pressed={activeSlug === cat.slug.current}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-1 ${
                activeSlug === cat.slug.current
                  ? 'bg-eaa-blue text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {cat.title}
            </button>
          ))}
        </div>
      </section>

      {checkoutError && (
        <div
          role="alert"
          aria-live="assertive"
          className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-red-700 text-sm"
        >
          {checkoutError}
        </div>
      )}

      {filtered.length === 0 ? (
        <p className="text-gray-600 py-8">No products match this filter.</p>
      ) : (
        <section aria-label="Products for sale">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <article
              key={item._id}
              className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col"
            >
              <div className="h-52 bg-gray-100 relative flex items-center justify-center overflow-hidden">
                {item.image ? (
                  <Image
                    src={urlFor(item.image).width(600).height(400).fit('crop').url()}
                    alt={item.title}
                    width={600}
                    height={400}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-gray-400 text-sm px-4 text-center">No image</span>
                )}
              </div>
              <div className="p-6 flex flex-col flex-1">
                <div className="flex flex-wrap gap-1 mb-2">
                  {(item.categories || []).map((c) => (
                    <span
                      key={c._id}
                      className="text-xs bg-blue-50 text-eaa-blue px-2 py-0.5 rounded"
                    >
                      {c.title}
                    </span>
                  ))}
                </div>
                <h2 className="text-xl font-bold text-eaa-blue mb-2">{item.title}</h2>
                {item.shortDescription && (
                  <p className="text-gray-600 mb-4 text-sm flex-1">{item.shortDescription}</p>
                )}
                <div className="flex flex-col gap-3 mt-auto pt-2">
                  <span className="text-xl font-bold text-eaa-blue">{item.priceDisplay}</span>
                  {productCanCheckoutOnSite(item) ? (
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => addProduct(item, 1)}
                        className="bg-eaa-yellow text-eaa-blue px-4 py-2 rounded-md font-semibold hover:bg-yellow-400 transition-colors text-center text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-1"
                        aria-label={`Add ${item.title} to cart`}
                      >
                        Add to cart
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBuyNow(item)}
                        disabled={loadingId !== null}
                        aria-busy={loadingId === item._id}
                        aria-label={
                          loadingId === item._id
                            ? `Loading checkout for ${item.title}`
                            : `Buy ${item.title} now with Stripe`
                        }
                        className="border border-eaa-blue text-eaa-blue bg-white px-4 py-2 rounded-md font-semibold hover:bg-blue-50 transition-colors text-center text-sm disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-1"
                      >
                        {loadingId === item._id ? 'Loading…' : 'Buy now'}
                      </button>
                    </div>
                  ) : (
                    <ExternalPurchaseLink item={item} />
                  )}
                </div>
              </div>
            </article>
          ))}
          </div>
        </section>
      )}

      <div className="mt-12 bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-bold text-eaa-blue mb-4">Payment information</h2>
        <p className="text-gray-700">
          All transactions on the chapter store are secured through Stripe. For questions about orders
          or in-person purchases, please{' '}
          <a
            href="/contact"
            className="text-eaa-light-blue hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eaa-blue focus-visible:ring-offset-2 rounded-sm"
          >
            contact us
          </a>
          .
        </p>
      </div>
    </>
  )
}
