/**
 * Inline <script> that runs *before* React hydration and applies the user's
 * persisted theme preference + accessibility flags to <html>. Without this,
 * dark-mode users see a "flash of incorrect theme" on every navigation.
 *
 * Safe under the existing CSP — `script-src 'self' 'unsafe-inline'` is already
 * granted in `next.config.js`, so we don't need a nonce. The script reads only
 * a small allow-list of values from the THEME_COOKIE / localStorage and falls
 * back to defaults on any error. No `eval`, no remote fetches, no user-supplied
 * strings interpolated into the DOM.
 */
import { THEME_COOKIE, RESOLVED_THEME_COOKIE, STORAGE_KEY } from '@/lib/preferences'

export function ThemeNoFlickerScript() {
  // Pure string — interpolated only constants we control. Browsers run this
  // synchronously in <head> before paint.
  const code = `
(function () {
  try {
    var STORAGE_KEY = ${JSON.stringify(STORAGE_KEY)};
    var THEME_COOKIE = ${JSON.stringify(THEME_COOKIE)};
    var RESOLVED_COOKIE = ${JSON.stringify(RESOLVED_THEME_COOKIE)};
    var FONT_REM = { normal: '100%', large: '112.5%', xl: '125%' };

    function readCookie(name) {
      var t = name + '=';
      var parts = (document.cookie || '').split(';');
      for (var i = 0; i < parts.length; i++) {
        var c = parts[i].trim();
        if (c.indexOf(t) === 0) {
          try { return decodeURIComponent(c.substring(t.length)); } catch (e) { return null; }
        }
      }
      return null;
    }

    var prefs = null;
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) prefs = JSON.parse(raw);
    } catch (e) { /* ignore */ }
    if (!prefs || typeof prefs !== 'object') prefs = {};

    var theme = prefs.theme;
    if (theme !== 'light' && theme !== 'dark' && theme !== 'system') {
      var ck = readCookie(THEME_COOKIE);
      theme = (ck === 'light' || ck === 'dark' || ck === 'system') ? ck : 'system';
    }

    var systemDark = false;
    try { systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches; } catch (e) {}

    var resolved = theme === 'dark' ? 'dark' : (theme === 'light' ? 'light' : (systemDark ? 'dark' : 'light'));

    var root = document.documentElement;
    if (resolved === 'dark') root.classList.add('dark'); else root.classList.remove('dark');
    root.setAttribute('data-theme', theme);
    root.setAttribute('data-resolved-theme', resolved);
    root.setAttribute('data-reduce-motion', prefs.reduceMotion === true ? 'true' : 'false');
    root.setAttribute('data-high-contrast', prefs.highContrast === true ? 'true' : 'false');
    var fs = (prefs.fontScale === 'large' || prefs.fontScale === 'xl') ? prefs.fontScale : 'normal';
    root.setAttribute('data-font-scale', fs);
    root.style.setProperty('--eaa-font-scale', FONT_REM[fs]);
    root.setAttribute('data-underline-links', prefs.underlineLinks === true ? 'true' : 'false');
    root.style.colorScheme = resolved;

    // Refresh the resolved cookie so future SSR can match exactly what's painted.
    try {
      var sec = location.protocol === 'https:' ? '; Secure' : '';
      document.cookie = RESOLVED_COOKIE + '=' + resolved + '; path=/; max-age=31536000; SameSite=Lax' + sec;
      if (theme && theme !== readCookie(THEME_COOKIE)) {
        document.cookie = THEME_COOKIE + '=' + theme + '; path=/; max-age=31536000; SameSite=Lax' + sec;
      }
    } catch (e) {}
  } catch (e) { /* defensive: never break the page if storage is unavailable */ }
})();
`.trim()

  return (
    <script
      // eslint-disable-next-line react/no-danger -- intentional: see file header.
      dangerouslySetInnerHTML={{ __html: code }}
    />
  )
}
