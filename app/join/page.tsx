'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { isStripeHostedCheckoutUrl } from '@/lib/stripe-checkout-url'

const MAX_ERROR_CHARS = 280

function clipPublicError(message: string): string {
  const t = message.replace(/[\u0000-\u001f\u007f]/g, '').trim()
  if (t.length <= MAX_ERROR_CHARS) return t
  return `${t.slice(0, MAX_ERROR_CHARS - 1)}…`
}

type TierKey = 'student' | 'individual' | 'family'

const MEMBERSHIP_TIERS: Array<{
  name: string
  price: string
  period: string
  recurring: boolean
  description: string
  highlight: boolean
  benefits: string[]
  tier: TierKey
  badge: string | null
}> = [
  {
    name: 'Student',
    price: '$10',
    period: 'per year',
    recurring: false,
    description: 'Chapter Student Membership — Annual',
    highlight: false,
    benefits: [
      'Full chapter membership',
      'Access to all chapter events',
      'Monthly newsletter',
      'Voting rights at chapter meetings',
      'Access to member resources',
    ],
    tier: 'student',
    badge: null,
  },
  {
    name: 'Individual',
    price: '$35',
    period: 'per year',
    recurring: true,
    description: 'Chapter Individual Membership — Annual',
    highlight: true,
    benefits: [
      'Full chapter membership',
      'Access to all chapter events',
      'Monthly newsletter',
      'Voting rights at chapter meetings',
      'Access to member resources',
      'Auto-renews annually',
    ],
    tier: 'individual',
    badge: 'Most Popular',
  },
  {
    name: 'Family',
    price: '$45',
    period: 'per year',
    recurring: true,
    description: 'Chapter Family Membership — Annual',
    highlight: false,
    benefits: [
      'Full chapter membership for entire family',
      'Access to all chapter events',
      'Monthly newsletter',
      'Voting rights at chapter meetings',
      'Access to member resources',
      'Auto-renews annually',
    ],
    tier: 'family',
    badge: 'Best Value',
  },
]

export default function JoinPage() {
  const [loadingTier, setLoadingTier] = useState<TierKey | null>(null)
  const [error, setError] = useState<string | null>(null)
  const errorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.focus()
    }
  }, [error])

  const handleJoin = async (tier: TierKey) => {
    if (loadingTier !== null) return
    setLoadingTier(tier)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'membership', membershipTier: tier }),
        credentials: 'same-origin',
        cache: 'no-store',
      })
      const text = await res.text()
      let data: { url?: string; error?: string } = {}
      try {
        if (text) data = JSON.parse(text) as { url?: string; error?: string }
      } catch {
        throw new Error(
          res.ok ? 'Invalid response from checkout.' : `Checkout failed (${res.status}).`
        )
      }
      if (!res.ok || !data.url) {
        throw new Error(clipPublicError(data.error ?? 'Failed to start checkout'))
      }
      if (!isStripeHostedCheckoutUrl(data.url)) {
        throw new Error('Invalid checkout link. Please refresh and try again.')
      }
      window.location.href = data.url
    } catch (err) {
      setError(
        clipPublicError(
          err instanceof Error ? err.message : 'Something went wrong. Please try again.'
        )
      )
      setLoadingTier(null)
    }
  }

  return (
    <div>
      {/* Hero */}
      <section className="bg-eaa-blue text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-4">Join EAA Chapter 690</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Become part of a Gold Chapter community of over 250 aviation enthusiasts at
            Briscoe Field in Lawrenceville, Georgia.
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14">

        {/* National requirement notice — region, not alert (informational) */}
        <section
          className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-12 flex gap-4 items-start"
          aria-labelledby="join-national-notice-heading"
        >
          <span className="text-amber-500 text-2xl mt-0.5" aria-hidden="true">
            ⚠️
          </span>
          <div>
            <h2 id="join-national-notice-heading" className="text-lg font-semibold text-amber-950 mb-1">
              EAA National Membership Required
            </h2>
            <p className="text-amber-950 text-sm leading-relaxed">
              Membership in{' '}
              <a
                href="https://www.eaa.org/eaa/join-eaa"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-semibold text-amber-950 hover:text-amber-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-900 rounded-sm"
              >
                EAA National
                <span className="sr-only"> (opens in new tab)</span>
              </a>{' '}
              is required before joining at the local chapter level. If you are not yet an EAA National member,
              please join there first, then return here to complete your chapter membership.
            </p>
          </div>
        </section>

        <p className="sr-only" aria-live="polite" aria-atomic="true">
          {loadingTier
            ? `Opening secure checkout for ${MEMBERSHIP_TIERS.find((t) => t.tier === loadingTier)?.name ?? ''} membership.`
            : ''}
        </p>

        {/* Error banner */}
        {error && (
          <div
            ref={errorRef}
            id="join-checkout-error"
            role="alert"
            tabIndex={-1}
            className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8 text-red-900 text-sm outline-none focus-visible:ring-2 focus-visible:ring-red-700 focus-visible:ring-offset-2"
          >
            {error}
          </div>
        )}

        {/* Membership tiers */}
        <section aria-labelledby="join-plans-heading">
          <h2 id="join-plans-heading" className="sr-only">
            Membership plans
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {MEMBERSHIP_TIERS.map((tier) => (
            <article
              key={tier.name}
              aria-labelledby={`join-plan-${tier.tier}-title`}
              className={`relative rounded-2xl flex flex-col overflow-hidden border-2 transition-shadow motion-reduce:transition-none hover:shadow-xl ${
                tier.highlight
                  ? 'border-eaa-blue shadow-lg'
                  : 'border-gray-200 shadow-md'
              }`}
            >
              {/* Badge */}
              {tier.badge && (
                <div
                  className={`absolute top-4 right-4 text-xs font-bold px-3 py-1 rounded-full ${
                    tier.highlight
                      ? 'bg-eaa-yellow text-eaa-blue'
                      : 'bg-gray-800 text-white'
                  }`}
                >
                  {tier.badge}
                </div>
              )}

              {/* Header */}
              <div
                className={`px-8 py-8 ${
                  tier.highlight ? 'bg-eaa-blue text-white' : 'bg-gray-50 text-eaa-blue'
                }`}
              >
                <h3 id={`join-plan-${tier.tier}-title`} className="text-2xl font-bold mb-1">
                  {tier.name}
                </h3>
                <p className={`text-sm mb-4 ${tier.highlight ? 'text-blue-100' : 'text-gray-700'}`}>
                  {tier.description}
                </p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-extrabold">{tier.price}</span>
                  <span className={`text-sm mb-1 ${tier.highlight ? 'text-blue-100' : 'text-gray-700'}`}>
                    /{tier.period}
                  </span>
                </div>
                {tier.recurring && (
                  <p className={`text-xs mt-2 ${tier.highlight ? 'text-blue-100' : 'text-gray-600'}`}>
                    Auto-renews every 12 months. Cancel anytime.
                  </p>
                )}
              </div>

              {/* Benefits */}
              <div className="px-8 py-6 bg-white flex-1 flex flex-col">
                <ul className="space-y-3 mb-8 flex-1">
                  {tier.benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg
                        className="w-4 h-4 text-green-500 mt-0.5 shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2.5}
                        aria-hidden="true"
                        focusable="false"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {benefit}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() => handleJoin(tier.tier)}
                  disabled={loadingTier !== null}
                  aria-busy={loadingTier === tier.tier}
                  aria-describedby={tier.recurring ? `join-plan-${tier.tier}-renew` : undefined}
                  aria-label={
                    loadingTier === tier.tier
                      ? `Redirecting to checkout for ${tier.name} membership`
                      : `Join or renew ${tier.name} membership — ${tier.price} ${tier.period}`
                  }
                  className={`block w-full text-center py-3 rounded-xl font-bold transition-all motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-eaa-blue ${
                    tier.highlight
                      ? 'bg-eaa-yellow text-eaa-blue hover:bg-yellow-400 shadow-md'
                      : 'bg-eaa-blue text-white hover:bg-blue-900'
                  } disabled:opacity-60 disabled:cursor-not-allowed`}
                >
                  {loadingTier === tier.tier ? 'Redirecting…' : 'Join / Renew'}
                </button>
                {tier.recurring && (
                  <p id={`join-plan-${tier.tier}-renew`} className="sr-only">
                    This plan renews automatically each year until cancelled.
                  </p>
                )}
              </div>
            </article>
          ))}
          </div>
        </section>

        {/* Benefits section */}
        <div className="bg-gradient-to-br from-blue-50 to-white rounded-2xl p-10 mb-12">
          <h2 className="text-3xl font-bold text-eaa-blue mb-2 text-center">Why Join Chapter 690?</h2>
          <p className="text-center text-gray-500 mb-10">
            Awarded EAA&apos;s top-level <strong>Gold Chapter</strong> status — here&apos;s what you get as a member.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: '🥞',
                title: 'Monthly Pancake Breakfast',
                desc: 'Join us every 1st Saturday for breakfast and a featured aviation presentation, 8–10 AM.',
              },
              {
                icon: '✈️',
                title: 'Young Eagles Program',
                desc: 'Help give free first flights to youth ages 8–17. One of EAA\'s most impactful programs.',
              },
              {
                icon: '🔭',
                title: 'Fly-outs & Fly-ins',
                desc: 'Regular group fly-outs to destinations across the Southeast with fellow pilots.',
              },
              {
                icon: '🏗️',
                title: 'Build Programs',
                desc: 'Hands-on aircraft construction projects with guidance from experienced builders.',
              },
              {
                icon: '🎓',
                title: 'Ground School',
                desc: 'Affordable ground school instruction for student pilots and those pursuing ratings.',
              },
              {
                icon: '🏆',
                title: 'Historic Aircraft Events',
                desc: 'We host legendary aircraft like EAA\'s B-17 "Aluminum Overcast" and the Ford Tri-Motor.',
              },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4 items-start">
                <span className="text-3xl" aria-hidden="true">{icon}</span>
                <div>
                  <h3 className="font-bold text-eaa-blue mb-1">{title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-eaa-blue mb-6 text-center">Common Questions</h2>
          <div className="space-y-4">
            {[
              {
                q: 'Do I need to be a pilot to join?',
                a: 'Absolutely not! EAA Chapter 690 welcomes aviation enthusiasts of all experience levels — from those who have never flown to seasoned airshow performers.',
              },
              {
                q: 'What\'s the difference between EAA National and Chapter 690?',
                a: 'EAA National is the national organization (eaa.org) with over 200,000 members worldwide. Chapter 690 is our local Lawrenceville, GA chapter. A national membership is required to join a chapter.',
              },
              {
                q: 'Can I cancel my recurring membership?',
                a: 'Yes. Individual and Family memberships auto-renew annually, but you can cancel at any time before the renewal date.',
              },
              {
                q: 'Is my chapter membership fee tax-deductible?',
                a: 'EAA Chapter 690 is a 501(c)(3) non-profit. Please consult your tax advisor regarding the deductibility of your membership dues.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                <h3 className="font-semibold text-eaa-blue mb-2">{q}</h3>
                <p className="text-gray-700 text-sm leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="mt-14 text-center">
          <p className="text-gray-600 mb-4">
            Want to make a one-time contribution instead?
          </p>
          <Link
            href="/donate"
            className="inline-block bg-eaa-yellow text-eaa-blue px-8 py-3 rounded-full font-bold text-lg hover:bg-yellow-400 transition-colors motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-eaa-blue"
          >
            Donate Today<span aria-hidden="true"> →</span>
          </Link>
        </div>

      </div>
    </div>
  )
}
