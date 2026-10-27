import { INACTIVITY_MS, isInactive, isSignedInScreen } from '../inactivity'

describe('inactivity', () => {
  const now = Date.parse('2026-10-25T10:00:00Z')

  it('signs out after 20 minutes without activity, like the website', () => {
    expect(INACTIVITY_MS).toBe(20 * 60 * 1000)
    expect(isInactive(now - INACTIVITY_MS + 1000, now)).toBe(false)
    expect(isInactive(now - INACTIVITY_MS, now)).toBe(true)
    expect(isInactive(now - 2 * 60 * 60 * 1000, now)).toBe(true)
  })
  it('treats a session without a stored activity as unused', () => {
    expect(isInactive(null, now)).toBe(true)
  })
  it('only leaves the screens of a signed-in client', () => {
    expect(isSignedInScreen('/demandes')).toBe(true)
    expect(isSignedInScreen('/demandes/abc')).toBe(true)
    expect(isSignedInScreen('/messages/abc')).toBe(true)
    expect(isSignedInScreen('/compte')).toBe(true)
    expect(isSignedInScreen('/')).toBe(false)
    expect(isSignedInScreen('/demande/adresse')).toBe(false)
    expect(isSignedInScreen('/connexion')).toBe(false)
  })
})
