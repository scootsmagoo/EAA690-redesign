import { ensureUserApprovalSchema, setUserApprovalStatus } from './account-approval-db'
import { isRosterEntryCurrent } from './member-roster'
import { ensureMemberRosterSchema, getRosterMatches, listPendingVerifiedUsers } from './member-roster-db'

/**
 * Value written to `user.approvedBy` when the roster (not a person) approved an
 * account. The admin Registrations page shows these as "Approved automatically".
 */
export const ROSTER_APPROVER = 'member-roster'

/**
 * Approve pending accounts whose **verified** email matches a current roster
 * entry. Verification matters: without it, anyone who knows a member's email
 * address could sign up with it and be approved instantly.
 *
 * Accounts that don't match (e.g. a spouse or teen on a family membership
 * signing up with their own address — the roster lists one email per
 * household) stay pending for an admin to review by hand.
 *
 * @param userId limit to one account; omit to sweep every pending account
 *   (done after each roster import).
 * @returns number of accounts approved
 */
export async function autoApproveFromRoster(userId?: string): Promise<number> {
  await ensureUserApprovalSchema()
  await ensureMemberRosterSchema()
  const candidates = await listPendingVerifiedUsers(userId)
  if (candidates.length === 0) return 0

  const matches = await getRosterMatches(candidates.map((u) => u.email))
  const now = new Date()
  let approved = 0
  for (const user of candidates) {
    const match = matches.get(user.email.trim().toLowerCase())
    if (!match || !isRosterEntryCurrent(match, now)) continue
    await setUserApprovalStatus({ userId: user.id, status: 'approved', actorId: ROSTER_APPROVER })
    approved += 1
  }
  return approved
}
