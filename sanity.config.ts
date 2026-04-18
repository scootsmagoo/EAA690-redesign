'use client'

import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemas'

/** Match lib/sanity.ts — Studio must always receive a valid id when env is unset (e.g. no .env.local). */
const projectId =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() || 'itqpjbjj'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || 'production'

export default defineConfig({
  basePath: '/studio',
  projectId,
  dataset,
  title: 'EAA 690 Content',
  schema: {
    types: schemaTypes,
  },
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            // Singleton: Site Settings
            S.listItem()
              .title('Site Settings')
              .id('siteSettings')
              .child(
                S.document()
                  .schemaType('siteSettings')
                  .documentId('siteSettings')
              ),
            S.listItem()
              .title('Home Page')
              .id('homePage')
              .child(S.document().schemaType('homePage').documentId('homePage')),
            S.listItem()
              .title('News Page')
              .id('newsPage')
              .child(S.document().schemaType('newsPage').documentId('newsPage')),
            S.listItem()
              .title('Media Page')
              .id('mediaPage')
              .child(S.document().schemaType('mediaPage').documentId('mediaPage')),
            S.listItem()
              .title('Kudos Page')
              .id('kudosPage')
              .child(S.document().schemaType('kudosPage').documentId('kudosPage')),
            S.listItem()
              .title('NAVCOM Page')
              .id('newsletterPage')
              .child(
                S.document().schemaType('newsletterPage').documentId('newsletterPage')
              ),
            S.listItem()
              .title('Programs index')
              .id('programsPage')
              .child(S.document().schemaType('programsPage').documentId('programsPage')),
            S.listItem()
              .title('Privacy page')
              .id('privacyPage')
              .child(S.document().schemaType('privacyPage').documentId('privacyPage')),
            S.divider(),
            // Regular document types
            S.documentTypeListItem('event').title('Events'),
            S.documentTypeListItem('newsArticle').title('News Articles'),
            S.documentTypeListItem('newsletterIssue').title('NAVCOM Issues'),
            S.documentTypeListItem('newsletterSection').title('NAVCOM Sections'),
            S.documentTypeListItem('presentation').title('Presentations'),
            S.documentTypeListItem('boardMember').title('Board Members'),
            S.documentTypeListItem('page').title('Pages'),
            S.divider(),
            S.documentTypeListItem('kudos').title('Kudos'),
            S.divider(),
            S.documentTypeListItem('mediaGallery').title('Media Galleries'),
            S.divider(),
            S.documentTypeListItem('storeCategory').title('Store Categories'),
            S.documentTypeListItem('storeProduct').title('Store Products'),
            S.documentTypeListItem('programPage').title('Program pages'),
          ]),
    }),
    visionTool(),
  ],
})
