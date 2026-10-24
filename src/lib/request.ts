import { splitPhone } from './contact'
import { dynamicAnswers } from './questions'
import type { Draft, Question } from './types'

/** Body of POST /api/user/service-request, built like the website's request form. */
export function requestPayload(draft: Draft, questions: Question[]) {
  if (!draft.service || !draft.clientType || !draft.location) throw new Error('Demande incomplète')
  const phone = splitPhone(draft.contact.phone)
  return {
    service_category: draft.service._id,
    note: draft.contact.notes.trim(),
    dynamic_answers: dynamicAnswers(questions, draft.answers),
    contact_details: {
      first_name: draft.contact.firstName.trim(),
      last_name: draft.contact.lastName.trim(),
      client_type: draft.clientType,
      phone: phone.phone,
      country_code: phone.country_code,
      email: draft.contact.email.trim(),
    },
    pincode: draft.location.pincode,
    city: draft.location.city,
    state: draft.location.state,
    country: draft.location.country,
    address_1: draft.location.address,
    // Tells the backend the request comes from the mobile app (website = "web").
    source: 'app',
  }
}

export type SubmitOutcome =
  | { kind: 'created'; reference: string | null }
  /** New client: request created, the phone number must be checked with the SMS code. */
  | { kind: 'verify-phone'; reference: string | null }
  /** Known e-mail or phone: e-mail code, then the request is sent again signed in. */
  | { kind: 'verify-email' }
  /** Signed-in client whose account number differs from the one typed. */
  | { kind: 'verify-account-phone' }
  | { kind: 'login-required' }
  | { kind: 'error'; message: string }

/** What the app does after POST /service-request (same cases as the website). */
export function submitOutcome(status: number, body: unknown): SubmitOutcome {
  const b = (body ?? {}) as { message?: string; data?: { flow?: string; type?: string; request?: { reference_no?: string } } }
  const flow = b.data?.flow ?? b.data?.type
  const reference = b.data?.request?.reference_no ?? null
  if (flow === 'EMAIL_VERIFICATION_REQUIRED') return { kind: 'verify-email' }
  if (flow === 'PHONE_VERIFICATION_REQUIRED') return reference ? { kind: 'verify-phone', reference } : { kind: 'verify-account-phone' }
  if (flow === 'LOGIN_REQUIRED') return { kind: 'login-required' }
  if (status >= 200 && status < 300) return { kind: 'created', reference }
  return { kind: 'error', message: b.message || 'Une erreur est survenue. Veuillez réessayer.' }
}
