import { isValidEmail, isValidPhone } from './contact'

export type SignupForm = {
  firstName: string
  lastName: string
  email: string
  phone: string
  termsAccepted: boolean
}

export type SignupErrors = Partial<Record<keyof SignupForm, string>>

/** Same fields as the website's client sign-up: the phone is optional. */
export function signupErrors(f: SignupForm): SignupErrors {
  const errors: SignupErrors = {}
  if (!f.firstName.trim()) errors.firstName = 'Indiquez votre prénom.'
  if (!f.lastName.trim()) errors.lastName = 'Indiquez votre nom.'
  if (!isValidEmail(f.email)) errors.email = 'Adresse e-mail invalide.'
  if (f.phone.trim() && !isValidPhone(f.phone)) errors.phone = 'Numéro de téléphone invalide.'
  if (!f.termsAccepted) errors.termsAccepted = 'Acceptez les conditions d’utilisation pour continuer.'
  return errors
}

/** Body of /user/signup. The phone is sent as typed, like the website: the backend normalizes French numbers. */
export function signupPayload(f: SignupForm) {
  const phone = f.phone.trim()
  return {
    first_name: f.firstName.trim(),
    last_name: f.lastName.trim(),
    email: f.email.trim(),
    ...(phone ? { phone } : {}),
  }
}

export type SignupFailure = { message: string; accountExists?: boolean }

/** Refused sign-up: 409 = e-mail (or phone) already used by another account. */
export function signupFailure(status: number, message?: string): SignupFailure {
  if (status === 409 && /phone|téléphone|numéro/i.test(message ?? '')) {
    return { message: 'Ce numéro de téléphone est déjà utilisé par un autre compte.' }
  }
  if (status === 409) return { message: 'Un compte existe déjà avec cette adresse e-mail.', accountExists: true }
  if (status === 429) return { message: 'Trop de tentatives. Réessayez dans quelques minutes.' }
  return { message: message || 'L’inscription n’a pas abouti. Veuillez réessayer.' }
}
