import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/better-auth'
import {
  getContactSubmissions,
  isContactSubmissionId,
  updateSubmissionStatus,
  type SubmissionStatus,
} from '@/lib/forms-db'
import { getContactSubjectLabel, type ContactSubjectKey } from '@/lib/contact-categories'

async function requireAdmin(request: NextRequest): Promise<true | NextResponse> {
  const session = await getAuth().api.getSession({ headers: request.headers })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if ((session.user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 })
  }
  return true
}

const CSV_HEADERS = [
  'id',
  'submitted_at',
  'status',
  'name',
  'email',
  'phone',
  'subject',
  'message',
] as const

/** GET /api/admin/contact-messages?export=csv */
export async function GET(request: NextRequest) {
  const check = await requireAdmin(request)
  if (check !== true) return check

  const { searchParams } = new URL(request.url)
  const exportCsv = searchParams.get('export') === 'csv'

  const escape = (v: unknown): string => {
    if (v === null || v === undefined) return ''
    const str = String(v)
    const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str
    return safe.includes(',') || safe.includes('"') || safe.includes('\n')
      ? `"${safe.replace(/"/g, '""')}"`
      : safe
  }

  try {
    const submissions = await getContactSubmissions()

    if (exportCsv) {
      if (submissions.length === 0) {
        return new NextResponse(`${CSV_HEADERS.join(',')}\n`, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="contact-messages-${new Date().toISOString().slice(0, 10)}.csv"`,
          },
        })
      }
      const rows = submissions.map((s) => {
        const d = s.data
        const subjectKey = d.subject
        const subjectLabel =
          typeof subjectKey === 'string' && subjectKey
            ? getContactSubjectLabel(subjectKey as ContactSubjectKey)
            : ''
        return [
          s.id,
          s.submitted_at,
          s.status,
          d.name,
          d.email,
          d.phone,
          subjectLabel,
          d.message,
        ].map(escape)
      })
      const line = (cells: string[]) => cells.join(',')
      return new NextResponse(
        [line([...CSV_HEADERS]), ...rows.map((r) => line(r))].join('\n'),
        {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="contact-messages-${new Date().toISOString().slice(0, 10)}.csv"`,
          },
        }
      )
    }

    return NextResponse.json({ messages: submissions })
  } catch (error) {
    console.error('Failed to fetch contact messages:', error)
    return NextResponse.json({ error: 'Failed to fetch contact messages' }, { status: 500 })
  }
}

/** PATCH /api/admin/contact-messages */
export async function PATCH(request: NextRequest) {
  const check = await requireAdmin(request)
  if (check !== true) return check

  let body: { id?: string; status?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { id, status } = body
  const validStatuses: SubmissionStatus[] = ['pending', 'reviewed', 'accepted', 'declined']

  if (!id || !status || !validStatuses.includes(status as SubmissionStatus)) {
    return NextResponse.json(
      { error: `id and status (one of: ${validStatuses.join(', ')}) are required` },
      { status: 400 }
    )
  }

  const exists = await isContactSubmissionId(id)
  if (!exists) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    await updateSubmissionStatus(id, status as SubmissionStatus)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update contact message status:', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
