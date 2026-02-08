// Site-wide settings (singleton)
export default {
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    {
      name: 'siteName',
      title: 'Site Name',
      type: 'string',
      initialValue: 'EAA 690',
    },
    {
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
    },
    {
      name: 'logo',
      title: 'Logo',
      type: 'image',
    },
    {
      name: 'contactEmail',
      title: 'Contact Email',
      type: 'string',
    },
    {
      name: 'phone',
      title: 'Phone Number',
      type: 'string',
    },
    {
      name: 'address',
      title: 'Address',
      type: 'text',
      rows: 3,
    },
    {
      name: 'breakfastPrice',
      title: 'Pancake Breakfast Price',
      type: 'string',
      description: 'e.g., "$10/each"',
    },
    {
      name: 'breakfastTime',
      title: 'Breakfast Serving Time',
      type: 'string',
      description: 'e.g., "8:00 to 10:00 AM"',
    },
    {
      name: 'newsletterUrl',
      title: 'Latest Newsletter URL',
      type: 'url',
      description: 'Link to the latest newsletter PDF',
    },
    {
      name: 'socialLinks',
      title: 'Social Media Links',
      type: 'object',
      fields: [
        { name: 'facebook', title: 'Facebook URL', type: 'url' },
        { name: 'twitter', title: 'Twitter/X URL', type: 'url' },
        { name: 'instagram', title: 'Instagram URL', type: 'url' },
        { name: 'youtube', title: 'YouTube URL', type: 'url' },
      ],
    },
  ],
  preview: {
    prepare() {
      return {
        title: 'Site Settings',
      }
    },
  },
}
