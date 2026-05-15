import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/better-auth'
import {
  APPROVAL_STATUSES,
  getUserApprovalState,
  listUsersByApprovalStatus,
  setUserApprovalStatus,
  type ApprovalStatus,
} from '@/lib/account-approval-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function requireAdmin(request: NextRequest) {
  const session = await getAuth().api.getSession({ headers: request.headers })
  const role = (session?.user as { role?: string | null } | undefined)?.role
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }
  if (role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 }) }
  }
  return {
    admin: {
      id: String(session.user.id),
      email: session.user.email,
      name: session.user.name,
    },
  }
}

function parseStatus(value: string | null): ApprovalStatus | undefined {
  if (!value) return undefined
  return APPROVAL_STATUSES.includes(value as ApprovalStatus)
    ? (value as ApprovalStatus)
    : undefined
}

export async function GET(request: NextRequest) {
  const check = await requireAdmin(request)
  if ('error' in check) return check.error

  const { searchParams } = new URL(request.url)
  const rawStatus = searchParams.get('status')
  const status = parseStatus(rawStatus)
  if (rawStatus && !status) {
    return NextResponse.json(
      { error: `Invalid status. Must be one of: ${APPROVAL_STATUSES.join(', ')}` },
      { status: 400 }
    )
  }

  try {
    const users = await listUsersByApprovalStatus(status)
    return NextResponse.json({ users })
  } catch (error) {
    console.error('Failed to list registration approvals:', error)
    return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const check = await requireAdmin(request)
  if ('error' in check) return check.error

  let body: { userId?: string; status?: string; reason?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const userId = body.userId?.trim()
  const status = parseStatus(body.status ?? null)
  if (!userId || !status) {
    return NextResponse.json({ error: 'userId and valid status are required' }, { status: 400 })
  }

  if (status === 'pending') {
    return NextResponse.json({ error: 'Use approve or reject for review actions' }, { status: 400 })
  }

  if (userId === check.admin.id && status !== 'approved') {
    return NextResponse.json({ error: "You can't reject your own account." }, { status: 400 })
  }

  try {
    const target = await getUserApprovalState(userId)
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    if (target.role === 'admin' && status !== 'approved') {
      return NextResponse.json({ error: 'Admin accounts cannot be rejected.' }, { status: 400 })
    }

    const user = await setUserApprovalStatus({
      userId,
      status,
      actorId: check.admin.id,
      reason: body.reason,
    })
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Failed to update registration approval:', error)
    return NextResponse.json({ error: 'Failed to update registration' }, { status: 500 })
  }
}
