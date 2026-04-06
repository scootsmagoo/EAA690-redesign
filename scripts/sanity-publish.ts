/**
 * Publish pending Sanity drafts
 *
 * Usage:
 *   npx tsx scripts/sanity-publish.ts            — list all pending drafts
 *   npx tsx scripts/sanity-publish.ts --all       — publish every draft
 *   npx tsx scripts/sanity-publish.ts <docId>     — publish one specific document
 *
 * Requires SANITY_API_TOKEN in .env.local (Editor or above).
 */

import { config } from 'dotenv'
import { createClient } from '@sanity/client'
import path from 'path'

config({ path: path.join(__dirname, '../.env.local') })

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'itqpjbjj'
const DATASET   = process.env.NEXT_PUBLIC_SANITY_DATASET    || 'production'
const TOKEN     = process.env.SANITY_API_TOKEN

if (!TOKEN) {
  console.error('❌  SANITY_API_TOKEN is not set in .env.local')
  process.exit(1)
}

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: '2024-01-01',
  token: TOKEN,
  useCdn: false,
})

async function listDrafts() {
  const drafts = await client.fetch<{ _id: string; _type: string; title?: string }[]>(
    `*[_id in path("drafts.**")] | order(_type asc) { _id, _type, title }`
  )
  return drafts
}

async function publishDoc(draftId: string) {
  // Sanity drafts have IDs like "drafts.<realId>"
  const publishedId = draftId.replace(/^drafts\./, '')

  // Fetch the full draft document
  const draft = await client.getDocument(draftId)
  if (!draft) {
    console.error(`  ❌  Document not found: ${draftId}`)
    return
  }

  // Create the published version (without the drafts. prefix and without _updatedAt)
  const { _id, _updatedAt, ...docWithoutMeta } = draft as any
  const publishedDoc = { ...docWithoutMeta, _id: publishedId }

  await client.createOrReplace(publishedDoc)
  await client.delete(draftId)

  console.log(`  ✅  Published: ${publishedId} (${draft._type} — "${(draft as any).title ?? 'untitled'}")`)
}

async function main() {
  const args = process.argv.slice(2)

  console.log(`\n🔗  Project: ${PROJECT_ID} / ${DATASET}\n`)

  const drafts = await listDrafts()

  if (drafts.length === 0) {
    console.log('✨  No pending drafts found.')
    return
  }

  // No args — just list
  if (args.length === 0) {
    console.log(`📋  Pending drafts (${drafts.length}):\n`)
    drafts.forEach((d) => {
      console.log(`  ${d._id.padEnd(60)} [${d._type}]${d.title ? '  "' + d.title + '"' : ''}`)
    })
    console.log('\nRun with --all to publish everything, or pass a document ID to publish one.')
    return
  }

  // --all flag — publish everything
  if (args[0] === '--all') {
    console.log(`🚀  Publishing all ${drafts.length} draft(s)…\n`)
    for (const draft of drafts) {
      await publishDoc(draft._id)
    }
    console.log('\n✅  Done.')
    return
  }

  // Specific document ID
  const targetId = args[0].startsWith('drafts.') ? args[0] : `drafts.${args[0]}`
  console.log(`🚀  Publishing ${targetId}…\n`)
  await publishDoc(targetId)
  console.log('\n✅  Done.')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
