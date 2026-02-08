// Event schema for pancake breakfasts, fly-outs, etc.
export default {
  name: 'event',
  title: 'Event',
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
      options: {
        source: 'title',
        maxLength: 96,
      },
    },
    {
      name: 'date',
      title: 'Date',
      type: 'date',
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'startTime',
      title: 'Start Time',
      type: 'string',
      description: 'e.g., "8:00 AM"',
    },
    {
      name: 'endTime',
      title: 'End Time',
      type: 'string',
      description: 'e.g., "10:00 AM"',
    },
    {
      name: 'location',
      title: 'Location',
      type: 'string',
      initialValue: 'Briscoe Field (KLZU)',
    },
    {
      name: 'description',
      title: 'Short Description',
      type: 'text',
      rows: 3,
    },
    {
      name: 'content',
      title: 'Full Content',
      type: 'array',
      of: [{ type: 'block' }],
    },
    {
      name: 'image',
      title: 'Event Image',
      type: 'image',
      options: {
        hotspot: true,
      },
    },
    {
      name: 'isRecurring',
      title: 'Recurring Event',
      type: 'boolean',
      initialValue: false,
    },
    {
      name: 'recurringInfo',
      title: 'Recurring Info',
      type: 'string',
      description: 'e.g., "1st Saturday of each month"',
      hidden: ({ document }: any) => !document?.isRecurring,
    },
  ],
  preview: {
    select: {
      title: 'title',
      date: 'date',
      media: 'image',
    },
    prepare({ title, date, media }: any) {
      return {
        title,
        subtitle: date,
        media,
      }
    },
  },
}
