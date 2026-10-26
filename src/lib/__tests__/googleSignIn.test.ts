import { firebaseTokenFromGoogle, GoogleSignInError } from '@/lib/googleSignIn'

const fetchMock = jest.fn()
globalThis.fetch = fetchMock as unknown as typeof fetch
afterEach(() => fetchMock.mockReset())

const answer = (ok: boolean, body: unknown) => ({ ok, json: async () => body })

describe('firebaseTokenFromGoogle', () => {
  it('échange le jeton Google contre un jeton Firebase du projet du site', async () => {
    fetchMock.mockResolvedValue(answer(true, { idToken: 'firebase-token' }))
    await expect(firebaseTokenFromGoogle('google-token')).resolves.toBe('firebase-token')
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain('accounts:signInWithIdp?key=')
    expect(JSON.parse(init.body).postBody).toBe('id_token=google-token&providerId=google.com')
  })

  it('refus de Firebase : message lisible', async () => {
    fetchMock.mockResolvedValue(answer(false, { error: { message: 'INVALID_IDP_RESPONSE' } }))
    await expect(firebaseTokenFromGoogle('x')).rejects.toBeInstanceOf(GoogleSignInError)
  })

  it('réponse sans jeton : erreur', async () => {
    fetchMock.mockResolvedValue(answer(true, {}))
    await expect(firebaseTokenFromGoogle('x')).rejects.toThrow('Google')
  })
})
