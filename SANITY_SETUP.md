# Sanity CMS Setup Guide

This guide walks through setting up Sanity CMS for the EAA 690 website.

## Overview

We're using Sanity as a headless CMS so chapter volunteers can update:
- **Events** — Pancake breakfasts, fly-outs, etc.
- **News** — Chapter announcements and updates
- **Presentations** — Monthly speaker info
- **Board Members** — Current officers and board
- **Site Settings** — Contact info, breakfast price, newsletter link
- **Pages** — Generic editable content pages

## Step 1: Create a Sanity Project

1. Go to [sanity.io](https://www.sanity.io/) and sign up/login
2. Click "Create new project"
3. Name it "EAA 690" (or similar)
4. Choose the **Free** plan (plenty for this use case)
5. Note your **Project ID** — you'll need this

## Step 2: Set Up the Studio (Option A: Standalone)

Since this Next.js project uses React 18 and Sanity Studio v3 requires React 19, 
the easiest approach is a separate studio project:

```bash
# Create a new Sanity studio project
npm create sanity@latest -- --project-id YOUR_PROJECT_ID --dataset production

# When prompted:
# - Choose "Clean project with no predefined schemas"
# - TypeScript: Yes
```

Then copy the schemas from `./sanity/schemas/` into your new studio's `schemaTypes/` folder.

## Step 2: Set Up the Studio (Option B: Hosted Studio)

Sanity offers a hosted studio at `your-project.sanity.studio`. You can manage content there
without running your own studio. Enable it in your project settings at sanity.io/manage.

## Step 3: Configure Environment Variables

Add these to your `.env.local`:

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
```

For production, add these to your Vercel/Netlify environment variables.

## Step 4: Deploy the Schemas

If using a standalone studio:

```bash
cd your-sanity-studio
npx sanity deploy
```

This makes the studio available at `your-project.sanity.studio`.

## Step 5: Add Initial Content

1. Open your Sanity Studio
2. Create a **Site Settings** document with:
   - Site name: "EAA 690"
   - Breakfast price: "$10/each"
   - Breakfast time: "8:00 to 10:00 AM"
   - Contact email, address, etc.

3. Create your first **Event** (e.g., next pancake breakfast)

4. Create a **Presentation** for the upcoming speaker

5. Add **Board Members**

## Using Content in Pages

The Next.js app fetches content via `lib/sanity.ts`. Example usage:

```tsx
// app/calendar/page.tsx
import { getUpcomingEvents } from '@/lib/sanity'
import type { Event } from '@/lib/sanity-types'

export default async function CalendarPage() {
  const events: Event[] = await getUpcomingEvents()
  
  return (
    <div>
      {events.map((event) => (
        <div key={event._id}>
          <h2>{event.title}</h2>
          <p>{event.date} • {event.startTime}</p>
        </div>
      ))}
    </div>
  )
}
```

## Content Schemas

Located in `./sanity/schemas/`:

| Schema | Description |
|--------|-------------|
| `event.ts` | Pancake breakfasts, fly-outs, meetings |
| `newsArticle.ts` | Chapter news and announcements |
| `presentation.ts` | Monthly speaker/program info |
| `boardMember.ts` | Officers and board members |
| `siteSettings.ts` | Global settings (contact, prices, etc.) |
| `page.ts` | Generic editable pages |

## Fallback Data

Until Sanity is configured, pages will show hardcoded fallback data.
The pattern is:

```tsx
const events = await getUpcomingEvents().catch(() => null)

if (!events || events.length === 0) {
  // Show fallback/placeholder content
}
```

## CORS Configuration

If you get CORS errors, add your domain to Sanity's CORS origins:

1. Go to sanity.io/manage → Your Project → API → CORS origins
2. Add:
   - `http://localhost:3000` (development)
   - `https://eaa690.org` (production)
   - `https://your-preview-url.vercel.app` (preview deployments)

## Giving Chapter Admins Access

1. Go to sanity.io/manage → Your Project → Members
2. Invite chapter admins by email
3. They can edit content at `your-project.sanity.studio`

No technical knowledge required — the studio has a friendly UI.

## Image Handling

Use the `urlFor()` helper for Sanity images:

```tsx
import { urlFor } from '@/lib/sanity'

<img src={urlFor(event.image).width(800).url()} alt={event.title} />
```

## Next Steps

- [ ] Create Sanity project
- [ ] Deploy studio with schemas
- [ ] Add environment variables
- [ ] Add initial content (events, settings)
- [ ] Invite chapter admins
- [ ] Update pages to use Sanity data (see examples below)
