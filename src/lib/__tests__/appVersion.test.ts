import { versionLabel } from '../appVersion'

describe('versionLabel', () => {
  it('shows the version only for the code embedded in the store build', () => {
    expect(versionLabel('1.1.0', { isEmbeddedLaunch: true, createdAt: new Date(2026, 10, 12) })).toBe('Version 1.1.0')
  })
  it('adds the date of the remote update the app runs', () => {
    expect(versionLabel('1.1.0', { isEmbeddedLaunch: false, createdAt: new Date(2026, 10, 2, 15, 30) })).toBe('Version 1.1.0 · mise à jour du 02/11/2026')
  })
  it('stays readable without version or update date (web, dev client)', () => {
    expect(versionLabel(undefined, { isEmbeddedLaunch: false, createdAt: null })).toBe('Version ?')
  })
})
