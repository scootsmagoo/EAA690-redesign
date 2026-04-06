import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { getAuth } from '@/lib/better-auth'

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'itqpjbjj'
const DATASET    = process.env.NEXT_PUBLIC_SANITY_DATASET    || 'production'
const TOKEN      = process.env.SANITY_API_TOKEN

function getSanityWriteClient() {
  if (!TOKEN) throw new Error('SANITY_API_TOKEN is not set')
  return createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: '2024-01-01',
    token: TOKEN,
    useCdn: false,
  })
}

const TYPE_LABELS: Record<string, string> = {
  newsArticle:  'News Article',
  event:        'Event',
  presentation: 'Presentation',
  boardMember:  'Board Member',
  siteSettings: 'Site Settings',
  page:         'Page',
}

async function requireAdminOrEditor(request: NextRequest): Promise<true | NextResponse> {
  const session = await getAuth().api.getSession({ headers: request.headers })
  const role = (session?.user as any)?.role
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (role !== 'admin' && role !== 'editor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return true
}

/** GET — list all pending drafts */
export async function GET(request: NextRequest) {
  const check = await requireAdminOrEditor(request)
  if (check !== true) return check

  if (!TOKEN) {
    return NextResponse.json(
      { error: 'SANITY_API_TOKEN is not configured on this server.' },
      { status: 503 }
    )
  }

  try {
    const client = getSanityWriteClient()
    const drafts = await client.fetch<
      { _id: string; _type: string; title?: string; _updatedAt: string }[]
    >(
      `*[_id in path("drafts.**")] | order(_updatedAt desc) {
        _id, _type, title, _updatedAt
      }`
    )

    return NextResponse.json({
      drafts: drafts.map((d) => ({
        id:        d._id,
        publishedId: d._id.replace(/^drafts\./, ''),
        type:      d._type,
        typeLabel: TYPE_LABELS[d._type] ?? d._type,
        title:     d.title ?? '(untitled)',
        updatedAt: d._updatedAt,
      })),
    })
  } catch (err) {
    console.error('Sanity draft list error:', err)
    return NextResponse.json({ error: 'Failed to fetch drafts from Sanity' }, { status: 500 })
  }
}

/** POST — publish one or all drafts
 *  Body: { id: string } to publish one, or { all: true } to publish everything
 */
export async function POST(request: NextRequest) {
  const check = await requireAdminOrEditor(request)
  if (check !== true) return check

  if (!TOKEN) {
    return NextResponse.json(
      { error: 'SANITY_API_TOKEN is not configured on this server.' },
      { status: 503 }
    )
  }

  let body: { id?: string; all?: boolean }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const client = getSanityWriteClient()

    const toPublish: string[] = []

    if (body.all) {
      const drafts = await client.fetch<{ _id: string }[]>(
        `*[_id in path("drafts.**")]{ _id }`
      )
      toPublish.push(...drafts.map((d) => d._id))
    } else if (body.id) {
      toPublish.push(body.id.startsWith('drafts.') ? body.id : `drafts.${body.id}`)
    } else {
      return NextResponse.json({ error: 'Provide id or all:true' }, { status: 400 })
    }

    const published: string[] = []
    const errors: string[] = []

    for (const draftId of toPublish) {
      try {
        const doc = await client.getDocument(draftId)
        if (!doc) { errors.push(`Not found: ${draftId}`); continue }

        const publishedId = draftId.replace(/^drafts\./, '')
        const { _id, _updatedAt, ...rest } = doc as any
        await client.createOrReplace({ ...rest, _id: publishedId })
        await client.delete(draftId)
        published.push(publishedId)
      } catch (e) {
        errors.push(`${draftId}: ${e instanceof Error ? e.message : 'unknown error'}`)
      }
    }

    return NextResponse.json({ success: true, published, errors })
  } catch (err) {
    console.error('Sanity publish error:', err)
    return NextResponse.json({ error: 'Failed to publish' }, { status: 500 })
  }
}
