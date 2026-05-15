import { NextRequest, NextResponse } from 'next/server'
import { getSessionApproval } from '@/lib/account-approval'
import { isApprovedUser } from '@/lib/account-approval-db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const { sessionUser, approval } = await getSessionApproval(request)
  if (!sessionUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.json(
    {
      approvalStatus: approval?.approvalStatus ?? 'pending',
      approved: Boolean(approval && isApprovedUser(approval)),
      rejectedReason: approval?.rejectionReason ?? null,
    },
    { headers: { 'Cache-Control': 'private, no-store' } }
  )
}
