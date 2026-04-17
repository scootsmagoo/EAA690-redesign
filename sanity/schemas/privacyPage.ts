const privacyBlock = {
  type: 'block',
  styles: [
    { title: 'Normal', value: 'normal' },
    { title: 'Heading 2', value: 'h2' },
    { title: 'Heading 3', value: 'h3' },
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
        fields: [{ name: 'href', type: 'string', title: 'URL or path' }],
      },
    ],
  },
}

/** Singleton: /privacy — chapter data practices (editable copy). */
export default {
  name: 'privacyPage',
  title: 'Privacy & data use',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Page title',
      type: 'string',
      initialValue: 'Privacy & data use',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'body',
      title: 'Content',
      type: 'array',
      of: [privacyBlock],
      validation: (Rule: any) => Rule.required(),
    },
  ],
  preview: {
    prepare() {
      return { title: 'Privacy (/privacy)' }
    },
  },
}
