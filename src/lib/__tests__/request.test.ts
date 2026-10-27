import { contactErrors, isValidPhone, splitPhone } from '../contact'
import { dynamicAnswers, isSingleChoice, missingAnswers, questionSteps } from '../questions'
import { requestPayload, submitOutcome } from '../request'
import { matchesSearch } from '../search'
import type { Draft, Question } from '../types'

const q = (over: Partial<Question>): Question => ({ _id: over.key ?? 'id', label: 'Question', key: 'k', type: 'dropdown', ...over })

const QUESTIONS: Question[] = [
  q({ _id: 'q3', key: 'surface', step: 3, is_required: true, options: [{ label: '50 – 100 m²', value: '50 – 100 m²' }] }),
  q({ _id: 'q1', key: 'type', step: 1, is_required: true, options: [{ label: 'Bureaux', value: 'Nettoyage de bureaux' }] }),
  q({ _id: 'q2', key: 'date', step: 2, type: 'date', is_required: true }),
  q({ _id: 'q4', key: 'extras', step: 3, order: 1, type: 'checkbox', options: [{ label: 'Vitres', value: 'Vitres' }, { label: 'Sols', value: 'Sols' }] }),
]

const DRAFT: Draft = {
  service: { _id: 'svc', title: 'Nettoyage', icon: 'nettoyage' },
  clientType: 'Company',
  location: { address: "12 Rue Jeanne d'Arc 45000 Orléans", pincode: '45000', city: 'Orléans', state: 'Centre-Val de Loire', country: 'France' },
  answers: { type: 'Nettoyage de bureaux', date: '2026-10-26', extras: ['Vitres', 'Sols'] },
  contact: { firstName: ' Marie ', lastName: 'Dupont', phone: '06 12 34 56 78', email: ' marie@email.fr ', notes: '' },
}

describe('question steps', () => {
  it('groups by step in order, questions by order inside a step', () => {
    const steps = questionSteps(QUESTIONS)
    expect(steps.map((s) => s.map((x) => x.key))).toEqual([['type'], ['date'], ['surface', 'extras']])
  })

  it('treats a dropdown with options as a single choice, a checkbox as multiple', () => {
    expect(isSingleChoice(QUESTIONS[0])).toBe(true)
    expect(isSingleChoice(QUESTIONS[3])).toBe(false)
  })

  it('lists the required questions without answer', () => {
    expect(missingAnswers(QUESTIONS, { type: 'x', date: '' }).map((x) => x.key)).toEqual(['surface', 'date'])
  })

  it('builds dynamic_answers like the website (several values joined by ", ")', () => {
    expect(dynamicAnswers(QUESTIONS, DRAFT.answers)).toEqual([
      { question_id: 'q1', key: 'type', label: 'Question', type: 'dropdown', value: 'Nettoyage de bureaux' },
      { question_id: 'q2', key: 'date', label: 'Question', type: 'date', value: '2026-10-26' },
      { question_id: 'q4', key: 'extras', label: 'Question', type: 'checkbox', value: 'Vitres, Sols' },
    ])
  })
})

describe('contact details', () => {
  it('splits a French phone into national number + country code', () => {
    expect(splitPhone('06 12 34 56 78')).toEqual({ phone: '612345678', country_code: '+33' })
    expect(splitPhone('+33 6 12 34 56 78')).toEqual({ phone: '612345678', country_code: '+33' })
  })

  it('rejects an invalid phone and email', () => {
    expect(isValidPhone('0612')).toBe(false)
    expect(Object.keys(contactErrors({ firstName: '', lastName: 'D', phone: '12', email: 'nope', notes: '' }))).toEqual(['firstName', 'phone', 'email'])
    expect(contactErrors(DRAFT.contact)).toEqual({})
  })
})

describe('request payload', () => {
  it('has the fields of the website request', () => {
    const body = requestPayload(DRAFT, QUESTIONS)
    expect(body).toMatchObject({
      service_category: 'svc',
      note: '',
      contact_details: { first_name: 'Marie', last_name: 'Dupont', client_type: 'Company', phone: '612345678', country_code: '+33', email: 'marie@email.fr' },
      pincode: '45000',
      city: 'Orléans',
      state: 'Centre-Val de Loire',
      country: 'France',
      address_1: "12 Rue Jeanne d'Arc 45000 Orléans",
      source: 'app',
    })
    expect(body.dynamic_answers).toHaveLength(3)
  })

  it('refuses an incomplete draft', () => {
    expect(() => requestPayload({ ...DRAFT, location: null }, QUESTIONS)).toThrow()
  })
})

describe('answer of POST /service-request', () => {
  it('new client: request created, SMS code to check', () => {
    expect(submitOutcome(201, { data: { flow: 'PHONE_VERIFICATION_REQUIRED', request: { reference_no: 'R1' } } })).toEqual({ kind: 'verify-phone', reference: 'R1' })
  })
  it('known client: e-mail code', () => {
    expect(submitOutcome(403, { data: { flow: 'EMAIL_VERIFICATION_REQUIRED' } })).toEqual({ kind: 'verify-email' })
  })
  it('signed in with another number: account phone code', () => {
    expect(submitOutcome(403, { data: { flow: 'PHONE_VERIFICATION_REQUIRED' } })).toEqual({ kind: 'verify-account-phone' })
  })
  it('signed in: request created', () => {
    expect(submitOutcome(201, { data: { flow: 'REQUEST_CREATED', request: { reference_no: 'R2' } } })).toEqual({ kind: 'created', reference: 'R2' })
  })
  it('error: message of the API', () => {
    expect(submitOutcome(400, { message: 'Contact details are required' })).toEqual({ kind: 'error', message: 'Contact details are required' })
    expect(submitOutcome(502, undefined)).toMatchObject({ kind: 'error' })
  })
})

describe('service search', () => {
  it('ignores accents and case', () => {
    expect(matchesSearch('Sécurité privée', 'securite')).toBe(true)
    expect(matchesSearch('Déménagement', 'DEMEN')).toBe(true)
    expect(matchesSearch('Plomberie', 'peinture')).toBe(false)
  })
})
