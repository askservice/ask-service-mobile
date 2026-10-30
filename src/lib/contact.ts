import { parsePhoneNumberFromString } from 'libphonenumber-js'

import { displayPhone } from './profile'
import type { Contact, Profile } from './types'

/** Phone in the format the API expects: national number + country code (French by default). */
export function splitPhone(raw: string): { phone: string; country_code: string } {
  const trimmed = raw.trim()
  if (!trimmed) return { phone: '', country_code: '' }
  const parsed = parsePhoneNumberFromString(trimmed, 'FR')
  if (!parsed) return { phone: trimmed.replace(/\D/g, ''), country_code: '' }
  return { phone: parsed.nationalNumber, country_code: `+${parsed.countryCallingCode}` }
}

export function isValidPhone(raw: string): boolean {
  return Boolean(parsePhoneNumberFromString(raw.trim(), 'FR')?.isValid())
}

export const isValidEmail = (raw: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw.trim())

export type ContactErrors = Partial<Record<keyof Contact, string>>

export function contactErrors(c: Contact): ContactErrors {
  const errors: ContactErrors = {}
  if (!c.firstName.trim()) errors.firstName = 'Indiquez votre prénom.'
  if (!c.lastName.trim()) errors.lastName = 'Indiquez votre nom.'
  if (!isValidPhone(c.phone)) errors.phone = 'Numéro de téléphone invalide.'
  if (!isValidEmail(c.email)) errors.email = 'Adresse e-mail invalide.'
  return errors
}

/** Contact details of a signed-in client, filled from the account like the website: only the empty fields, all still editable. */
export function withProfileContact(c: Contact, p: Pick<Profile, 'first_name' | 'last_name' | 'phone' | 'email'>): Contact {
  const fill = (current: string, saved: string | null | undefined) => (current.trim() ? current : (saved ?? '').trim())
  return {
    ...c,
    firstName: fill(c.firstName, p.first_name),
    lastName: fill(c.lastName, p.last_name),
    phone: fill(c.phone, p.phone ? displayPhone(p.phone) : ''),
    email: fill(c.email, p.email),
  }
}
