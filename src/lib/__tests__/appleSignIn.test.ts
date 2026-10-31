import { AppleSignInError, firebaseTokenFromApple, nameFromApple } from '@/lib/appleSignIn'

const fetchMock = jest.fn()
globalThis.fetch = fetchMock as unknown as typeof fetch
afterEach(() => fetchMock.mockReset())

const answer = (ok: boolean, body: unknown) => ({ ok, json: async () => body })

describe('firebaseTokenFromApple', () => {
  it('échange le jeton Apple et le nonce d’origine contre un jeton Firebase', async () => {
    fetchMock.mockResolvedValue(answer(true, { idToken: 'firebase-token' }))
    await expect(firebaseTokenFromApple('apple-token', 'nonce-1')).resolves.toBe('firebase-token')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('accounts:signInWithIdp?key=')
    expect(JSON.parse(init.body).postBody).toBe('id_token=apple-token&nonce=nonce-1&providerId=apple.com')
  })

  it('refus de Firebase : message lisible', async () => {
    fetchMock.mockResolvedValue(answer(false, { error: { message: 'INVALID_IDP_RESPONSE' } }))
    await expect(firebaseTokenFromApple('x', 'n')).rejects.toBeInstanceOf(AppleSignInError)
  })

  it('réponse sans jeton : erreur', async () => {
    fetchMock.mockResolvedValue(answer(true, {}))
    await expect(firebaseTokenFromApple('x', 'n')).rejects.toThrow('Apple')
  })
})

describe('nameFromApple', () => {
  it('premier passage : prénom et nom envoyés au back', () => {
    expect(nameFromApple({ givenName: 'Marie', familyName: 'Durand' })).toEqual({ first_name: 'Marie', last_name: 'Durand' })
  })

  it('passages suivants : Apple ne donne plus le nom, rien n’est envoyé', () => {
    expect(nameFromApple(null)).toEqual({})
    expect(nameFromApple({ givenName: null, familyName: null })).toEqual({})
  })
})
