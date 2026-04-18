// NAVCOM — chapter newsletter issues (web + optional PDF)
export default {
  name: 'newsletterIssue',
  title: 'NAVCOM Issue',
  type: 'document',
  fieldsets: [
    {
      name: 'taxonomy',
      title: 'Sections & flags',
      options: { collapsible: true, collapsed: false },
    },
    {
      name: 'pdfFile',
      title: 'PDF',
      options: { collapsible: true, collapsed: false },
    },
    {
      name: 'seo',
      title: 'SEO',
      options: { collapsible: true, collapsed: true },
    },
  ],
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'e.g. "April 2026" or "NAVCOM — April 2026"',
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
      name: 'issueDate',
      title: 'Issue date',
      type: 'datetime',
      description: 'Used for sorting and the public archive.',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'volumeLabel',
      title: 'Volume / issue label',
      type: 'string',
      description: 'Optional — e.g. "Vol. 45 No. 4"',
    },
    {
      name: 'pageCount',
      title: 'Page count',
      type: 'number',
      description: 'Optional — number of pages in the PDF (shown on the issue page).',
      validation: (Rule: any) => Rule.min(1).max(500),
    },
    {
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'Short summary for listings, search, and social previews.',
      validation: (Rule: any) => Rule.max(400),
    },
    {
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: { hotspot: true },
      description: 'Front-page screenshot or a custom cover. Used in archive cards, the issue header, and OpenGraph previews.',
    },
    {
      name: 'coverImageAlt',
      title: 'Cover image alt text',
      type: 'string',
      description:
        'Describe the cover for screen readers. Required when a cover image is set — leave blank only if the cover is purely decorative.',
      validation: (Rule: any) =>
        Rule.max(200).custom(
          (value: string | undefined, context: { parent?: { coverImage?: unknown } }) => {
            if (context.parent?.coverImage && !value?.trim()) {
              return 'Alt text is required when a cover image is set'
            }
            return true
          }
        ),
    },
    {
      name: 'sections',
      title: 'Sections in this issue',
      type: 'array',
      fieldset: 'taxonomy',
      description:
        'Tag the recurring NAVCOM sections that appear in this issue (President\'s Column, Young Eagles, Classifieds, etc.). Drives the section-browse pages.',
      of: [{ type: 'reference', to: [{ type: 'newsletterSection' }] }],
      options: { sortable: true },
    },
    {
      name: 'featured',
      title: 'Highlight this issue',
      type: 'boolean',
      fieldset: 'taxonomy',
      initialValue: false,
      description:
        'Optional — when checked, the issue is shown with a "Featured" badge in the archive and may be promoted on the homepage.',
    },
    {
      name: 'tableOfContents',
      title: 'Table of contents',
      type: 'array',
      description:
        'Optional — editor-curated table of contents for this issue. Each entry can link to a section page-anchor in the PDF or to an external URL.',
      of: [
        {
          type: 'object',
          name: 'tocItem',
          fields: [
            {
              name: 'heading',
              title: 'Heading',
              type: 'string',
              validation: (Rule: any) => Rule.required().max(160),
            },
            {
              name: 'pageNumber',
              title: 'PDF page number',
              type: 'number',
              description:
                'Optional — page in the PDF (1-based). When set we link to "PDF#page=N" so most browsers jump directly there.',
              validation: (Rule: any) => Rule.min(1).max(500),
            },
            {
              name: 'section',
              title: 'Tagged section',
              type: 'reference',
              to: [{ type: 'newsletterSection' }],
              description: 'Optional — link this entry to one of the recurring sections.',
            },
            {
              name: 'summary',
              title: 'Short summary',
              type: 'text',
              rows: 2,
              validation: (Rule: any) => Rule.max(280),
            },
            {
              name: 'externalUrl',
              title: 'External URL (optional override)',
              type: 'url',
              description:
                'If this entry should link somewhere other than the PDF page (e.g. an article on the site), put the full URL here. Internal site paths must start with "/".',
              validation: (Rule: any) =>
                Rule.uri({
                  allowRelative: true,
                  scheme: ['http', 'https'],
                }),
            },
          ],
          preview: {
            select: {
              title: 'heading',
              page: 'pageNumber',
              section: 'section.title',
            },
            prepare({ title, page, section }: { title?: string; page?: number; section?: string }) {
              const parts = [
                page ? `p. ${page}` : null,
                section ? `§ ${section}` : null,
              ].filter(Boolean)
              return {
                title: title || 'Untitled entry',
                subtitle: parts.length > 0 ? parts.join(' · ') : undefined,
              }
            },
          },
        },
      ],
    },
    {
      name: 'content',
      title: 'Web content',
      type: 'array',
      description: 'Optional HTML version. Leave empty for PDF-only issues.',
      of: [
        { type: 'block' },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            { name: 'caption', title: 'Caption', type: 'string' },
            { name: 'alt', title: 'Alt text', type: 'string' },
          ],
        },
      ],
    },
    {
      name: 'pdf',
      title: 'PDF file',
      type: 'file',
      fieldset: 'pdfFile',
      options: {
        accept: 'application/pdf',
      },
      description: 'Upload the issue PDF here when not using an external link.',
    },
    {
      name: 'pdfUrl',
      title: 'External PDF link',
      type: 'url',
      fieldset: 'pdfFile',
      description: 'e.g. Google Drive — use when the PDF is hosted elsewhere.',
      validation: (Rule: any) =>
        Rule.uri({
          allowRelative: false,
          scheme: ['http', 'https'],
        }),
    },
    {
      name: 'seoTitle',
      title: 'SEO title',
      type: 'string',
      fieldset: 'seo',
      description: 'Overrides browser title; defaults to issue title.',
    },
    {
      name: 'seoDescription',
      title: 'SEO description',
      type: 'text',
      rows: 2,
      fieldset: 'seo',
      validation: (Rule: any) => Rule.max(300),
    },
  ],
  orderings: [
    {
      title: 'Issue date (newest first)',
      name: 'issueDateDesc',
      by: [{ field: 'issueDate', direction: 'desc' }],
    },
    {
      title: 'Issue date (oldest first)',
      name: 'issueDateAsc',
      by: [{ field: 'issueDate', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      date: 'issueDate',
      media: 'coverImage',
      featured: 'featured',
    },
    prepare({ title, date, media, featured }: { title?: string; date?: string; media?: unknown; featured?: boolean }) {
      const subtitle = date
        ? new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric', day: 'numeric' })
        : 'No date'
      return {
        title: (featured ? '★ ' : '') + (title || 'Untitled'),
        subtitle,
        media: media as any,
      }
    },
  },
}
