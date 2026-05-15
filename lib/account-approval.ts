import { NextRequest, NextResponse } from 'next/server'
import { getAuth } from '@/lib/better-auth'
import { getUserApprovalState, isApprovedUser, type UserApprovalState } from '@/lib/account-approval-db'

export type ApprovedSession = {
  user: {
    id: string
    email?: string
    name?: string | null
    role?: string | null
    [key: string]: unknown
  }
  approval: UserApprovalState
}

export async function getSessionApproval(request: NextRequest): Promise<{
  sessionUser: ApprovedSession['user'] | null
  approval: UserApprovalState | null
}> {
  const session = await getAuth().api.getSession({ headers: request.headers })
  if (!session?.user?.id) {
    return { sessionUser: null, approval: null }
  }

  const sessionUser = {
    ...session.user,
    id: String(session.user.id),
    role: (session.user as { role?: string | null }).role ?? null,
  }
  const approval = await getUserApprovalState(sessionUser.id)
  return { sessionUser, approval }
}

export async function requireApprovedSession(
  request: NextRequest
): Promise<ApprovedSession | NextResponse> {
  const { sessionUser, approval } = await getSessionApproval(request)
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!approval || !isApprovedUser(approval)) {
    return NextResponse.json(
      {
        error: 'Account pending approval',
        approvalStatus: approval?.approvalStatus ?? 'pending',
      },
      { status: 403 }
    )
  }

  return { user: sessionUser, approval }
}
