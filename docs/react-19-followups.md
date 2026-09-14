# React 19.3 follow-ups: what we adopted, what we deferred, and why

Written after the React 19.3 / Next 16.3.5 upgrade (PR #18, September 2026).
This is a decision record: when one of the deferred items comes up again,
start here instead of re-deriving the trade-offs.

## Adopted in PR #18

- `<ViewTransition>` shared-element morphs (news, kudos, media, NAVCOM listing
  → detail), directional slides between adjacent NAVCOM issues, and in-page
  transitions (lightbox, slideshow, mobile nav drawer, archive filters).
  Helper: `components/SharedElement.tsx`. CSS: end of `app/globals.css`.
  Everything collapses to 0 s under `prefers-reduced-motion` and the
  `/settings` reduce-motion toggle.
- `browser()` from `react-dom` in `components/CookieBanner.tsx` (client-only
  component that suspends on the server instead of using a mount effect).
- `useEffectEvent` for the lightbox keyboard handler.
- `<Context value>` shorthand in the theme and cart providers.

## Deferred

### React Compiler — do it, as its own PR, after 19.3 has been in production a few weeks

**What it gives us.** Automatic memoization. Most hand-written `useMemo` /
`useCallback` become optional and re-render performance improves without
touching component code. Stable in Next 16 (`reactCompiler: true` in
`next.config.js` plus the `babel-plugin-react-compiler` dev dependency).

**Risks.**
- The compiler only optimizes components that follow the Rules of React and
  silently skips the rest, so coverage is uneven rather than broken. The
  ~40 `react-hooks/set-state-in-effect` warnings we keep as warnings are
  exactly the kind of thing it skips.
- Client components go through Babel, so builds get slower. Sanity Studio is
  a large client bundle; watch Vercel build time on the preview deploy.
- Does not touch Sanity or Stripe integration code.

**How to do it safely.**
1. Fix the hooks-lint warnings in the components you care most about (the
   compiler lint rules ship in the `eslint-plugin-react-hooks` we already
   have). `useSyncExternalStore` or `browser()` replace most mount-time
   `localStorage` / `matchMedia` reads.
2. Enable `reactCompiler: true`, open a PR, compare preview build time and
   click through the app.
3. Only then start deleting manual memoization, and only where it's clearly
   redundant.

### Trusted Types — no, revisit in a year or when Sanity documents support

**What it is.** A CSP directive (`require-trusted-types-for 'script'`) that
makes the browser reject raw strings passed to DOM sinks like `innerHTML`,
closing off DOM-XSS. React 19.3 passes Trusted Types objects through
uncoerced, so React itself is no longer the blocker.

**Why not now.** Enforcing it breaks any third-party code that writes HTML or
script URLs without registering a policy, and it fails silently at runtime.
Sanity Studio (embedded at `/studio`) and Stripe.js are precisely that kind
of code, and neither documents Trusted Types support. The site already
sanitizes CMS-supplied links (`lib/search-safety.ts`) and runs a strict CSP
(`next.config.js`), so the marginal gain is small next to the risk of
breaking the editor workflow or checkout.

**If revisiting.** Start with `Content-Security-Policy-Report-Only` plus a
report endpoint, load `/studio` and a Stripe checkout, and read the
violation reports before enforcing anything.

### Fragment refs — no

Stable in 19.3, but nothing in this codebase needs a handle on a group of
DOM nodes without a wrapper element. Adding them would be using a feature
for its own sake.

### Remaining hooks-lint warnings — low priority; fold into the compiler PR

The ~40 `react-hooks/set-state-in-effect` warnings are mount-time reads of
`localStorage`, `matchMedia`, or URL state into React state. They're not
bugs; `eslint.config.mjs` keeps them as warnings on purpose. Converting them
is zero-risk if done one component at a time (the `CookieBanner` change in
PR #18 is the template), but the only concrete payoff is better React
Compiler coverage, so do them alongside that work rather than on their own.

## General rule we settled on

Keep Sanity Studio and Stripe on well-trodden paths. Adopt new React and
Next features where they touch only our own components (transitions, hooks,
context), and let anything that changes how third-party code executes
(Trusted Types, CSP tightening, major Studio upgrades) wait until it has
been out for a while and the vendors document support.
