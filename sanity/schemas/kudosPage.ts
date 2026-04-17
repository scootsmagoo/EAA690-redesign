// Singleton: Kudos page settings (hero image, title, tagline, intro)
// Mirrors the newsPage / mediaPage pattern so editors can update the
// /kudos hero & messaging without code changes.
export default {
  name: 'kudosPage',
  title: 'Kudos Page',
  type: 'document',
  fields: [
    {
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      options: { hotspot: true },
      description:
        'Optional full-width banner shown above the kudos listing. Leave blank to show a text-only header.',
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
      initialValue: 'Kudos',
      description: 'Heading shown at the top of the page.',
    },
    {
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      initialValue: 'It all begins with a spark…',
      description: 'Short emphasized phrase shown under the title.',
    },
    {
      name: 'intro',
      title: 'Intro paragraph',
      type: 'text',
      rows: 3,
      initialValue:
        'EAA 690 has a long history of successes — both seasoned pilots and students alike. We’d like to toot our own horn a bit and share them here.',
      description: 'Paragraph shown under the tagline.',
    },
    {
      name: 'seoTitle',
      title: 'SEO title (optional)',
      type: 'string',
      description: 'Override the default browser tab / search-engine title for /kudos.',
    },
    {
      name: 'seoDescription',
      title: 'SEO description (optional)',
      type: 'text',
      rows: 2,
      validation: (Rule: any) => Rule.max(300),
      description: 'Override the default meta description for /kudos.',
    },
  ],
  preview: {
    prepare() {
      return { title: 'Kudos Page' }
    },
  },
}
