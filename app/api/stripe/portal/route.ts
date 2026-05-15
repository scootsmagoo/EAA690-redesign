import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { getSiteBaseURL } from '@/lib/site-url'
import { requireApprovedSession } from '@/lib/account-approval'

/**
 * POST /api/stripe/portal
 * Generates a Stripe Customer Portal session for the logged-in user.
 *
 * SECURITY: stripeCustomerId is NEVER accepted from the request body — it must
 * only be read from the server-side session / database record.  Accepting it
 * from the client would be an IDOR: any logged-in user could open another
 * customer's billing portal by supplying a different ID.
 */
export async function POST(request: NextRequest) {
  const auth = await requireApprovedSession(request)
  if (auth instanceof NextResponse) return auth

  // stripeCustomerId is stored on the user record in the database.
  // It is populated by the checkout.session.completed webhook when a user first
  // pays; until that webhook fires it will be absent.
  const stripeCustomerId = (auth.user as Record<string, unknown>)?.stripeCustomerId as
    | string
    | undefined

  if (!stripeCustomerId) {
    return NextResponse.json(
      {
        error:
          'No billing account found. Complete a membership or donation checkout first.',
      },
      { status: 404 }
    )
  }

  try {
    const portalSession = await getStripe().billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${getSiteBaseURL()}/account`,
    })
    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error('Stripe portal error:', error)
    return NextResponse.json({ error: 'Failed to create portal session' }, { status: 500 })
  }
}
