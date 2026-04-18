// Singleton: NAVCOM newsletter page settings (hero image, title, tagline, intro).
// Mirrors the kudosPage / newsPage pattern so editors can update the
// /newsletter hero & messaging without code changes.
export default {
  name: 'newsletterPage',
  title: 'NAVCOM Page',
  type: 'document',
  fields: [
    {
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      options: { hotspot: true },
      description:
        'Optional full-width banner shown above the NAVCOM archive. Leave blank to show a text-only header.',
    },
    {
      name: 'heroImageAlt',
      title: 'Hero image alt text',
      type: 'string',
      description:
        'Describe the image for screen readers. Required when a hero image is set — leave blank only if the image is purely decorative.',
      validation: (Rule: any) =>
        Rule.max(200).custom(
          (value: string | undefined, context: { parent?: { heroImage?: unknown } }) => {
            if (context.parent?.heroImage && !value?.trim()) {
              return 'Alt text is required when a hero image is set'
            }
            return true
          }
        ),
    },
    {
      name: 'pageTitle',
      title: 'Page title',
      type: 'string',
      initialValue: 'NAVCOM newsletter',
      description: 'Heading shown at the top of the page.',
    },
    {
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      initialValue: 'Navigation Communication — published monthly.',
      description: 'Short emphasized phrase shown under the title.',
    },
    {
      name: 'intro',
      title: 'Intro paragraph',
      type: 'text',
      rows: 4,
      initialValue:
        'NAVCOM is the official newsletter of EAA Chapter 690, published monthly with chapter news, programs, member stories, and aviation features. Browse recent issues below — read each issue on the web or download the original PDF.',
      description: 'Paragraph shown under the tagline.',
    },
    {
      name: 'subscribeBlurb',
      title: 'Subscribe blurb (above the inline subscribe CTA)',
      type: 'text',
      rows: 2,
      initialValue:
        'Want NAVCOM in your inbox each month? Subscribe to our chapter mailing list — no spam, just aviation.',
    },
    {
      name: 'seoTitle',
      title: 'SEO title (optional)',
      type: 'string',
      description: 'Override the default browser tab / search-engine title for /newsletter.',
    },
    {
      name: 'seoDescription',
      title: 'SEO description (optional)',
      type: 'text',
      rows: 2,
      validation: (Rule: any) => Rule.max(300),
      description: 'Override the default meta description for /newsletter.',
    },
  ],
  preview: {
    prepare() {
      return { title: 'NAVCOM Page' }
    },
  },
}
