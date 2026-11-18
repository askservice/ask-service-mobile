import { avatarImage } from '../requests'

describe('avatar image', () => {
  it('uses the logo or photo sent by the API (https address)', () => {
    expect(avatarImage('https://storage.askservice.fr/user/logo.png')).toBe('https://storage.askservice.fr/user/logo.png')
    expect(avatarImage('  https://storage.askservice.fr/user/logo.png ')).toBe('https://storage.askservice.fr/user/logo.png')
  })
  it('falls back to the initials without a usable address', () => {
    expect(avatarImage(null)).toBeNull()
    expect(avatarImage(undefined)).toBeNull()
    expect(avatarImage('')).toBeNull()
    expect(avatarImage('user/logo.png')).toBeNull()
    expect(avatarImage('http://insecure.test/logo.png')).toBeNull()
  })
})
