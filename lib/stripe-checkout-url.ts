/**
 * OWASP: prevent open redirects — only navigate to Stripe-hosted checkout URLs.
 * (Checkout Session `url` is always under checkout.stripe.com today.)
 */
export function isStripeHostedCheckoutUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && u.hostname === 'checkout.stripe.com'
  } catch {
    return false
  }
}
