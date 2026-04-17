/**
 * Program landing pages under /programs/[slug]. Sections are composable blocks
 * (alerts, rich cards, pricing, forms, etc.).
 */

const programBlock = {
  type: 'block',
  styles: [
    { title: 'Normal', value: 'normal' },
    { title: 'Heading 3', value: 'h3' },
    { title: 'Heading 4', value: 'h4' },
  ],
  lists: [
    { title: 'Bullet', value: 'bullet' },
    { title: 'Numbered', value: 'number' },
  ],
  marks: {
    decorators: [
      { title: 'Strong', value: 'strong' },
      { title: 'Emphasis', value: 'em' },
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
            description: 'https://… or an internal path like /privacy',
          },
        ],
      },
    ],
  },
}

/**
 * Inline image embedded inside a Content card body. Editors can place an image
 * with text wrapping around it (float left/right), centered, or full-width —
 * matching the legacy site behavior on pages like /vmc-imc-club.
 */
const programInlineImage = {
  type: 'image',
  options: { hotspot: true },
  fields: [
    {
      name: 'isDecorative',
      title: 'This image is purely decorative',
      type: 'boolean',
      initialValue: false,
      description:
        'Tick when the image carries no information (e.g. a divider or ornamental photo). Decorative images are hidden from screen readers (WCAG 1.1.1) and do not require alt text.',
    },
    {
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description:
        'Describe the image for screen readers. Required unless the image is marked as decorative.',
      validation: (Rule: any) =>
        Rule.max(220).custom(
          (value: string | undefined, context: { parent?: { isDecorative?: boolean } }) => {
            if (context.parent?.isDecorative) return true
            if (!value || !value.trim()) {
              return 'Alt text is required (or mark the image as decorative).'
            }
            return true
          }
        ),
    },
    {
      name: 'caption',
      title: 'Caption (optional)',
      type: 'string',
      description:
        'Short caption shown beneath the image. Hidden when the image is decorative.',
      validation: (Rule: any) => Rule.max(300),
    },
    {
      name: 'align',
      title: 'Alignment',
      type: 'string',
      initialValue: 'right',
      options: {
        list: [
          { title: 'Float right (text wraps on the left)', value: 'right' },
          { title: 'Float left (text wraps on the right)', value: 'left' },
          { title: 'Centered (no text wrap)', value: 'center' },
          { title: 'Full width (no text wrap)', value: 'full' },
        ],
        layout: 'radio',
      },
      description:
        'On phones the image always stacks above the next paragraph regardless of this setting.',
    },
    {
      name: 'size',
      title: 'Size (desktop)',
      type: 'string',
      initialValue: 'md',
      options: {
        list: [
          { title: 'Small (~25% width)', value: 'sm' },
          { title: 'Medium (~33% width)', value: 'md' },
          { title: 'Large (~50% width)', value: 'lg' },
        ],
        layout: 'radio',
      },
      description: 'Ignored when alignment is set to Full width.',
    },
  ],
  preview: {
    select: { media: 'asset', alt: 'alt', align: 'align' },
    prepare({ media, alt, align }: any) {
      return {
        title: (typeof alt === 'string' && alt.trim()) || 'Inline image',
        subtitle: align ? `align: ${align}` : 'inline image',
        media,
      }
    },
  },
}

export const programSectionAlert = {
  name: 'programSectionAlert',
  title: 'Alert (highlight box)',
  type: 'object',
  fields: [
    { name: 'title', title: 'Title', type: 'string', validation: (Rule: any) => Rule.required() },
    {
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [programBlock],
      validation: (Rule: any) => Rule.required(),
    },
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }: { title?: string }) {
      return { title: title || 'Alert', subtitle: 'Highlight box' }
    },
  },
}

export const programSectionRich = {
  name: 'programSectionRich',
  title: 'Content card',
  type: 'object',
  fields: [
    {
      name: 'heading',
      title: 'Heading (optional)',
      type: 'string',
      description: 'Leave empty for a plain content block without a section title.',
    },
    {
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [programBlock, programInlineImage],
      validation: (Rule: any) => Rule.required(),
      description:
        'Use the “Insert” menu to add images that float beside the text (or sit centered/full-width). For dedicated side-by-side layouts, use the separate “Image + text” section instead.',
    },
  ],
  preview: {
    select: { heading: 'heading' },
    prepare({ heading }: { heading?: string }) {
      return { title: heading?.trim() || 'Content card', subtitle: 'White card' }
    },
  },
}

/**
 * Side-by-side image + text card. Distinct from inline images inside a Content
 * card: this enforces a clean two-column desktop layout with no float quirks.
 */
export const programSectionImageText = {
  name: 'programSectionImageText',
  title: 'Image + text (side by side)',
  type: 'object',
  fields: [
    {
      name: 'heading',
      title: 'Heading (optional)',
      type: 'string',
      description: 'Shown above the two-column layout.',
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: { hotspot: true },
      validation: (Rule: any) => Rule.required(),
      fields: [
        {
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          validation: (Rule: any) =>
            Rule.required().min(1).max(220).error('Alt text is required.'),
        },
        {
          name: 'caption',
          title: 'Caption (optional)',
          type: 'string',
          validation: (Rule: any) => Rule.max(300),
        },
      ],
    },
    {
      name: 'imagePosition',
      title: 'Image position (desktop)',
      type: 'string',
      initialValue: 'right',
      options: {
        list: [
          { title: 'Right of text', value: 'right' },
          { title: 'Left of text', value: 'left' },
        ],
        layout: 'radio',
      },
      description: 'Mobile always stacks the image above the text.',
    },
    {
      name: 'imageWidth',
      title: 'Image column width (desktop)',
      type: 'string',
      initialValue: 'third',
      options: {
        list: [
          { title: 'One third', value: 'third' },
          { title: 'Half', value: 'half' },
        ],
        layout: 'radio',
      },
    },
    {
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [programBlock],
      validation: (Rule: any) => Rule.required(),
    },
  ],
  preview: {
    select: { heading: 'heading', media: 'image', position: 'imagePosition' },
    prepare({ heading, media, position }: any) {
      return {
        title: (typeof heading === 'string' && heading.trim()) || 'Image + text',
        subtitle: `Image ${position === 'left' ? 'left' : 'right'} of text`,
        media,
      }
    },
  },
}

export const programSectionFeatureColumns = {
  name: 'programSectionFeatureColumns',
  title: 'Feature columns (3-up)',
  type: 'object',
  fields: [
    {
      name: 'columns',
      title: 'Columns',
      type: 'array',
      validation: (Rule: any) => Rule.required().min(1).max(4),
      of: [
        {
          type: 'object',
          fields: [
            { name: 'title', title: 'Title', type: 'string', validation: (Rule: any) => Rule.required() },
            {
              name: 'body',
              title: 'Body',
              type: 'text',
              rows: 5,
              validation: (Rule: any) => Rule.required().max(4000),
            },
          ],
          preview: {
            select: { title: 'title' },
            prepare({ title }: { title?: string }) {
              return { title: title || 'Column' }
            },
          },
        },
      ],
    },
  ],
  preview: {
    prepare() {
      return { title: 'Feature columns', subtitle: 'Up to 4 cards' }
    },
  },
}

export const programSectionPdfLinks = {
  name: 'programSectionPdfLinks',
  title: 'Document / PDF links',
  type: 'object',
  fields: [
    {
      name: 'sectionHeading',
      title: 'Section heading',
      type: 'string',
      initialValue: 'Program documents',
    },
    {
      name: 'intro',
      title: 'Intro (optional)',
      type: 'array',
      of: [programBlock],
    },
    {
      name: 'links',
      title: 'Links',
      type: 'array',
      validation: (Rule: any) => Rule.required().min(1),
      of: [
        {
          type: 'object',
          fields: [
            { name: 'label', title: 'Link label', type: 'string', validation: (Rule: any) => Rule.required() },
            {
              name: 'url',
              title: 'URL',
              type: 'url',
              validation: (Rule: any) => Rule.required().uri({ allowRelative: false, scheme: ['http', 'https'] }),
            },
          ],
          preview: {
            select: { label: 'label', url: 'url' },
            prepare({ label, url }: { label?: string; url?: string }) {
              return { title: label || 'Link', subtitle: url }
            },
          },
        },
      ],
    },
    {
      name: 'documentsGate',
      title: 'Respect “documents visible” site setting for…',
      type: 'string',
      initialValue: 'none',
      options: {
        list: [
          { title: 'Always show this block', value: 'none' },
          { title: 'Youth Aviation Program (Site Settings)', value: 'youthAviation' },
          { title: 'Scholarships (Site Settings)', value: 'scholarship' },
        ],
        layout: 'radio',
      },
      description:
        'When Youth Aviation or Scholarships is selected, this block hides when that program’s PDFs are turned off in Site Settings.',
    },
  ],
  preview: {
    prepare() {
      return { title: 'Document links', subtitle: 'PDFs / Drive' }
    },
  },
}

export const programSectionPricing = {
  name: 'programSectionPricing',
  title: 'Pricing tiers',
  type: 'object',
  fields: [
    { name: 'sectionHeading', title: 'Section heading', type: 'string', validation: (Rule: any) => Rule.required() },
    {
      name: 'intro',
      title: 'Intro (optional)',
      type: 'array',
      of: [programBlock],
    },
    {
      name: 'tiers',
      title: 'Tiers',
      type: 'array',
      validation: (Rule: any) => Rule.required().min(1),
      of: [
        {
          type: 'object',
          fields: [
            { name: 'name', title: 'Name', type: 'string', validation: (Rule: any) => Rule.required() },
            {
              name: 'subtitle',
              title: 'Subtitle (e.g. ages)',
              type: 'string',
              description: 'Plain text; use an en dash for age ranges if needed.',
            },
            { name: 'price', title: 'Price', type: 'string', validation: (Rule: any) => Rule.required() },
            {
              name: 'note',
              title: 'Note',
              type: 'string',
              description: 'e.g. “Waitlist open”',
            },
          ],
          preview: {
            select: { name: 'name', price: 'price' },
            prepare({ name, price }: { name?: string; price?: string }) {
              return { title: name || 'Tier', subtitle: price }
            },
          },
        },
      ],
    },
  ],
  preview: {
    prepare() {
      return { title: 'Pricing tiers' }
    },
  },
}

export const programSectionForm = {
  name: 'programSectionForm',
  title: 'Program form',
  type: 'object',
  fields: [
    {
      name: 'sectionHeading',
      title: 'Section heading',
      type: 'string',
      initialValue: 'Apply / sign up',
    },
    {
      name: 'intro',
      title: 'Intro (optional)',
      type: 'array',
      of: [programBlock],
      description: 'Shown above the form. Link to /privacy if you explain data use.',
    },
    {
      name: 'formKey',
      title: 'Form',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
      options: {
        list: [
          { title: 'Summer Camp waitlist', value: 'summer_camp' },
          { title: 'Scholarships', value: 'scholarship' },
          { title: 'Youth Aviation Program', value: 'youth_aviation' },
          { title: 'VMC/IMC Club signup', value: 'vmc_imc' },
          { title: 'Outreach / event request (Heidi)', value: 'outreach' },
        ],
      },
      description: 'Field layout and validation are defined in the website code; open/closed is controlled in Site Settings.',
    },
  ],
  preview: {
    select: { formKey: 'formKey', sectionHeading: 'sectionHeading' },
    prepare({ formKey, sectionHeading }: { formKey?: string; sectionHeading?: string }) {
      return { title: sectionHeading || 'Program form', subtitle: formKey }
    },
  },
}

export const programSectionVideoEmbed = {
  name: 'programSectionVideoEmbed',
  title: 'Video embed (YouTube / Vimeo)',
  type: 'object',
  fields: [
    {
      name: 'heading',
      title: 'Heading (optional)',
      type: 'string',
      description: 'Shown above the video. Leave empty to render just the video and caption.',
    },
    {
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      validation: (Rule: any) =>
        Rule.required()
          .uri({ scheme: ['http', 'https'] })
          .custom((url: string | undefined) => {
            if (!url) return 'Required'
            try {
              const u = new URL(url)
              const host = u.hostname.toLowerCase()
              const ok =
                host === 'www.youtube.com' ||
                host === 'youtube.com' ||
                host === 'youtu.be' ||
                host === 'vimeo.com' ||
                host === 'player.vimeo.com'
              return ok
                ? true
                : 'Only YouTube (youtube.com / youtu.be) and Vimeo (vimeo.com) URLs are supported.'
            } catch {
              return 'Enter a valid URL'
            }
          }),
      description:
        'Paste the regular share URL (e.g. https://youtu.be/xetdW5lEKbM or https://www.youtube.com/watch?v=xetdW5lEKbM). The site converts it to a privacy-friendly youtube-nocookie.com embed automatically.',
    },
    {
      name: 'caption',
      title: 'Caption (optional)',
      type: 'string',
      description: 'Short line shown under the heading, above the video.',
      validation: (Rule: any) => Rule.max(280),
    },
  ],
  preview: {
    select: { heading: 'heading', videoUrl: 'videoUrl' },
    prepare({ heading, videoUrl }: { heading?: string; videoUrl?: string }) {
      return {
        title: heading?.trim() || 'Video embed',
        subtitle: videoUrl || 'YouTube / Vimeo',
      }
    },
  },
}

const ctaButtonItem = {
  type: 'object',
  fields: [
    {
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (Rule: any) => Rule.required().max(120),
    },
    {
      name: 'href',
      title: 'URL or path',
      type: 'string',
      validation: (Rule: any) => Rule.required().max(512),
      description: 'https://… or an internal path like /programs/young-eagles',
    },
  ],
  preview: {
    select: { label: 'label', href: 'href' },
    prepare({ label, href }: { label?: string; href?: string }) {
      return { title: label || 'Button', subtitle: href }
    },
  },
}

export const programSectionCta = {
  name: 'programSectionCta',
  title: 'Call-to-action banner',
  type: 'object',
  fields: [
    { name: 'title', title: 'Title', type: 'string', validation: (Rule: any) => Rule.required() },
    {
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [programBlock],
    },
    {
      name: 'buttons',
      title: 'Buttons',
      type: 'array',
      of: [ctaButtonItem],
      validation: (Rule: any) => Rule.max(4),
      description: 'One or more buttons (e.g. external link + chapter registration). Shown in a row on wide screens.',
    },
    {
      name: 'buttonLabel',
      title: 'Single button label (legacy)',
      type: 'string',
      description:
        'Only used if Buttons is empty. Prefer adding one or more entries under Buttons for new content.',
    },
    {
      name: 'buttonHref',
      title: 'Single button URL (legacy)',
      type: 'string',
      description: 'Only used if Buttons is empty.',
    },
    {
      name: 'style',
      title: 'Style',
      type: 'string',
      initialValue: 'blue',
      options: {
        list: [
          { title: 'Blue', value: 'blue' },
          { title: 'Yellow', value: 'yellow' },
        ],
        layout: 'radio',
      },
    },
  ],
  preview: {
    select: { title: 'title', buttons: 'buttons' },
    prepare({ title, buttons }: { title?: string; buttons?: unknown[] }) {
      const n = Array.isArray(buttons) ? buttons.length : 0
      return { title: title || 'CTA', subtitle: n ? `${n} button(s)` : 'Banner' }
    },
  },
}

export const programSectionTypes = [
  programSectionAlert,
  programSectionRich,
  programSectionImageText,
  programSectionFeatureColumns,
  programSectionPdfLinks,
  programSectionPricing,
  programSectionForm,
  programSectionVideoEmbed,
  programSectionCta,
]

export default {
  name: 'programPage',
  title: 'Program page',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Page title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (Rule: any) =>
        Rule.required().custom((slug: { current?: string } | undefined) => {
          const s = slug?.current?.trim() ?? ''
          if (!s) return 'Required'
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) {
            return 'Use lowercase letters, numbers, and hyphens only'
          }
          return true
        }),
    },
    {
      name: 'subtitle',
      title: 'Subtitle (optional)',
      type: 'string',
      description: 'One line under the title (e.g. audience · location).',
    },
    {
      name: 'navLabel',
      title: 'Navigation label',
      type: 'string',
      description: 'Short label in the Programs menu. Defaults to the page title.',
    },
    {
      name: 'showInMainNav',
      title: 'Show in site “Programs” menu',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'navSortOrder',
      title: 'Menu sort order',
      type: 'number',
      initialValue: 0,
      description: 'Lower numbers appear first in the Programs dropdown.',
    },
    {
      name: 'shortDescription',
      title: 'Short description (programs index)',
      type: 'text',
      rows: 2,
      validation: (Rule: any) => Rule.max(400),
      description: 'Shown on /programs card grid.',
    },
    {
      name: 'showOnProgramsIndex',
      title: 'Show on /programs listing',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'indexSortOrder',
      title: 'Index sort order',
      type: 'number',
      initialValue: 0,
      description: 'Lower numbers first on the programs index page.',
    },
    {
      name: 'sections',
      title: 'Page sections',
      type: 'array',
      of: programSectionTypes.map((s) => ({ type: s.name })),
      validation: (Rule: any) => Rule.required().min(1),
    },
    {
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        { name: 'metaTitle', title: 'Meta title', type: 'string' },
        { name: 'metaDescription', title: 'Meta description', type: 'text', rows: 3, validation: (Rule: any) => Rule.max(320) },
      ],
    },
  ],
  preview: {
    select: { title: 'title', slug: 'slug.current' },
    prepare({ title, slug }: { title?: string; slug?: string }) {
      return { title: title || 'Program', subtitle: slug ? `/programs/${slug}` : '' }
    },
  },
}
