import { signupErrors, signupFailure, signupPayload, type SignupForm } from '../signup'

const form = (over: Partial<SignupForm> = {}): SignupForm => ({
  firstName: 'Marie',
  lastName: 'Dupont',
  email: 'marie.dupont@email.fr',
  phone: '',
  termsAccepted: true,
  ...over,
})

describe('sign-up form', () => {
  it('accepts a client without phone', () => {
    expect(signupErrors(form())).toEqual({})
  })
  it('asks for the name, a valid e-mail and the terms', () => {
    const errors = signupErrors(form({ firstName: ' ', lastName: '', email: 'marie@', termsAccepted: false }))
    expect(Object.keys(errors).sort()).toEqual(['email', 'firstName', 'lastName', 'termsAccepted'])
  })
  it('checks the phone only when one is typed', () => {
    expect(signupErrors(form({ phone: '06 12 34 56 78' }))).toEqual({})
    expect(signupErrors(form({ phone: '0612' })).phone).toBe('Numéro de téléphone invalide.')
  })
  it('sends trimmed fields, the phone only when typed', () => {
    expect(signupPayload(form({ firstName: ' Marie ', email: ' marie.dupont@email.fr ' }))).toEqual({
      first_name: 'Marie',
      last_name: 'Dupont',
      email: 'marie.dupont@email.fr',
    })
    expect(signupPayload(form({ phone: ' 06 12 34 56 78 ' })).phone).toBe('06 12 34 56 78')
  })
})

describe('refused sign-up', () => {
  it('offers to sign in when the e-mail already has an account', () => {
    expect(signupFailure(409, 'User already exists')).toEqual({ message: 'Un compte existe déjà avec cette adresse e-mail.', accountExists: true })
  })
  it('says when the phone belongs to another account', () => {
    expect(signupFailure(409, 'Phone number already in use').accountExists).toBeUndefined()
    expect(signupFailure(409, 'Numéro de téléphone déjà utilisé').message).toBe('Ce numéro de téléphone est déjà utilisé par un autre compte.')
  })
  it('explains too many attempts, keeps other messages', () => {
    expect(signupFailure(429).message).toBe('Trop de tentatives. Réessayez dans quelques minutes.')
    expect(signupFailure(400, 'Email is required').message).toBe('Email is required')
    expect(signupFailure(500).message).toBe('L’inscription n’a pas abouti. Veuillez réessayer.')
  })
})
