import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/better-auth'
import {
  getSubmissions,
  updateSubmissionStatus,
  FormType,
  SubmissionStatus,
} from '@/lib/forms-db'
import { orderedKeysForCsvExport } from '@/lib/submission-field-order'

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

/** GET /api/admin/submissions?type=summer_camp&export=csv */
export async function GET(request: NextRequest) {
  const check = await requireAdmin(request)
  if (check !== true) return check

  const { searchParams } = new URL(request.url)
  const form_type = searchParams.get('type') as FormType | null
  const exportCsv = searchParams.get('export') === 'csv'

  try {
    const submissions = await getSubmissions(form_type || undefined)

    if (exportCsv) {
      if (submissions.length === 0) {
        return new NextResponse('id,form_type,submitted_at,status\n', {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="submissions-${form_type ?? 'all'}-${new Date().toISOString().slice(0, 10)}.csv"`,
          },
        })
      }

      const allKeys = submissions.reduce((set, s) => {
        Object.keys(s.data).forEach((k) => set.add(k))
        return set
      }, new Set<string>())
      const dataKeys = orderedKeysForCsvExport(form_type, allKeys)

      // O3: Prefix values that start with formula-triggering characters to prevent
      // CSV injection (Excel/Sheets interpret leading =, +, -, @ as formulas).
      const escape = (v: unknown): string => {
        if (v === null || v === undefined) return ''
        const str = Array.isArray(v) ? v.join('; ') : String(v)
        const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str
        return safe.includes(',') || safe.includes('"') || safe.includes('\n')
          ? `"${safe.replace(/"/g, '""')}"`
          : safe
      }

      const header = ['id', 'form_type', 'submitted_at', 'status', ...dataKeys].join(',')
      const rows = submissions.map((s) => {
        const base = [s.id, s.form_type, s.submitted_at, s.status]
        const data = dataKeys.map((k) => escape(s.data[k]))
        return [...base, ...data].join(',')
      })

      return new NextResponse([header, ...rows].join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="submissions-${form_type ?? 'all'}-${new Date().toISOString().slice(0, 10)}.csv"`,
        },
      })
    }

    return NextResponse.json({ submissions })
  } catch (error) {
    console.error('Failed to fetch submissions:', error)
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 })
  }
}

/** PATCH /api/admin/submissions — update status
 *  Body: { id: string, status: 'pending' | 'reviewed' | 'accepted' | 'declined' }
 */
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

  try {
    await updateSubmissionStatus(id, status as SubmissionStatus)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to update submission status:', error)
    return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
  }
}
