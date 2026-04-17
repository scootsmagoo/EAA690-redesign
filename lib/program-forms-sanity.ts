import { cache } from 'react'
import { createClient } from '@sanity/client'
import { normalizeProgramForms, type ProgramFormSlot, type ProgramFormSlotKey } from '@/lib/program-availability'

const SANITY_PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() || 'itqpjbjj'
const SANITY_DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || 'production'

/**
 * Loads program form flags from Sanity with CDN disabled so admin toggles show up quickly on public pages.
 * Deduplicated per request when used from multiple server components (e.g. program sections + form block).
 */
export const getProgramFormsSettings = cache(async function getProgramFormsSettings(): Promise<
  Record<ProgramFormSlotKey, ProgramFormSlot>
> {
  try {
    const client = createClient({
      projectId: SANITY_PROJECT_ID,
      dataset: SANITY_DATASET,
      apiVersion: '2024-01-01',
      useCdn: false,
    })
    const raw = await client.fetch<unknown>(`*[_type == "siteSettings"][0].programForms`)
    return normalizeProgramForms(raw)
  } catch (e) {
    console.error('[sanity] getProgramFormsSettings:', e)
    return normalizeProgramForms(undefined)
  }
})
