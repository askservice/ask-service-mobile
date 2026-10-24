import { parsePhoneNumberFromString } from 'libphonenumber-js'

import type { Contact } from './types'

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
