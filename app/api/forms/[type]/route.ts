import { NextRequest, NextResponse } from 'next/server'
import { insertSubmission, FormType } from '@/lib/forms-db'
import { normalizeUsPhoneForStorage, PROGRAM_FORM_PHONE_FIELDS } from '@/lib/us-phone'
import { getProgramSlotForFormType, type ProgramFormTypeKey } from '@/lib/program-availability'
import { getProgramFormsSettings } from '@/lib/program-forms-sanity'
import { allowFormSubmission } from '@/lib/form-rate-limit'
import { validateProgramFormPayload } from '@/lib/program-form-validate'
import { sendProgramFormNotificationEmail } from '@/lib/program-form-email'

const VALID_FORM_TYPES: FormType[] = ['summer_camp', 'scholarship', 'vmc_imc', 'youth_aviation']

// O1: Reject requests whose body exceeds this limit (prevents large-payload DoS)
const MAX_BODY_BYTES = 32_768 // 32 KB — ample for any legitimate form submission

function clientIp(request: NextRequest): string {
  const xf = request.headers.get('x-forwarded-for')
  if (xf) return xf.split(',')[0]?.trim().slice(0, 128) || 'unknown'
  return request.headers.get('x-real-ip')?.trim().slice(0, 128) || 'unknown'
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ type: string }> }
) {
  const { type } = await context.params

  if (!allowFormSubmission(`form:${clientIp(request)}`)) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 })
  }

  if (!VALID_FORM_TYPES.includes(type as FormType)) {
    return NextResponse.json({ error: 'Invalid form type' }, { status: 400 })
  }

  const formType = type as FormType
  const programSlots = await getProgramFormsSettings()
  if (!getProgramSlotForFormType(formType as ProgramFormTypeKey, programSlots).registrationOpen) {
    return NextResponse.json(
      { error: 'This program is not accepting submissions right now.' },
      { status: 403 }
    )
  }

  // O1: Enforce payload size limit before parsing
  const contentLength = request.headers.get('content-length')
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  let raw: string
  try {
    raw = await request.text()
  } catch {
    return NextResponse.json({ error: 'Could not read request body' }, { status: 400 })
  }

  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  let data: Record<string, unknown>
  try {
    data = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return NextResponse.json({ error: 'Body must be a JSON object' }, { status: 400 })
  }

  // O2/O3: Honeypot check — bots that fill all fields will populate this; humans never see it
  if (typeof data.website === 'string' && data.website.trim() !== '') {
    // Silently accept so bots don't learn they were detected
    return NextResponse.json({ success: true, id: 'honeypot' }, { status: 201 })
  }

  // Strip the honeypot field before persisting
  const { website: _hp, ...rest } = data as Record<string, unknown>
  void _hp

  const payload: Record<string, unknown> = { ...rest }
  for (const key of PROGRAM_FORM_PHONE_FIELDS) {
    if (key in payload) {
      payload[key] = normalizeUsPhoneForStorage(payload[key])
    }
  }

  const invalid = validateProgramFormPayload(formType, payload)
  if (invalid) {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
  }

  try {
    const id = await insertSubmission(formType, payload)

    if (process.env.RESEND_API_KEY?.trim() && process.env.CONTACT_EMAIL_FROM?.trim()) {
      try {
        await sendProgramFormNotificationEmail(formType, payload)
      } catch (emailErr) {
        console.error('Program form notification email failed:', emailErr)
      }
    }

    return NextResponse.json({ success: true, id }, { status: 201 })
  } catch (error) {
    console.error('Failed to save form submission:', error)
    return NextResponse.json({ error: 'Failed to save submission' }, { status: 500 })
  }
}
