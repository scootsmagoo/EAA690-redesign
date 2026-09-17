/**
 * CI only (auth-upgrade job): create a member with whatever Better Auth version
 * is installed in the tree this file is copied into. The job runs it against the
 * BASE commit (= what production is running) so the HEAD commit then has to cope
 * with a database that a previous version created and populated — which is the
 * situation that broke sign-in twice in Sept 2026 and that a fresh-database test
 * can never reproduce.
 */
async function main() {
  const email = process.env.CI_AUTH_EMAIL
  const password = process.env.CI_AUTH_PASSWORD
  if (!email || !password) throw new Error('CI_AUTH_EMAIL / CI_AUTH_PASSWORD are required')

  const { getAuth, ensureBetterAuthSchema } = await import('../lib/better-auth')
  await ensureBetterAuthSchema()
  const result = await getAuth().api.signUpEmail({
    body: { name: 'CI Upgrade Probe', email, password },
  })
  if (!result?.user?.id) throw new Error('sign-up returned no user')
  console.log(`ci-auth-seed: created ${email} (${result.user.id})`)
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('ci-auth-seed: FAILED —', err instanceof Error ? err.message : err)
    process.exit(1)
  })
