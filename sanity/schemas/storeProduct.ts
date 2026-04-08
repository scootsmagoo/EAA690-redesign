export default {
  name: 'storeProduct',
  title: 'Store Product',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'priceDisplay',
      title: 'Price (display)',
      type: 'string',
      description: 'Exact text shown to visitors, e.g. "$15.00" or "$35.00 every 12 months"',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'shortDescription',
      title: 'Short description',
      type: 'text',
      rows: 3,
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
    },
    {
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'reference', to: [{ type: 'storeCategory' }] }],
      validation: (Rule: any) => Rule.required().min(1),
    },
    {
      name: 'stripePriceId',
      title: 'Stripe Price ID',
      type: 'string',
      description:
        'Paste the Stripe Price ID (e.g. price_1ABCxyz…) from Stripe Dashboard → Products. Preferred for checkout. Takes priority over unit amount and purchase URL.',
    },
    {
      name: 'unitAmountCents',
      title: 'Unit amount (USD cents)',
      type: 'number',
      description:
        'Optional one-time price in whole cents (e.g. 1500 = $15.00) when no Stripe Price ID. Checkout amounts are validated on the server from the catalog—do not use for recurring memberships; use a Stripe Price ID for subscriptions.',
    },
    {
      name: 'externalPurchaseUrl',
      title: 'Purchase URL (fallback)',
      type: 'url',
      description:
        'Only if this product cannot use Stripe on this site (e.g. legacy recurring flow). Otherwise leave empty and set Stripe Price ID or unit amount above.',
    },
    {
      name: 'sortOrder',
      title: 'Sort order',
      type: 'number',
      description: 'Lower numbers list first within the same category',
      initialValue: 0,
    },
    {
      name: 'isActive',
      title: 'Active',
      type: 'boolean',
      initialValue: true,
    },
  ],
  preview: {
    select: {
      title: 'title',
      price: 'priceDisplay',
      media: 'image',
      active: 'isActive',
    },
    prepare(selection: Record<string, unknown>) {
      const title = selection.title as string | undefined
      const price = selection.price as string | undefined
      const active = selection.active as boolean | undefined
      return {
        title: title || 'Product',
        subtitle: [price, active === false ? '(hidden)' : ''].filter(Boolean).join(' '),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Sanity preview media typing
        media: selection.media as any,
      }
    },
  },
}
