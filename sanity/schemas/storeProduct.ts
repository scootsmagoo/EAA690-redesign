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
      description: 'Text shown to visitors on the product card, e.g. "$150.00" or "$35.00 every 12 months". Must match the Price (USD) field exactly — the displayed price and the charged amount are separate fields. For recurring Stripe prices write the full label here (e.g. "$35.00/year").',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'shortDescription',
      title: 'Short description (plain text)',
      type: 'text',
      rows: 3,
      description: 'Simple one-liner shown as plain text. Use "Description (rich)" below if you need links or formatting.',
    },
    {
      name: 'descriptionRich',
      title: 'Description (rich)',
      type: 'array',
      description: 'Replaces the plain short description when present. Supports links, bold, italic, and multiple paragraphs.',
      of: [
        {
          type: 'block',
          styles: [{ title: 'Normal', value: 'normal' }],
          lists: [],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
            ],
            annotations: [
              {
                name: 'link',
                type: 'object',
                title: 'Link',
                fields: [
                  {
                    name: 'href',
                    type: 'string',
                    title: 'URL or path',
                    description: 'https://… for external links, or /programs/young-eagles for internal paths.',
                    validation: (Rule: any) =>
                      Rule.required().custom((value: string | undefined) => {
                        if (!value) return 'Required'
                        if (
                          value.startsWith('https://') ||
                          value.startsWith('http://') ||
                          value.startsWith('/')
                        )
                          return true
                        return 'Must start with https://, http://, or /'
                      }),
                  },
                ],
              },
            ],
          },
        },
      ],
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
      name: 'unitAmountDollars',
      title: 'Price (USD)',
      type: 'number',
      description:
        'One-time price in dollars (e.g. 150 = $150.00) when no Stripe Price ID. Checkout amounts are validated on the server—do not use for recurring memberships; use a Stripe Price ID for subscriptions.',
      validation: (Rule: any) => Rule.min(0.5).max(5000),
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
