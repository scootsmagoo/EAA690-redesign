import { describe, expect, it } from 'vitest'
import { AUTH_UNAVAILABLE_MESSAGE, authErrorMessage } from '@/lib/auth-error-message'

describe('authErrorMessage', () => {
  it('blames the server, not the password, on 5xx', () => {
    expect(authErrorMessage({ status: 500 }, 'Invalid email or password')).toBe(AUTH_UNAVAILABLE_MESSAGE)
    expect(authErrorMessage({ status: 503, message: 'x' }, 'fallback')).toBe(AUTH_UNAVAILABLE_MESSAGE)
  })

  it('uses the server message for 4xx rejections', () => {
    expect(authErrorMessage({ status: 401, message: 'Invalid email or password' }, 'fallback')).toBe(
      'Invalid email or password'
    )
  })

  it('falls back when there is no message', () => {
    expect(authErrorMessage({ status: 401 }, 'Invalid email or password')).toBe('Invalid email or password')
    expect(authErrorMessage(undefined, 'fallback')).toBe('fallback')
  })
})
