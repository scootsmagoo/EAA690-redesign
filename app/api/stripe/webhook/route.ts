import { NextRequest, NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import type Stripe from 'stripe'

export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!sig || !secret) {
    return NextResponse.json({ error: 'Missing stripe signature or webhook secret' }, { status: 400 })
  }

  // App Router: read the raw body text before Stripe signature verification.
  // Stripe requires the exact raw bytes — do not parse as JSON first.
  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(rawBody, sig, secret)
  } catch (err) {
    // Log the error class but not the full error to avoid leaking secret material
    console.error('Webhook signature verification failed:', (err as Error)?.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    await handleEvent(event)
  } catch (err) {
    // Return 200 so Stripe does not retry indefinitely — error is already logged
    console.error(`Webhook handler error [${event.type}]:`, (err as Error)?.message)
    return NextResponse.json({ received: true, error: 'Handler error (logged)' })
  }

  return NextResponse.json({ received: true })
}

async function handleEvent(event: Stripe.Event) {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const meta = session.metadata ?? {}

      // Log without PII — use Stripe IDs only
      console.log('Checkout completed:', {
        type: meta.type,
        tier: meta.tier,
        sessionId: session.id,
        customerId: session.customer,
        amountTotal: session.amount_total,
      })

      if (meta.type === 'membership') {
        // TODO: Store session.customer (Stripe customer ID) on the matching user record
        // so the Customer Portal and subscription management can work.
        // Example: await updateUserStripeCustomerId(session.customer_email, session.customer)
      }

      if (meta.type === 'donation') {
        // TODO: Send thank-you email or log to analytics
      }

      if (meta.type === 'store_product' || meta.type === 'store_cart') {
        // TODO: Trigger fulfillment / notify admin
      }
      break
    }

    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      console.log('Subscription updated:', { id: sub.id, status: sub.status })
      // TODO: Sync subscription status to user record
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      console.log('Subscription cancelled:', { id: sub.id })
      // TODO: Mark membership as expired in user record
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      console.warn('Payment failed:', { invoiceId: invoice.id, amountDue: invoice.amount_due })
      // TODO: Email the member or flag the account
      break
    }

    default:
      break
  }
}
