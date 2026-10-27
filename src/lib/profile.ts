import { parsePhoneNumberFromString } from 'libphonenumber-js'

import type { Profile } from './types'

export type ProfileForm = { firstName: string; lastName: string; phone: string; address: string; postcode: string; city: string }

export type ProfileErrors = Partial<Record<keyof ProfileForm, string>>

/** Body of PUT /user/update-profile. */
export type ProfileUpdate = { first_name: string; last_name: string; phone?: string; address: string; postal_code: string; city: string }

/** Number as the API stores it (+33…), or null when it is not a valid French number. */
export function frenchPhone(raw: string | null | undefined): string | null {
  const parsed = parsePhoneNumberFromString((raw ?? '').trim(), 'FR')
  return parsed?.isValid() && parsed.countryCallingCode === '33' ? parsed.number : null
}

/** Stored number shown as typed in France (06 12 34 56 78). */
export function displayPhone(raw: string | null | undefined): string {
  const parsed = parsePhoneNumberFromString((raw ?? '').trim(), 'FR')
  return parsed?.isValid() ? parsed.formatNational() : (raw ?? '')
}

export function profileForm(p: Profile): ProfileForm {
  return {
    firstName: p.first_name ?? '',
    lastName: p.last_name ?? '',
    phone: displayPhone(p.phone),
    address: p.address ?? '',
    postcode: p.postal_code ?? '',
    city: p.city ?? '',
  }
}

// The API turns every number into +33… (utils/helperFunction.js normalizeFrenchPhone): only
// French numbers can be saved.
export function profileErrors(f: ProfileForm): ProfileErrors {
  const errors: ProfileErrors = {}
  if (!f.firstName.trim()) errors.firstName = 'Indiquez votre prénom.'
  if (!f.lastName.trim()) errors.lastName = 'Indiquez votre nom.'
  if (!frenchPhone(f.phone)) errors.phone = 'Saisissez un numéro français valide.'
  if (f.postcode.trim() && !/^\d{5}$/.test(f.postcode.trim())) errors.postcode = 'Code postal à 5 chiffres.'
  return errors
}

/** What to send, or null when nothing changed. The phone is sent only when it changed (new SMS code). */
export function profileUpdate(p: Profile, f: ProfileForm): { body: ProfileUpdate; phoneChanged: boolean } | null {
  const body: ProfileUpdate = {
    first_name: f.firstName.trim(),
    last_name: f.lastName.trim(),
    // Postal code and city are saved by the API only with the address: always sent together.
    address: f.address.trim(),
    postal_code: f.postcode.trim(),
    city: f.city.trim(),
  }
  const phone = frenchPhone(f.phone)
  const phoneChanged = Boolean(phone) && phone !== frenchPhone(p.phone)
  if (phoneChanged && phone) body.phone = phone
  const same = body.first_name === (p.first_name ?? '').trim()
    && body.last_name === (p.last_name ?? '').trim()
    && body.address === (p.address ?? '').trim()
    && body.postal_code === (p.postal_code ?? '').trim()
    && body.city === (p.city ?? '').trim()
  return same && !phoneChanged ? null : { body, phoneChanged }
}
