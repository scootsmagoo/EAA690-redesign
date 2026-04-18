'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { useSession } from '@/lib/better-auth-client'
import {
  DEFAULT_PREFERENCES,
  FONT_SCALE_REM,
  parsePreferences,
  resolveTheme,
  STORAGE_KEY,
  THEME_COOKIE,
  RESOLVED_THEME_COOKIE,
  type ResolvedTheme,
  type UserPreferences,
} from '@/lib/preferences'

interface ThemeContextValue {
  preferences: UserPreferences
  /** 'light' or 'dark' — what's actually applied to the DOM right now. */
  resolvedTheme: ResolvedTheme
  systemPrefersDark: boolean
  loaded: boolean
  saving: boolean
  syncedToServer: boolean
  setPreferences: (next: Partial<UserPreferences>) => void
  resetPreferences: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const target = name + '='
  for (const part of document.cookie.split(';')) {
    const c = part.trim()
    if (c.startsWith(target)) return decodeURIComponent(c.slice(target.length))
  }
  return null
}

function writeCookie(name: string, value: string) {
  if (typeof document === 'undefined') return
  // 1 year, SameSite=Lax. No PII; safe as non-HttpOnly.
  const secure = location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax${secure}`
}

function applyToDom(prefs: UserPreferences, resolved: ResolvedTheme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  // Theme class (Tailwind dark: variants key off this)
  root.classList.toggle('dark', resolved === 'dark')
  // Accessibility data-attrs (CSS in globals.css keys off these for visual changes)
  root.setAttribute('data-theme', prefs.theme)
  root.setAttribute('data-resolved-theme', resolved)
  root.setAttribute('data-reduce-motion', prefs.reduceMotion ? 'true' : 'false')
  root.setAttribute('data-high-contrast', prefs.highContrast ? 'true' : 'false')
  root.setAttribute('data-font-scale', prefs.fontScale)
  root.setAttribute('data-underline-links', prefs.underlineLinks ? 'true' : 'false')
  root.style.setProperty('--eaa-font-scale', FONT_SCALE_REM[prefs.fontScale])
  // Tell Chrome/Safari to color form widgets, scrollbars, etc.
  root.style.colorScheme = resolved
}

interface ThemeProviderProps {
  children: ReactNode
  /** Optional initial value rendered by the server via the THEME_COOKIE — avoids hydration jitter. */
  initialResolvedTheme?: ResolvedTheme
}

export function ThemeProvider({ children, initialResolvedTheme }: ThemeProviderProps) {
  const [preferences, setPrefsState] = useState<UserPreferences>(DEFAULT_PREFERENCES)
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(
    initialResolvedTheme === 'dark'
  )
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [syncedToServer, setSyncedToServer] = useState(false)

  const { data: session } = useSession()
  const userId = session?.user?.id ?? null

  // Most recent server-side payload — used to avoid clobbering with stale local
  // writes during the brief gap between hydrate and server fetch.
  const lastServerPrefsRef = useRef<UserPreferences | null>(null)
  // Debounce per-keystroke saves into a single PUT.
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // First mount: load preferences from localStorage and detect system preference.
  useEffect(() => {
    let initial: UserPreferences = DEFAULT_PREFERENCES
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) initial = parsePreferences(JSON.parse(raw))
    } catch {
      // Corrupt JSON / disabled storage — fall back to defaults.
    }
    setPrefsState(initial)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setSystemPrefersDark(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches)
    mq.addEventListener('change', onChange)
    setLoaded(true)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  // When signed in, fetch the server-persisted copy and merge it (server wins
  // when newer / present). Anonymous visitors skip this entirely.
  useEffect(() => {
    if (!userId) {
      setSyncedToServer(false)
      lastServerPrefsRef.current = null
      return
    }
    let aborted = false
    fetch('/api/me/preferences', { method: 'GET', credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (aborted || !data?.preferences) return
        const serverPrefs = parsePreferences(data.preferences)
        lastServerPrefsRef.current = serverPrefs
        setPrefsState(serverPrefs)
        setSyncedToServer(true)
      })
      .catch(() => {
        // Non-fatal; user keeps their local preferences.
      })
    return () => {
      aborted = true
    }
  }, [userId])

  // Apply current preferences to the DOM whenever they change.
  const resolved: ResolvedTheme = useMemo(
    () => resolveTheme(preferences.theme, systemPrefersDark),
    [preferences.theme, systemPrefersDark]
  )

  useEffect(() => {
    if (!loaded) return
    applyToDom(preferences, resolved)
    // Persist the cookie so the next SSR pass renders the right class on <html>.
    writeCookie(THEME_COOKIE, preferences.theme)
    writeCookie(RESOLVED_THEME_COOKIE, resolved)
  }, [preferences, resolved, loaded])

  // Persist locally + (if signed in) to the server with a small debounce so a
  // burst of toggle clicks doesn't spam the API route.
  const persistAll = useCallback(
    (next: UserPreferences) => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* storage disabled — keep going */
      }
      if (!userId) return
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      setSaving(true)
      saveTimerRef.current = setTimeout(async () => {
        try {
          const res = await fetch('/api/me/preferences', {
            method: 'PUT',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(next),
          })
          if (res.ok) {
            lastServerPrefsRef.current = next
            setSyncedToServer(true)
          }
        } catch {
          /* non-fatal — local copy is the source of truth */
        } finally {
          setSaving(false)
        }
      }, 350)
    },
    [userId]
  )

  const setPreferences = useCallback(
    (patch: Partial<UserPreferences>) => {
      setPrefsState((current) => {
        const next = parsePreferences({ ...current, ...patch })
        persistAll(next)
        return next
      })
    },
    [persistAll]
  )

  const resetPreferences = useCallback(() => {
    setPrefsState(DEFAULT_PREFERENCES)
    persistAll(DEFAULT_PREFERENCES)
  }, [persistAll])

  const value: ThemeContextValue = {
    preferences,
    resolvedTheme: resolved,
    systemPrefersDark,
    loaded,
    saving,
    syncedToServer,
    setPreferences,
    resetPreferences,
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used inside <ThemeProvider>.')
  }
  return ctx
}
