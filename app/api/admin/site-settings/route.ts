import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { getAuth } from '@/lib/better-auth'
import { urlFor } from '@/lib/sanity'
import type { SanityImageSource } from '@sanity/image-url'
import { normalizeProgramForms, type ProgramFormSlot, type ProgramFormSlotKey } from '@/lib/program-availability'

const PROJECT_ID = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID?.trim() || 'itqpjbjj'
const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET?.trim() || 'production'
const TOKEN = process.env.SANITY_API_TOKEN
const SITE_SETTINGS_ID = 'siteSettings'

function getSanityReadClient() {
  return createClient({
    projectId: PROJECT_ID,
    dataset: DATASET,
    apiVersion: '2024-01-01',
    useCdn: process.env.NODE_ENV === 'production',
  })
}

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

async function requireAdminOrEditor(request: NextRequest): Promise<true | NextResponse> {
  const session = await getAuth().api.getSession({ headers: request.headers })
  const role = (session?.user as { role?: string })?.role
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (role !== 'admin' && role !== 'editor') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return true
}

type SocialLinks = {
  facebook?: string
  twitter?: string
  instagram?: string
  youtube?: string
}

type SiteSettingsPayload = {
  siteName?: string
  tagline?: string
  contactEmail?: string
  phone?: string
  address?: string
  breakfastPrice?: string
  breakfastTime?: string
  newsletterUrl?: string
  newsletterArchiveFolderUrl?: string
  socialLinks?: SocialLinks
  siteAnnouncement?: {
    enabled?: boolean
    message?: string
    linkUrl?: string
    linkText?: string
    style?: string
    startDate?: string
    endDate?: string
  }
  storeSectionVisible?: boolean
  programForms?: unknown
}

function buildProgramFormsForSanity(slots: Record<ProgramFormSlotKey, ProgramFormSlot>) {
  return {
    youthAviation: {
      registrationOpen: slots.youthAviation.registrationOpen,
      documentsVisible: slots.youthAviation.documentsVisible,
      closedMessage: slots.youthAviation.closedMessage,
    },
    scholarship: {
      registrationOpen: slots.scholarship.registrationOpen,
      documentsVisible: slots.scholarship.documentsVisible,
      closedMessage: slots.scholarship.closedMessage,
    },
    summerCamp: {
      registrationOpen: slots.summerCamp.registrationOpen,
      closedMessage: slots.summerCamp.closedMessage,
    },
    vmcImc: {
      registrationOpen: slots.vmcImc.registrationOpen,
      closedMessage: slots.vmcImc.closedMessage,
    },
    // Outreach (Heidi / event requests) — schema field exists; previously
    // editable only via Sanity Studio, now also from this admin form.
    outreach: {
      registrationOpen: slots.outreach.registrationOpen,
      closedMessage: slots.outreach.closedMessage,
    },
  }
}

function trimStr(s: unknown): string {
  return typeof s === 'string' ? s.trim() : ''
}

function trimUrl(s: unknown): string | undefined {
  const t = trimStr(s)
  return t === '' ? undefined : t
}

const ANNOUNCEMENT_STYLES = new Set(['info', 'warning', 'neutral'])

function buildSiteAnnouncementForPatch(raw: unknown): Record<string, unknown> {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const styleRaw = trimStr(o.style)
  const style = ANNOUNCEMENT_STYLES.has(styleRaw) ? styleRaw : 'info'
  const out: Record<string, unknown> = {
    enabled: o.enabled === true,
    message: trimStr(o.message),
    style,
  }
  const linkUrl = trimUrl(o.linkUrl)
  const linkText = trimStr(o.linkText)
  const startDate = trimStr(o.startDate)
  const endDate = trimStr(o.endDate)
  if (linkUrl) out.linkUrl = linkUrl
  if (linkText) out.linkText = linkText
  if (startDate) out.startDate = startDate
  if (endDate) out.endDate = endDate
  return out
}

/** GET — load current site settings (same document as Sanity Studio singleton). */
export async function GET(request: NextRequest) {
  const check = await requireAdminOrEditor(request)
  if (check !== true) return check

  try {
    const client = getSanityReadClient()
    const doc = await client.fetch<
      SiteSettingsPayload & { _id?: string; logo?: SanityImageSource }
    >(
      `*[_id == $id][0] {
        _id,
        siteName,
        tagline,
        logo,
        contactEmail,
        phone,
        address,
        socialLinks,
        breakfastPrice,
        breakfastTime,
        newsletterUrl,
        newsletterArchiveFolderUrl,
        siteAnnouncement,
        storeSectionVisible,
        programForms
      }`,
      { id: SITE_SETTINGS_ID }
    )

    let logoPreviewUrl: string | null = null
    if (doc?.logo) {
      try {
        logoPreviewUrl = urlFor(doc.logo as SanityImageSource).width(240).url()
      } catch {
        logoPreviewUrl = null
      }
    }

    const ann = doc?.siteAnnouncement
    const programForms = normalizeProgramForms(doc?.programForms)

    return NextResponse.json({
      settings: doc
        ? {
            siteName: doc.siteName ?? '',
            tagline: doc.tagline ?? '',
            contactEmail: doc.contactEmail ?? '',
            phone: doc.phone ?? '',
            address: doc.address ?? '',
            breakfastPrice: doc.breakfastPrice ?? '',
            breakfastTime: doc.breakfastTime ?? '',
            newsletterUrl: doc.newsletterUrl ?? '',
            newsletterArchiveFolderUrl: doc.newsletterArchiveFolderUrl ?? '',
            socialLinks: {
              facebook: doc.socialLinks?.facebook ?? '',
              twitter: doc.socialLinks?.twitter ?? '',
              instagram: doc.socialLinks?.instagram ?? '',
              youtube: doc.socialLinks?.youtube ?? '',
            },
            siteAnnouncement: {
              enabled: ann?.enabled === true,
              message: ann?.message ?? '',
              linkUrl: ann?.linkUrl ?? '',
              linkText: ann?.linkText ?? '',
              style: ANNOUNCEMENT_STYLES.has(String(ann?.style))
                ? (ann?.style as string)
                : 'info',
              startDate: ann?.startDate ?? '',
              endDate: ann?.endDate ?? '',
            },
            storeSectionVisible: doc.storeSectionVisible !== false,
            programForms,
            logoPreviewUrl,
          }
        : null,
    })
  } catch (err) {
    console.error('site-settings GET:', err)
    return NextResponse.json({ error: 'Failed to load site settings' }, { status: 500 })
  }
}

/** PATCH — update text/url fields (logo remains editable in Sanity Studio). */
export async function PATCH(request: NextRequest) {
  const check = await requireAdminOrEditor(request)
  if (check !== true) return check

  if (!TOKEN) {
    return NextResponse.json(
      { error: 'SANITY_API_TOKEN is not configured on this server.' },
      { status: 503 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const b = body as Record<string, unknown>
  const social = (b.socialLinks as Record<string, unknown>) || {}

  const socialLinks: SocialLinks = {}
  const fb = trimUrl(social.facebook)
  const tw = trimUrl(social.twitter)
  const ig = trimUrl(social.instagram)
  const yt = trimUrl(social.youtube)
  if (fb) socialLinks.facebook = fb
  if (tw) socialLinks.twitter = tw
  if (ig) socialLinks.instagram = ig
  if (yt) socialLinks.youtube = yt

  const newsletterUrl = trimUrl(b.newsletterUrl)
  const newsletterArchiveFolderUrl = trimUrl(b.newsletterArchiveFolderUrl)
  const siteAnnouncement = buildSiteAnnouncementForPatch(b.siteAnnouncement)
  const sa = b.siteAnnouncement as Record<string, unknown> | undefined

  const programFormsNormalized = normalizeProgramForms(b.programForms)
  const programForms = buildProgramFormsForSanity(programFormsNormalized)

  const setFields: Record<string, unknown> = {
    siteName: trimStr(b.siteName),
    tagline: trimStr(b.tagline),
    contactEmail: trimStr(b.contactEmail),
    phone: trimStr(b.phone),
    address: trimStr(b.address),
    breakfastPrice: trimStr(b.breakfastPrice),
    breakfastTime: trimStr(b.breakfastTime),
    socialLinks,
    siteAnnouncement,
    storeSectionVisible: b.storeSectionVisible !== false,
    programForms,
  }
  if (newsletterUrl) {
    setFields.newsletterUrl = newsletterUrl
  }
  if (newsletterArchiveFolderUrl) {
    setFields.newsletterArchiveFolderUrl = newsletterArchiveFolderUrl
  }

  try {
    const client = getSanityWriteClient()
    const exists = await client.fetch<boolean>(`defined(*[_id == $id][0]._id)`, {
      id: SITE_SETTINGS_ID,
    })

    if (!exists) {
      /** First save: create the Site Settings singleton (avoids HTTP 404, which looks like a missing API route). */
      const createDoc: Record<string, unknown> = {
        _id: SITE_SETTINGS_ID,
        _type: 'siteSettings',
        ...setFields,
      }
      if (!newsletterUrl) {
        delete createDoc.newsletterUrl
      }
      if (!newsletterArchiveFolderUrl) {
        delete createDoc.newsletterArchiveFolderUrl
      }
      await client.create(
        createDoc as { _id: string; _type: 'siteSettings' } & Record<string, unknown>
      )
      return NextResponse.json({ ok: true, created: true })
    }

    let patch = client.patch(SITE_SETTINGS_ID).set(setFields)
    if (!newsletterUrl) {
      patch = patch.unset(['newsletterUrl'])
    }
    if (!newsletterArchiveFolderUrl) {
      patch = patch.unset(['newsletterArchiveFolderUrl'])
    }
    if (sa && !trimUrl(sa.linkUrl)) {
      patch = patch.unset(['siteAnnouncement.linkUrl'])
    }
    if (sa && !trimStr(sa.linkText)) {
      patch = patch.unset(['siteAnnouncement.linkText'])
    }
    if (sa && !trimStr(sa.startDate)) {
      patch = patch.unset(['siteAnnouncement.startDate'])
    }
    if (sa && !trimStr(sa.endDate)) {
      patch = patch.unset(['siteAnnouncement.endDate'])
    }

    await patch.commit()

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('site-settings PATCH:', err)
    return NextResponse.json({ error: 'Failed to save site settings' }, { status: 500 })
  }
}
