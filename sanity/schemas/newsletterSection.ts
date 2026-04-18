// NAVCOM section taxonomy — recurring topical sections that appear across
// many issues (e.g. "President's Column", "Young Eagles", "Classifieds").
// Editors tag each NAVCOM issue with the sections it contains; readers can
// browse the archive by section at /newsletter/sections/[slug].
export default {
  name: 'newsletterSection',
  title: 'NAVCOM Section',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Section title',
      type: 'string',
      description: 'e.g. "President\'s Column" or "Young Eagles".',
      validation: (Rule: any) => Rule.required().max(80),
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 64 },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Short description shown on the section\'s archive page.',
      validation: (Rule: any) => Rule.max(280),
    },
    {
      name: 'order',
      title: 'Sort order',
      type: 'number',
      description: 'Lower numbers appear first in section pickers and badges. Leave blank to sort alphabetically.',
    },
  ],
  orderings: [
    {
      title: 'Manual order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
    {
      title: 'Title (A → Z)',
      name: 'titleAsc',
      by: [{ field: 'title', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
    },
  },
}
