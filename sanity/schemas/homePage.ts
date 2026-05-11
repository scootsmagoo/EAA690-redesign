// Singleton: marketing content for the site home page (/)

/** Block styles: no H2 here (page uses H1 + section H2s) — use H3/H4 for subsections only. */
const homeColumnBlock = {
  type: 'block',
  styles: [
    { title: 'Normal', value: 'normal' },
    { title: 'Heading 3', value: 'h3' },
    { title: 'Heading 4', value: 'h4' },
    { title: 'Quote', value: 'blockquote' },
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
            description: 'https://… or an internal path like /programs/young-eagles',
          },
        ],
      },
    ],
  },
}

const imageWithAlt = {
  type: 'image',
  options: { hotspot: true },
  fields: [
    {
      name: 'alt',
      type: 'string',
      title: 'Alternative text',
      description:
        'Describe the image for people using screen readers. Leave empty only if the image is purely decorative.',
      validation: (Rule: any) => Rule.max(220),
    },
  ],
}

const programCardFields = [
  {
    name: 'icon',
    title: 'Icon',
    type: 'string',
    description: 'Single emoji or short symbol shown above the title.',
    validation: (Rule: any) => Rule.required().max(8),
  },
  {
    name: 'name',
    title: 'Program name',
    type: 'string',
    validation: (Rule: any) => Rule.required(),
  },
  {
    name: 'description',
    title: 'Description',
    type: 'text',
    rows: 3,
    validation: (Rule: any) => Rule.required(),
  },
  {
    name: 'href',
    title: 'Link path',
    type: 'string',
    description: 'Internal path, e.g. /programs/young-eagles',
    validation: (Rule: any) =>
      Rule.required().custom((value: string | undefined) => {
        if (!value || typeof value !== 'string') return 'Required'
        const v = value.trim()
        if (!v.startsWith('/')) return 'Must start with /'
        if (v.startsWith('//')) return 'Use a site path like /programs/…, not //…'
        if (/\s/.test(v)) return 'No spaces in path'
        return true
      }),
  },
  {
    name: 'cta',
    title: 'Button label',
    type: 'string',
    validation: (Rule: any) => Rule.required(),
  },
]

export default {
  name: 'homePage',
  title: 'Home Page',
  type: 'document',
  fields: [
    {
      name: 'heroHeadline',
      title: 'Hero headline',
      type: 'string',
      initialValue: 'Welcome to EAA 690',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'heroIntro',
      title: 'Hero introduction',
      type: 'array',
      of: [homeColumnBlock, imageWithAlt],
      description:
        'Main welcome text. Use normal paragraphs; use Heading 3/4 only for small subsections (the page title is Heading 1). You can insert images — add alternative text unless the image is decorative.',
    },
    {
      name: 'heroVisual',
      title: 'Hero right column',
      type: 'string',
      initialValue: 'goldBadge',
      options: {
        list: [
          { title: 'Gold Chapter badge', value: 'goldBadge' },
          { title: 'Photo / image', value: 'heroImage' },
        ],
        layout: 'radio',
      },
    },
    {
      name: 'heroImage',
      title: 'Hero image',
      type: 'image',
      options: { hotspot: true },
      hidden: ({ parent }: { parent?: { heroVisual?: string } }) =>
        parent?.heroVisual !== 'heroImage',
    },
    {
      name: 'heroImageAlt',
      title: 'Hero image alternative text',
      type: 'string',
      description: 'Short description for screen readers. Shown when Hero right column is a photo.',
      hidden: ({ parent }: { parent?: { heroVisual?: string } }) =>
        parent?.heroVisual !== 'heroImage',
      validation: (Rule: any) => Rule.max(180),
    },
    {
      name: 'goldBadgeCode',
      title: 'Gold badge code line',
      type: 'string',
      description: 'Small text under GOLD CHAPTER (e.g. EAA 020-202).',
      hidden: ({ parent }: { parent?: { heroVisual?: string } }) =>
        parent?.heroVisual !== 'goldBadge',
    },
    {
      name: 'programsSectionTitle',
      title: 'Programs section title',
      type: 'string',
      description: 'Heading above the grid of program cards on the home page.',
    },
    {
      name: 'programsSectionSubtitle',
      title: 'Programs section subtitle',
      type: 'text',
      rows: 2,
    },
    {
      name: 'programCards',
      title: 'Program cards',
      description:
        'Cards in the “Get Involved” / programs area on the home page (icon, title, blurb, link path, and button label). When this list is empty (or a row is missing required fields), the public site uses built-in defaults from the app instead—publish a full set here to control links and copy in Sanity without a deployment.',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'homeProgramCard',
          fields: programCardFields,
          preview: {
            select: { name: 'name', href: 'href' },
            prepare({ name, href }: { name?: string; href?: string }) {
              return { title: name || 'Program', subtitle: href }
            },
          },
        },
      ],
    },
    {
      name: 'pancakeSectionEnabled',
      title: 'Show pancake breakfast section',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'pancakeTitle',
      title: 'Pancake section heading',
      type: 'string',
      hidden: ({ parent }: { parent?: { pancakeSectionEnabled?: boolean } }) =>
        !parent?.pancakeSectionEnabled,
    },
    {
      name: 'pancakeIntro',
      title: 'Pancake intro line',
      type: 'string',
      description: 'Line under the main heading.',
      hidden: ({ parent }: { parent?: { pancakeSectionEnabled?: boolean } }) =>
        !parent?.pancakeSectionEnabled,
    },
    {
      name: 'pancakeBreakfastTime',
      title: 'Breakfast serving time',
      type: 'string',
      description: 'e.g. Breakfast served 8:00 to 10:00 AM',
      hidden: ({ parent }: { parent?: { pancakeSectionEnabled?: boolean } }) =>
        !parent?.pancakeSectionEnabled,
    },
    {
      name: 'pancakeProgramTime',
      title: 'Program time',
      type: 'string',
      description: 'e.g. Program at 10:00 AM',
      hidden: ({ parent }: { parent?: { pancakeSectionEnabled?: boolean } }) =>
        !parent?.pancakeSectionEnabled,
    },
    {
      name: 'pancakePriceNote',
      title: 'Price / notes',
      type: 'string',
      description: 'Shown in red in the white card (e.g. price change notice).',
      hidden: ({ parent }: { parent?: { pancakeSectionEnabled?: boolean } }) =>
        !parent?.pancakeSectionEnabled,
    },
    {
      name: 'spotlightEnabled',
      title: 'Show featured presentation / spotlight section',
      type: 'boolean',
      initialValue: true,
    },
    {
      name: 'spotlightTitle',
      title: 'Spotlight heading',
      type: 'string',
      description: 'e.g. date and time of the monthly program',
      hidden: ({ parent }: { parent?: { spotlightEnabled?: boolean } }) => !parent?.spotlightEnabled,
    },
    {
      name: 'spotlightSubtitle',
      title: 'Spotlight subheading',
      type: 'string',
      description: 'e.g. Speaker — topic',
      hidden: ({ parent }: { parent?: { spotlightEnabled?: boolean } }) => !parent?.spotlightEnabled,
    },
    {
      name: 'spotlightImage',
      title: 'Spotlight image',
      type: 'image',
      options: { hotspot: true },
      hidden: ({ parent }: { parent?: { spotlightEnabled?: boolean } }) => !parent?.spotlightEnabled,
    },
    {
      name: 'spotlightImageAlt',
      title: 'Spotlight image alternative text',
      type: 'string',
      description: 'Describe the photo for screen readers. Falls back to the spotlight headings if empty.',
      hidden: ({ parent }: { parent?: { spotlightEnabled?: boolean } }) => !parent?.spotlightEnabled,
      validation: (Rule: any) => Rule.max(180),
    },
    {
      name: 'spotlightBody',
      title: 'Spotlight body',
      type: 'array',
      of: [homeColumnBlock, imageWithAlt],
      hidden: ({ parent }: { parent?: { spotlightEnabled?: boolean } }) => !parent?.spotlightEnabled,
      description:
        'Use Heading 3/4 for subsections if needed. Images should include alternative text unless decorative.',
    },
    {
      name: 'seo',
      title: 'SEO',
      type: 'object',
      options: { collapsible: true, collapsed: true },
      fields: [
        { name: 'metaTitle', title: 'Meta title', type: 'string' },
        { name: 'metaDescription', title: 'Meta description', type: 'text', rows: 3 },
      ],
    },
  ],
  preview: {
    prepare() {
      return { title: 'Home Page', subtitle: '/' }
    },
  },
}
