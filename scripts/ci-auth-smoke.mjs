/**
 * End-to-end auth smoke test against a RUNNING server (CI: `next start` on the
 * production build; also usable by hand against any origin).
 *
 *   BASE_URL=http://localhost:3000 CI_AUTH_EMAIL=… CI_AUTH_PASSWORD=… node scripts/ci-auth-smoke.mjs
 *
 * Covers the real request pipeline, which is where both Sept 2026 outages lived:
 * health, Better Auth's /ok, sign-in of a member created by the PREVIOUS version,
 * session lookup with the issued cookie, and a brand-new sign-up + sign-in.
 * Plain Node (no deps) so it cannot be broken by the upgrade it is testing.
 */
const BASE = (process.env.BASE_URL || 'http://localhost:3000').replace(/\/$/, '')
const email = process.env.CI_AUTH_EMAIL
const password = process.env.CI_AUTH_PASSWORD

let failed = false
function check(name, ok, detail = '') {
  // Response detail only on failure: passing bodies contain session tokens.
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${!ok && detail ? `  — ${detail}` : ''}`)
  if (!ok) failed = true
}

async function call(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      ...(body ? { 'content-type': 'application/json' } : {}),
      origin: BASE,
      ...(cookie ? { cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {}
  const cookies = (res.headers.getSetCookie?.() ?? []).map((c) => c.split(';')[0]).join('; ')
  return { status: res.status, json, text: text.slice(0, 200), cookies }
}

async function signInAndCheckSession(label, creds) {
  const signIn = await call('/api/auth/sign-in/email', { method: 'POST', body: creds })
  check(`${label}: sign-in`, signIn.status === 200 && !!signIn.json?.user, `${signIn.status} ${signIn.text}`)
  const session = await call('/api/auth/get-session', { cookie: signIn.cookies })
  check(
    `${label}: session from cookie`,
    session.status === 200 && session.json?.user?.email === creds.email,
    `${session.status} ${session.text}`
  )
}

const health = await call('/api/health')
check('health endpoint', health.status === 200 && health.json?.ok === true, `${health.status} ${health.text}`)

const ok = await call('/api/auth/ok')
check('auth pipeline (/api/auth/ok)', ok.status === 200 && ok.json?.ok === true, `${ok.status} ${ok.text}`)

const anon = await call('/api/auth/get-session')
check('anonymous get-session', anon.status === 200, `${anon.status} ${anon.text}`)

if (email && password) {
  await signInAndCheckSession('member created by previous version', { email, password })
} else {
  console.log('SKIP  existing-member sign-in (CI_AUTH_EMAIL / CI_AUTH_PASSWORD not set)')
}

if (process.env.CI_AUTH_SKIP_SIGNUP !== '1') {
  const fresh = { email: `ci-new-${Date.now()}@example.com`, password: 'Ci-smoke-Passw0rd!' }
  const signUp = await call('/api/auth/sign-up/email', { method: 'POST', body: { name: 'CI New Member', ...fresh } })
  check('new sign-up', signUp.status === 200 && !!signUp.json?.user, `${signUp.status} ${signUp.text}`)
  await signInAndCheckSession('new member', fresh)
}

process.exit(failed ? 1 : 0)
