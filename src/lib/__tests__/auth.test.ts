import { afterCodeRequest, loginCodeFailure, NO_ACCOUNT, VENDOR_ACCOUNT } from '@/lib/auth'

describe('loginCodeFailure', () => {
  it('code envoyé : pas d’erreur, on passe à la saisie du code', () => {
    expect(loginCodeFailure({ status: 200, body: { data: { flow: 'CODE_SENT' } } })).toBeNull()
  })

  it('adresse sans compte client : message et proposition d’inscription', () => {
    expect(loginCodeFailure({ status: 200, body: { data: { flow: 'NO_ACCOUNT' } } })).toBe(NO_ACCOUNT)
  })

  it('compte prestataire : renvoyé vers le site', () => {
    expect(loginCodeFailure({ status: 403, body: { data: { flow: 'VENDOR_ACCOUNT' } } })).toBe(VENDOR_ACCOUNT)
  })

  it('autre refus : message du back, ou message par défaut', () => {
    expect(loginCodeFailure({ status: 429, body: { message: 'Trop de demandes' } })).toBe('Trop de demandes')
    expect(loginCodeFailure({ status: 500, body: {} })).toBe('Le code n’a pas pu être envoyé.')
  })
})

describe('afterCodeRequest', () => {
  it('code envoyé : saisie du code', () => {
    expect(afterCodeRequest(null)).toEqual({ step: 'code', noAccount: false, error: null })
  })

  it('adresse sans compte : on reste sur l’e-mail, encadré seul, pas de saisie de code', () => {
    expect(afterCodeRequest(NO_ACCOUNT)).toEqual({ step: 'email', noAccount: true, error: null })
  })

  it('autre refus : on reste sur l’e-mail avec le message d’erreur', () => {
    expect(afterCodeRequest(VENDOR_ACCOUNT)).toEqual({ step: 'email', noAccount: false, error: VENDOR_ACCOUNT })
  })
})
