'use client'

import { useEffect, useId, useState } from 'react'
import Link from 'next/link'
import { useTheme } from '@/components/ThemeProvider'
import { useSession } from '@/lib/better-auth-client'
import { useIsAdmin, useIsEditor } from '@/lib/auth-utils'
import type { FontScale, ThemePref } from '@/lib/preferences'

const themeOptions: Array<{
  value: ThemePref
  label: string
  description: string
}> = [
  {
    value: 'system',
    label: 'Match my device',
    description: 'Follow your operating system setting (recommended).',
  },
  {
    value: 'light',
    label: 'Light',
    description: 'Bright background — best in well-lit rooms.',
  },
  {
    value: 'dark',
    label: 'Dark',
    description: 'Dimmed background — easier on the eyes at night.',
  },
]

const fontOptions: Array<{ value: FontScale; label: string; sample: string }> = [
  { value: 'normal', label: 'Default (100%)', sample: '16px base text' },
  { value: 'large', label: 'Large (112%)', sample: '18px base text' },
  { value: 'xl', label: 'Extra large (125%)', sample: '20px base text' },
]

/** Sun/moon icon next to the resolved theme indicator. */
function ThemeIcon({ resolved }: { resolved: 'light' | 'dark' }) {
  if (resolved === 'dark') {
    return (
      <svg
        className="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"
        />
      </svg>
    )
  }
  return (
    <svg
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
      />
    </svg>
  )
}

export default function SettingsForm() {
  const {
    preferences,
    resolvedTheme,
    systemPrefersDark,
    loaded,
    saving,
    syncedToServer,
    setPreferences,
    resetPreferences,
  } = useTheme()
  const { data: session } = useSession()
  const isAdmin = useIsAdmin()
  const isEditor = useIsEditor()
  const groupId = useId()

  const [cookieChoice, setCookieChoice] = useState<string | null>(null)
  useEffect(() => {
    setCookieChoice(typeof window === 'undefined' ? null : localStorage.getItem('cookie-consent'))
  }, [])

  function clearCookieConsent() {
    try {
      localStorage.removeItem('cookie-consent')
      setCookieChoice(null)
    } catch {
      // localStorage may be disabled — nothing else we can do.
    }
  }

  const showSyncBadge = !!session?.user
  const isSignedIn = !!session?.user

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-eaa-blue dark:text-eaa-yellow">Settings</h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Personal preferences for how this site looks on your device. Saved automatically.
          {isSignedIn ? (
            <> Your choices follow you across devices when you&rsquo;re signed in.</>
          ) : (
            <>
              {' '}
              <Link
                href="/sign-in"
                className="text-eaa-light-blue dark:text-sky-300 underline underline-offset-2"
              >
                Sign in
              </Link>{' '}
              to sync these settings across your other devices.
            </>
          )}
        </p>
        {showSyncBadge ? (
          <p
            className="mt-3 inline-flex items-center gap-1.5 text-xs rounded-full px-2.5 py-1 bg-blue-50 text-eaa-blue border border-blue-100 dark:bg-eaa-surface-dark dark:text-sky-300 dark:border-eaa-border-dark"
            aria-live="polite"
          >
            {saving ? (
              <>
                <span
                  className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse"
                  aria-hidden="true"
                />
                Saving…
              </>
            ) : syncedToServer ? (
              <>
                <span
                  className="inline-block h-2 w-2 rounded-full bg-green-500"
                  aria-hidden="true"
                />
                Synced to your account
              </>
            ) : (
              <>
                <span
                  className="inline-block h-2 w-2 rounded-full bg-gray-400"
                  aria-hidden="true"
                />
                Saved on this device
              </>
            )}
          </p>
        ) : null}
      </div>

      {!loaded ? (
        <p className="text-gray-500" role="status" aria-live="polite">
          Loading your preferences…
        </p>
      ) : (
        <div className="space-y-8">
          {/* THEME */}
          <section
            aria-labelledby={`${groupId}-theme`}
            className="bg-white dark:bg-eaa-surface-dark rounded-lg shadow-sm border border-gray-200 dark:border-eaa-border-dark p-6"
          >
            <header className="flex items-start justify-between gap-4 mb-1">
              <h2
                id={`${groupId}-theme`}
                className="text-lg font-bold text-eaa-blue dark:text-eaa-yellow"
              >
                Appearance
              </h2>
              <span
                className="inline-flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300 px-2 py-1 rounded-md bg-gray-50 dark:bg-eaa-bg-dark border border-gray-200 dark:border-eaa-border-dark"
                aria-live="polite"
              >
                <ThemeIcon resolved={resolvedTheme} />
                Currently <strong className="font-semibold">{resolvedTheme}</strong>
                {preferences.theme === 'system' ? (
                  <span className="text-gray-500 dark:text-gray-400">
                    (your device prefers {systemPrefersDark ? 'dark' : 'light'})
                  </span>
                ) : null}
              </span>
            </header>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Choose how the site looks on this device. The change applies right away.
            </p>
            <fieldset
              className="grid grid-cols-1 sm:grid-cols-3 gap-3"
              role="radiogroup"
              aria-labelledby={`${groupId}-theme`}
            >
              <legend className="sr-only">Theme</legend>
              {themeOptions.map((opt) => {
                const checked = preferences.theme === opt.value
                return (
                  <label
                    key={opt.value}
                    className={`relative flex flex-col gap-1 p-3 rounded-md border cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-eaa-light-blue ${
                      checked
                        ? 'border-eaa-blue bg-blue-50 dark:bg-eaa-bg-dark dark:border-eaa-yellow'
                        : 'border-gray-200 dark:border-eaa-border-dark hover:border-eaa-light-blue'
                    }`}
                  >
                    <input
                      type="radio"
                      name="theme"
                      value={opt.value}
                      checked={checked}
                      onChange={() => setPreferences({ theme: opt.value })}
                      className="sr-only"
                    />
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {opt.label}
                    </span>
                    <span className="text-xs text-gray-600 dark:text-gray-300">
                      {opt.description}
                    </span>
                  </label>
                )
              })}
            </fieldset>
          </section>

          {/* ACCESSIBILITY */}
          <section
            aria-labelledby={`${groupId}-a11y`}
            className="bg-white dark:bg-eaa-surface-dark rounded-lg shadow-sm border border-gray-200 dark:border-eaa-border-dark p-6"
          >
            <h2
              id={`${groupId}-a11y`}
              className="text-lg font-bold text-eaa-blue dark:text-eaa-yellow mb-1"
            >
              Accessibility
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Optional adjustments to make the site easier to read and use.
            </p>

            <div className="space-y-5">
              <fieldset>
                <legend className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Text size
                </legend>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {fontOptions.map((opt) => {
                    const checked = preferences.fontScale === opt.value
                    return (
                      <label
                        key={opt.value}
                        className={`flex flex-col gap-1 p-3 rounded-md border cursor-pointer transition-colors focus-within:ring-2 focus-within:ring-eaa-light-blue ${
                          checked
                            ? 'border-eaa-blue bg-blue-50 dark:bg-eaa-bg-dark dark:border-eaa-yellow'
                            : 'border-gray-200 dark:border-eaa-border-dark hover:border-eaa-light-blue'
                        }`}
                      >
                        <input
                          type="radio"
                          name="fontScale"
                          value={opt.value}
                          checked={checked}
                          onChange={() => setPreferences({ fontScale: opt.value })}
                          className="sr-only"
                        />
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {opt.label}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-300">
                          {opt.sample}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </fieldset>

              <ToggleRow
                id="reduceMotion"
                checked={preferences.reduceMotion}
                onChange={(v) => setPreferences({ reduceMotion: v })}
                label="Reduce motion"
                hint="Turn off slide-ins, spinners, and smooth-scrolling effects (helpful for vestibular sensitivity). Your operating system setting is also honored."
              />

              <ToggleRow
                id="highContrast"
                checked={preferences.highContrast}
                onChange={(v) => setPreferences({ highContrast: v })}
                label="High-contrast borders & focus rings"
                hint="Strengthens borders, removes muted text, and thickens the keyboard focus ring (WCAG AAA contrast)."
              />

              <ToggleRow
                id="underlineLinks"
                checked={preferences.underlineLinks}
                onChange={(v) => setPreferences({ underlineLinks: v })}
                label="Always underline links in body text"
                hint="Helps if you can't easily distinguish link colors (WCAG 1.4.1 — color is not the sole means)."
              />
            </div>
          </section>

          {/* PRIVACY / COOKIES */}
          <section
            aria-labelledby={`${groupId}-privacy`}
            className="bg-white dark:bg-eaa-surface-dark rounded-lg shadow-sm border border-gray-200 dark:border-eaa-border-dark p-6"
          >
            <h2
              id={`${groupId}-privacy`}
              className="text-lg font-bold text-eaa-blue dark:text-eaa-yellow mb-1"
            >
              Privacy &amp; data use
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              Your appearance and accessibility settings are stored only on this device
              {isSignedIn ? ' and synced to your account' : ''}. They do not contain personal
              information.
            </p>
            <dl className="text-sm grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <dt className="text-gray-600 dark:text-gray-400">Cookie banner choice</dt>
                <dd className="text-gray-900 dark:text-gray-100 font-medium">
                  {cookieChoice ?? 'Not set yet'}
                </dd>
              </div>
              <div>
                <dt className="text-gray-600 dark:text-gray-400">Stored on</dt>
                <dd className="text-gray-900 dark:text-gray-100 font-medium">
                  {isSignedIn ? 'This device + your account' : 'This device only'}
                </dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={clearCookieConsent}
                disabled={!cookieChoice}
                className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-eaa-border-dark text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-eaa-bg-dark disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset cookie banner choice
              </button>
              <button
                type="button"
                onClick={() => {
                  if (
                    typeof window !== 'undefined' &&
                    window.confirm('Reset all preferences to defaults?')
                  ) {
                    resetPreferences()
                  }
                }}
                className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 dark:border-eaa-border-dark text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-eaa-bg-dark"
              >
                Reset all preferences
              </button>
              <Link
                href="/privacy"
                className="px-4 py-2 text-sm font-medium rounded-md text-eaa-light-blue dark:text-sky-300 hover:underline"
              >
                Read the full privacy notice →
              </Link>
            </div>
          </section>

          {/* MEMBER / ADMIN LINKS */}
          <section
            aria-labelledby={`${groupId}-more`}
            className="bg-white dark:bg-eaa-surface-dark rounded-lg shadow-sm border border-gray-200 dark:border-eaa-border-dark p-6"
          >
            <h2
              id={`${groupId}-more`}
              className="text-lg font-bold text-eaa-blue dark:text-eaa-yellow mb-1"
            >
              More settings
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {isSignedIn ? (
                <li>
                  <Link
                    href="/account"
                    className="text-eaa-light-blue dark:text-sky-300 hover:underline font-medium"
                  >
                    Account &amp; security →
                  </Link>
                  <span className="block text-gray-600 dark:text-gray-300 text-xs">
                    Two-factor authentication, password, billing portal.
                  </span>
                </li>
              ) : (
                <li>
                  <Link
                    href="/sign-in"
                    className="text-eaa-light-blue dark:text-sky-300 hover:underline font-medium"
                  >
                    Sign in to manage your member account →
                  </Link>
                </li>
              )}
              {(isAdmin || isEditor) && (
                <li>
                  <Link
                    href="/admin/settings"
                    className="text-eaa-light-blue dark:text-sky-300 hover:underline font-medium"
                  >
                    Site-wide settings (admin) →
                  </Link>
                  <span className="block text-gray-600 dark:text-gray-300 text-xs">
                    Brand, contact, announcement banner, program signup toggles, store visibility.
                  </span>
                </li>
              )}
            </ul>
          </section>
        </div>
      )}
    </div>
  )
}

function ToggleRow({
  id,
  checked,
  onChange,
  label,
  hint,
}: {
  id: string
  checked: boolean
  onChange: (next: boolean) => void
  label: string
  hint: string
}) {
  const hintId = `${id}-hint`
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        role="switch"
        id={id}
        aria-checked={checked}
        aria-describedby={hintId}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors mt-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-eaa-light-blue focus-visible:ring-offset-2 dark:focus-visible:ring-offset-eaa-surface-dark ${
          checked ? 'bg-eaa-blue dark:bg-eaa-yellow' : 'bg-gray-300 dark:bg-eaa-border-dark'
        }`}
      >
        <span className="sr-only">{label}</span>
        <span
          aria-hidden="true"
          className={`inline-block h-5 w-5 rounded-full bg-white dark:bg-eaa-bg-dark shadow transform transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0.5'
          }`}
        />
      </button>
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
          {label}
        </span>
        <span id={hintId} className="block text-xs text-gray-600 dark:text-gray-300 mt-0.5">
          {hint}
        </span>
      </label>
    </div>
  )
}
