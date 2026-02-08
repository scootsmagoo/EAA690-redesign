// Presentation/Speaker schema for monthly programs
export default {
  name: 'presentation',
  title: 'Presentation',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Presentation Title',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'speakerName',
      title: 'Speaker Name',
      type: 'string',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'topic',
      title: 'Topic/Title of Talk',
      type: 'string',
      description: 'e.g., "Performance Enhancement for My Sonerai Skyeracer"',
    },
    {
      name: 'speakerBio',
      title: 'Speaker Bio',
      type: 'array',
      of: [{ type: 'block' }],
    },
    {
      name: 'image',
      title: 'Speaker Photo',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
  ],
  preview: {
    select: {
      title: 'speakerName',
      subtitle: 'topic',
      date: 'date',
      media: 'image',
    },
    prepare({ title, subtitle, date, media }: any) {
      return {
        title,
        subtitle: `${date}: ${subtitle || 'TBD'}`,
        media,
      }
    },
  },
}
