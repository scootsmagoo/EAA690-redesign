/**
 * Visitor / member preferences shared by client + server.
 *
 * Storage strategy:
 *   - Anonymous visitors: localStorage (key = STORAGE_KEY) + a small public
 *     cookie (THEME_COOKIE) so the SSR layout can render `<html class="dark">`
 *     before hydration (no flash-of-incorrect-theme).
 *   - Signed-in members: same as above PLUS a server-persisted copy on the
 *     `user.preferences` column (synced via /api/me/preferences). On a fresh
 *     device, the client merges server + local on first load.
 *
 * Security notes (OWASP):
 *   - Cookie is intentionally non-HttpOnly (client must read it). It carries
 *     no PII — only an enum value ('system' | 'light' | 'dark'), so this is
 *     safe under the existing CSP and does not expand attack surface.
 *   - All values are validated with the `parsePreferences` helper before being
 *     applied to the DOM or persisted, so a tampered localStorage / cookie
 *     value cannot inject unexpected strings into the rendered HTML.
 *   - Server route uses a session check + JSON.stringify of a normalized
 *     payload, never raw user JSON, before writing to the DB.
 */

export const PREFERENCES_VERSION = 1
export const STORAGE_KEY = 'eaa690:prefs:v1'
/** Public, non-HttpOnly cookie consumed by the SSR layout for first-paint theming. */
export const THEME_COOKIE = 'eaa690_theme'
/** Public, non-HttpOnly cookie that captures the user's *resolved* color scheme
 *  (light/dark) — used by SSR when ThemePref is "system" so we can still set
 *  `<html class="dark">` before hydration. */
export const RESOLVED_THEME_COOKIE = 'eaa690_theme_resolved'

export type ThemePref = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'
export type FontScale = 'normal' | 'large' | 'xl'

export interface UserPreferences {
  version: number
  theme: ThemePref
  /** When true, force-disable animation regardless of OS prefers-reduced-motion. */
  reduceMotion: boolean
  /** Force WCAG-AAA contrast tokens (heavier text weight, stronger borders). */
  highContrast: boolean
  /** Persistent text scale — applied to <html> via CSS variable. */
  fontScale: FontScale
  /** Always underline links sitewide (WCAG 1.4.1 — color is not the sole means). */
  underlineLinks: boolean
}

export const DEFAULT_PREFERENCES: UserPreferences = Object.freeze({
  version: PREFERENCES_VERSION,
  theme: 'system',
  reduceMotion: false,
  highContrast: false,
  fontScale: 'normal',
  underlineLinks: false,
})

const THEME_VALUES: ReadonlySet<ThemePref> = new Set<ThemePref>(['system', 'light', 'dark'])
const FONT_SCALE_VALUES: ReadonlySet<FontScale> = new Set<FontScale>(['normal', 'large', 'xl'])

/**
 * Defensive: never trust the input. Returns a fully-formed preferences object
 * (defaults filled in) or null when the input is fundamentally malformed.
 *
 * Accepts the shape the API returns, the shape we store in localStorage, and
 * the shape we read from the user.preferences DB column.
 */
export function parsePreferences(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_PREFERENCES }
  const r = raw as Record<string, unknown>

  const themeRaw = typeof r.theme === 'string' ? r.theme : DEFAULT_PREFERENCES.theme
  const fontRaw = typeof r.fontScale === 'string' ? r.fontScale : DEFAULT_PREFERENCES.fontScale

  return {
    version: PREFERENCES_VERSION,
    theme: THEME_VALUES.has(themeRaw as ThemePref) ? (themeRaw as ThemePref) : DEFAULT_PREFERENCES.theme,
    reduceMotion: r.reduceMotion === true,
    highContrast: r.highContrast === true,
    fontScale: FONT_SCALE_VALUES.has(fontRaw as FontScale) ? (fontRaw as FontScale) : 'normal',
    underlineLinks: r.underlineLinks === true,
  }
}

/** Compact JSON serialization used for both DB persistence and localStorage. */
export function serializePreferences(p: UserPreferences): string {
  return JSON.stringify(parsePreferences(p))
}

/** Resolve "system" against the user's OS preference. Server-safe (returns 'light' fallback). */
export function resolveTheme(theme: ThemePref, systemPrefersDark: boolean): ResolvedTheme {
  if (theme === 'dark') return 'dark'
  if (theme === 'light') return 'light'
  return systemPrefersDark ? 'dark' : 'light'
}

/** Map font scale to the CSS root font-size used by the `text-*` Tailwind units. */
export const FONT_SCALE_REM: Record<FontScale, string> = {
  normal: '100%',
  large: '112.5%', // 18px base
  xl: '125%',     // 20px base
}
