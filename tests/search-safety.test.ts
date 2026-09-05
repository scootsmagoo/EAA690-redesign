import { describe, expect, it } from 'vitest'
import { isSafeSiteHref, normalizeSearchQuery, safePortableTextLinkHref } from '@/lib/search-safety'

describe('normalizeSearchQuery', () => {
  it('trims and caps at 200 characters', () => {
    expect(normalizeSearchQuery('  breakfast ')).toBe('breakfast')
    expect(normalizeSearchQuery('a'.repeat(500))).toHaveLength(200)
  })
})

describe('isSafeSiteHref', () => {
  it('allows same-origin relative paths', () => {
    expect(isSafeSiteHref('/news/april-2026')).toBe(true)
    expect(isSafeSiteHref('/programs/young-eagles?tab=1')).toBe(true)
  })

  it('rejects protocol-relative, absolute, and scheme-smuggling values', () => {
    expect(isSafeSiteHref('//evil.example')).toBe(false)
    expect(isSafeSiteHref('https://evil.example')).toBe(false)
    expect(isSafeSiteHref('/x?u=javascript:alert(1)')).toBe(false)
    expect(isSafeSiteHref('/path\\..\\etc')).toBe(false)
    expect(isSafeSiteHref('/a"b')).toBe(false)
    expect(isSafeSiteHref('')).toBe(false)
  })
})

describe('safePortableTextLinkHref', () => {
  it('passes through http(s) URLs and safe site paths', () => {
    expect(safePortableTextLinkHref('https://eaa.org/')).toBe('https://eaa.org/')
    expect(safePortableTextLinkHref('/contact')).toBe('/contact')
  })

  it('blocks dangerous schemes and unparsable values', () => {
    expect(safePortableTextLinkHref('javascript:alert(1)')).toBeNull()
    expect(safePortableTextLinkHref('JavaScript:alert(1)')).toBeNull()
    expect(safePortableTextLinkHref('data:text/html,hi')).toBeNull()
    expect(safePortableTextLinkHref('ftp://files.example')).toBeNull()
    expect(safePortableTextLinkHref('//evil.example')).toBeNull()
    expect(safePortableTextLinkHref(null)).toBeNull()
    expect(safePortableTextLinkHref('   ')).toBeNull()
  })
})
