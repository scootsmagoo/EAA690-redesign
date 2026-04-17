const programsIntroBlock = {
  type: 'block',
  styles: [{ title: 'Normal', value: 'normal' }],
  lists: [],
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
        fields: [{ name: 'href', type: 'string', title: 'URL or path' }],
      },
    ],
  },
}

/** Singleton: /programs index intro and title */
export default {
  name: 'programsPage',
  title: 'Programs index',
  type: 'document',
  fields: [
    {
      name: 'pageTitle',
      title: 'Page title',
      type: 'string',
      initialValue: 'Programs',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'intro',
      title: 'Introduction',
      type: 'array',
      of: [programsIntroBlock],
      description: 'Shown below the main heading on /programs.',
    },
  ],
  preview: {
    prepare() {
      return { title: 'Programs index (/programs)' }
    },
  },
}
