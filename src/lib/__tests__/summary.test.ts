import { answerLabel, summaryRows } from '../summary'
import type { Draft, Question } from '../types'

const question = (over: Partial<Question>): Question => ({ _id: 'q', label: 'Question', key: 'k', type: 'text', ...over })

const draft: Draft = {
  service: { _id: 's', title: 'Nettoyage de bureaux' },
  clientType: 'Company',
  location: { address: '12 rue de Rivoli, 75004 Paris', pincode: '75004', city: 'Paris', state: 'Île-de-France', country: 'France' },
  answers: { surface: '120', when: '2026-11-03', days: ['Lundi', 'Jeudi'], empty: '' },
  contact: { firstName: ' Marie ', lastName: 'Dupont', phone: '0612345678', email: 'marie@exemple.fr', notes: '' },
}

const questions = [
  question({ _id: '1', key: 'surface', label: 'Surface (m²)' }),
  question({ _id: '2', key: 'when', label: 'Pour quand ?', type: 'date' }),
  question({ _id: '3', key: 'days', label: 'Jours', type: 'checkbox' }),
  question({ _id: '4', key: 'empty', label: 'Facultative' }),
]

describe('summary', () => {
  it('lists the rows of the website, unanswered questions left out', () => {
    expect(summaryRows(draft, questions).map((r) => [r.label, r.value])).toEqual([
      ['Service', 'Nettoyage de bureaux'],
      ['Profil', 'Entreprise'],
      ['Adresse', '12 rue de Rivoli, 75004 Paris, Île-de-France, France'],
      ['Surface (m²)', '120'],
      ['Pour quand ?', '3 novembre 2026'],
      ['Jours', 'Lundi, Jeudi'],
      ['Nom complet', 'Marie Dupont'],
      ['Téléphone', '+33 6 12 34 56 78'],
      ['E-mail', 'marie@exemple.fr'],
    ])
  })
  it('falls back on postcode and city, and cuts long details', () => {
    const rows = summaryRows({
      ...draft,
      clientType: 'Individual',
      location: { ...draft.location!, address: '' },
      contact: { ...draft.contact, notes: 'x'.repeat(100) },
    }, [])
    expect(rows.find((r) => r.key === 'profile')?.value).toBe('Particulier')
    expect(rows.find((r) => r.key === 'address')?.value).toBe('75004 Paris, Île-de-France, France')
    expect(rows.find((r) => r.key === 'notes')?.value).toBe(`${'x'.repeat(80)}…`)
  })
  it('writes dates and times in words', () => {
    expect(answerLabel(question({ type: 'datetime' }), '2026-11-03T09:05:00')).toBe('3 novembre 2026 à 09:05')
    expect(answerLabel(question({ type: 'time' }), '09:30')).toBe('09:30')
  })
})
