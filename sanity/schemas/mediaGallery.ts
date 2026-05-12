// Media Gallery schema — supports three display types:
//   slideshow  : large primary image + thumbnail strip + prev/next
//   imageGrid  : responsive masonry grid with lightbox
//   videoEmbed : YouTube / Vimeo embed with optional text

/** Shared block definition for rich description (with hyperlink annotation). */
const richDescriptionBlock = {
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
            title: 'URL or internal path',
            description: 'e.g. https://eaa690.org or /programs/young-eagles',
          },
        ],
      },
    ],
  },
}

/** Image with alt text and optional caption. */
const galleryImage = {
  name: 'galleryImage',
  title: 'Gallery image',
  type: 'image',
  options: { hotspot: true },
  fields: [
    {
      name: 'alt',
      title: 'Alt text',
      type: 'string',
      description: 'Describe the image for screen readers.',
      validation: (Rule: any) => Rule.max(220),
    },
    {
      name: 'caption',
      title: 'Caption',
      type: 'string',
      description: 'Optional short caption shown beneath the image.',
      validation: (Rule: any) => Rule.max(300),
    },
  ],
}

export default {
  name: 'mediaGallery',
  title: 'Media Gallery',
  type: 'document',
  fields: [
    // ── Identity ──────────────────────────────────────────────────────────────
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
      options: { source: 'title', maxLength: 96 },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: 'publishedAt',
      title: 'Published Date',
      type: 'datetime',
    },

    // ── Index listing ─────────────────────────────────────────────────────────
    {
      name: 'coverImage',
      title: 'Cover image',
      type: 'image',
      options: { hotspot: true },
      description: 'Thumbnail shown on the /media index card.',
    },
    {
      name: 'coverImageAlt',
      title: 'Cover image alt text',
      type: 'string',
      description: 'Required when a cover image is set.',
      validation: (Rule: any) =>
        Rule.max(220).custom(
          (value: string | undefined, context: { parent?: { coverImage?: unknown } }) => {
            if (context.parent?.coverImage && !value?.trim()) {
              return 'Alt text is required when a cover image is set'
            }
            return true
          }
        ),
    },

    // ── Description ────────────────────────────────────────────────────────────
    {
      name: 'description',
      title: 'Plain-text description',
      type: 'text',
      rows: 4,
      description: 'Short summary shown on the index card and above the gallery.',
    },
    {
      name: 'richDescription',
      title: 'Rich description (WYSIWYG)',
      type: 'array',
      of: [richDescriptionBlock],
      description:
        'Full formatted description with bold, italic, headings, lists, and hyperlinks. Shown above the gallery on the detail page.',
    },

    // ── Display type ───────────────────────────────────────────────────────────
    {
      name: 'displayType',
      title: 'Display type',
      type: 'string',
      initialValue: 'slideshow',
      options: {
        list: [
          { title: 'Slideshow carousel (large image + thumbnails)', value: 'slideshow' },
          { title: 'Image grid (masonry)', value: 'imageGrid' },
          { title: 'Video embed (YouTube / Vimeo)', value: 'videoEmbed' },
        ],
        layout: 'radio',
      },
      validation: (Rule: any) => Rule.required(),
    },

    // ── Images (slideshow + imageGrid) ─────────────────────────────────────────
    {
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [galleryImage],
      description: 'Add all photos for the slideshow or grid.',
      hidden: ({ parent }: { parent?: { displayType?: string } }) =>
        parent?.displayType === 'videoEmbed',
    },

    // ── Video embed ────────────────────────────────────────────────────────────
    {
      name: 'videoUrl',
      title: 'Video URL',
      type: 'url',
      description:
        'YouTube (https://youtu.be/… or https://www.youtube.com/watch?v=…) or Vimeo (https://vimeo.com/…) link.',
      hidden: ({ parent }: { parent?: { displayType?: string } }) =>
        parent?.displayType !== 'videoEmbed',
      validation: (Rule: any) =>
        Rule.custom((value: string | undefined, context: { parent?: { displayType?: string } }) => {
          if (context.parent?.displayType !== 'videoEmbed') return true
          if (!value?.trim()) return 'A video URL is required for the Video Embed display type'
          const v = value.trim()
          const allowed =
            v.startsWith('https://www.youtube.com/') ||
            v.startsWith('https://youtu.be/') ||
            v.startsWith('https://vimeo.com/') ||
            v.startsWith('https://player.vimeo.com/')
          if (!allowed) return 'Only YouTube or Vimeo URLs are accepted'
          return true
        }),
    },
    {
      name: 'videoTitle',
      title: 'Video title',
      type: 'string',
      description: 'Heading shown above the video player.',
      hidden: ({ parent }: { parent?: { displayType?: string } }) =>
        parent?.displayType !== 'videoEmbed',
    },
    {
      name: 'videoSubtitle',
      title: 'Video subtitle',
      type: 'text',
      rows: 2,
      description: 'Optional subheading shown directly under the video title.',
      hidden: ({ parent }: { parent?: { displayType?: string } }) =>
        parent?.displayType !== 'videoEmbed',
    },
  ],

  preview: {
    select: {
      title: 'title',
      displayType: 'displayType',
      media: 'coverImage',
    },
    prepare({ title, displayType, media }: any) {
      const labels: Record<string, string> = {
        slideshow: 'Slideshow',
        imageGrid: 'Image Grid',
        videoEmbed: 'Video',
      }
      return {
        title: title || 'Untitled Gallery',
        subtitle: labels[displayType] ?? displayType,
        media,
      }
    },
  },
}
