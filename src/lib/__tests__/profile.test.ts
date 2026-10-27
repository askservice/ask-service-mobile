import { displayPhone, frenchPhone, profileErrors, profileForm, profileUpdate } from '../profile'
import type { Profile } from '../types'

const profile: Profile = {
  _id: 'u',
  first_name: 'Marie',
  last_name: 'Dupont',
  email: 'marie@email.fr',
  phone: '+33612345678',
  is_phone_verified: true,
  address: '12 rue de la Paix',
  postal_code: '75002',
  city: 'Paris',
}

describe('profile phone', () => {
  it('keeps French numbers in the API format', () => {
    expect(frenchPhone('06 12 34 56 78')).toBe('+33612345678')
    expect(frenchPhone('+33 6 12 34 56 78')).toBe('+33612345678')
    expect(frenchPhone('+32 470 12 34 56')).toBeNull()
    expect(frenchPhone('0612')).toBeNull()
  })
  it('shows the stored number the French way', () => {
    expect(displayPhone('+33612345678')).toBe('06 12 34 56 78')
    expect(displayPhone(null)).toBe('')
  })
})

describe('profile form', () => {
  it('starts from the profile', () => {
    expect(profileForm(profile)).toEqual({ firstName: 'Marie', lastName: 'Dupont', phone: '06 12 34 56 78', address: '12 rue de la Paix', postcode: '75002', city: 'Paris' })
  })
  it('needs a name and a French phone, the address is optional', () => {
    expect(profileErrors({ firstName: ' ', lastName: '', phone: '+32 470 12 34 56', address: '', postcode: '', city: '' })).toEqual({
      firstName: 'Indiquez votre prénom.',
      lastName: 'Indiquez votre nom.',
      phone: 'Saisissez un numéro français valide.',
    })
    expect(profileErrors({ ...profileForm(profile), address: '', postcode: '', city: '' })).toEqual({})
    expect(profileErrors({ ...profileForm(profile), postcode: '7500' }).postcode).toBe('Code postal à 5 chiffres.')
  })
})

describe('profile update', () => {
  it('sends nothing when nothing changed, even if the phone is typed differently', () => {
    expect(profileUpdate(profile, profileForm(profile))).toBeNull()
    expect(profileUpdate(profile, { ...profileForm(profile), phone: '+33612345678', firstName: ' Marie ' })).toBeNull()
  })
  it('sends the address with its postal code and city, without the unchanged phone', () => {
    expect(profileUpdate(profile, { ...profileForm(profile), city: 'Orléans', postcode: '45000' })).toEqual({
      body: { first_name: 'Marie', last_name: 'Dupont', address: '12 rue de la Paix', postal_code: '45000', city: 'Orléans' },
      phoneChanged: false,
    })
  })
  it('sends a new phone, which needs a code', () => {
    const update = profileUpdate(profile, { ...profileForm(profile), phone: '07 98 76 54 32' })
    expect(update?.phoneChanged).toBe(true)
    expect(update?.body.phone).toBe('+33798765432')
  })
})
