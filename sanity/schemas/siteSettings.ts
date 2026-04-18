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
      description:
        'Fallback link to the latest PDF when no NAVCOM issue is published in the CMS, or for quick redirects.',
    },
    {
      name: 'newsletterArchiveFolderUrl',
      title: 'Full PDF archive (external folder)',
      type: 'url',
      description:
        'Optional — e.g. Google Drive folder with older PDFs. Shown on the NAVCOM archive page when set.',
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
    {
      name: 'siteAnnouncement',
      title: 'Site-wide announcement',
      type: 'object',
      options: {
        collapsible: true,
        collapsed: false,
      },
      fields: [
        {
          name: 'enabled',
          title: 'Show announcement banner',
          type: 'boolean',
          initialValue: false,
        },
        {
          name: 'message',
          title: 'Message',
          type: 'text',
          rows: 2,
          description: 'Shown below the main nav on every public page when enabled.',
        },
        {
          name: 'linkUrl',
          title: 'Optional link URL',
          type: 'url',
        },
        {
          name: 'linkText',
          title: 'Link label',
          type: 'string',
          description: 'e.g. "Details" or "Read more"',
        },
        {
          name: 'style',
          title: 'Style',
          type: 'string',
          initialValue: 'info',
          options: {
            list: [
              { title: 'Info (blue)', value: 'info' },
              { title: 'Warning (amber)', value: 'warning' },
              { title: 'Neutral (gray)', value: 'neutral' },
            ],
            layout: 'radio',
          },
        },
        {
          name: 'startDate',
          title: 'Show on or after (optional)',
          type: 'date',
          description: 'First calendar day to show the banner. Leave empty to show immediately.',
        },
        {
          name: 'endDate',
          title: 'Last day to show (optional)',
          type: 'date',
          description: 'Banner hides after this date.',
        },
      ],
    },
    {
      name: 'storeSectionVisible',
      title: 'Show chapter store',
      type: 'boolean',
      initialValue: true,
      description:
        'Turn off to remove Store and cart from the navigation and show a notice on /store.',
    },
    {
      name: 'programForms',
      title: 'Program registration & documents',
      type: 'object',
      description:
        'Control online forms and chapter PDF links on /programs pages. Editors can also change these in Site Settings in Studio.',
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        {
          name: 'youthAviation',
          title: 'Youth Aviation Program',
          type: 'object',
          fields: [
            {
              name: 'registrationOpen',
              title: 'Accept online applications / interest form',
              type: 'boolean',
              initialValue: true,
            },
            {
              name: 'documentsVisible',
              title: 'Show program PDFs (Google Drive links)',
              type: 'boolean',
              initialValue: true,
            },
            {
              name: 'closedMessage',
              title: 'Message when registration is closed',
              type: 'text',
              rows: 2,
              description: 'Optional. Shown instead of the form when applications are closed.',
            },
          ],
        },
        {
          name: 'scholarship',
          title: 'Scholarships',
          type: 'object',
          fields: [
            {
              name: 'registrationOpen',
              title: 'Accept online scholarship applications',
              type: 'boolean',
              initialValue: true,
            },
            {
              name: 'documentsVisible',
              title: 'Show chapter scholarship PDF links',
              type: 'boolean',
              initialValue: true,
            },
            {
              name: 'closedMessage',
              title: 'Message when online applications are closed',
              type: 'text',
              rows: 2,
              description: 'Optional. Shown instead of the online form when closed.',
            },
          ],
        },
        {
          name: 'summerCamp',
          title: 'Summer Camp (waitlist)',
          type: 'object',
          fields: [
            {
              name: 'registrationOpen',
              title: 'Accept waitlist signups',
              type: 'boolean',
              initialValue: true,
            },
            {
              name: 'closedMessage',
              title: 'Message when waitlist is closed',
              type: 'text',
              rows: 2,
              description: 'Optional. Shown instead of the waitlist form when closed.',
            },
          ],
        },
        {
          name: 'vmcImc',
          title: 'VMC/IMC Club',
          type: 'object',
          fields: [
            {
              name: 'registrationOpen',
              title: 'Accept meeting notifications signup',
              type: 'boolean',
              initialValue: true,
            },
            {
              name: 'closedMessage',
              title: 'Message when signup is closed',
              type: 'text',
              rows: 2,
              description: 'Optional. Shown instead of the signup form when closed.',
            },
          ],
        },
        {
          name: 'outreach',
          title: 'Outreach (Heidi / event requests)',
          type: 'object',
          fields: [
            {
              name: 'registrationOpen',
              title: 'Accept event / appearance requests',
              type: 'boolean',
              initialValue: true,
            },
            {
              name: 'closedMessage',
              title: 'Message when requests are closed',
              type: 'text',
              rows: 2,
              description: 'Optional. Shown instead of the request form when closed.',
            },
          ],
        },
      ],
    },
    {
      name: 'formNotifications',
      title: 'Form notifications (alerts)',
      type: 'object',
      description:
        'Who gets notified when a website form submission reaches the database. Defaults fall back to the CONTACT_EMAIL_TO env var; per-form lists, when set, replace the default for that form. SMS recipients require Twilio (env vars TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER) — when unset, SMS is silently skipped.',
      options: { collapsible: true, collapsed: true },
      fields: [
        {
          name: 'enabled',
          title: 'Send notifications when forms are submitted',
          type: 'boolean',
          initialValue: true,
          description: 'Master switch. Off = no email/SMS alerts (submissions still save to the database).',
        },
        {
          name: 'defaultEmailRecipients',
          title: 'Default email recipients',
          type: 'array',
          of: [{ type: 'string' }],
          description:
            'Email addresses notified for any program form unless a more specific list is set below. Falls back to the CONTACT_EMAIL_TO env var when empty.',
          options: { layout: 'tags' },
        },
        {
          name: 'perFormEmailRecipients',
          title: 'Per-form recipient overrides (optional)',
          type: 'object',
          description:
            'Leave a list empty to use the default recipients above. Add addresses to send a specific form type to a different inbox.',
          options: { collapsible: true, collapsed: true },
          fields: [
            {
              name: 'youthAviation',
              title: 'Youth Aviation Program recipients',
              type: 'array',
              of: [{ type: 'string' }],
              options: { layout: 'tags' },
            },
            {
              name: 'scholarship',
              title: 'Scholarship recipients',
              type: 'array',
              of: [{ type: 'string' }],
              options: { layout: 'tags' },
            },
            {
              name: 'summerCamp',
              title: 'Summer Camp waitlist recipients',
              type: 'array',
              of: [{ type: 'string' }],
              options: { layout: 'tags' },
            },
            {
              name: 'vmcImc',
              title: 'VMC/IMC Club recipients',
              type: 'array',
              of: [{ type: 'string' }],
              options: { layout: 'tags' },
            },
            {
              name: 'outreach',
              title: 'Outreach / event request recipients (Heidi)',
              type: 'array',
              of: [{ type: 'string' }],
              options: { layout: 'tags' },
            },
          ],
        },
        {
          name: 'smsRecipients',
          title: 'SMS phone numbers (E.164 format, e.g. +14045551234)',
          type: 'array',
          of: [{ type: 'string' }],
          description:
            'Optional. Numbers texted on every program form submission once Twilio env vars are set. Until then, listed numbers receive nothing (no error).',
          options: { layout: 'tags' },
        },
        {
          name: 'adminUserCreatedAlerts',
          title: 'Alert when a user is promoted to admin',
          type: 'boolean',
          initialValue: true,
          description:
            'Email the recipients above when an existing admin grants admin access to another user (security event).',
        },
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
