import { parsePhoneNumberFromString } from 'libphonenumber-js'

import { MONTHS } from './dates'
import { isAnswered } from './questions'
import type { Answer, Draft, Question } from './types'

// Lines of the "Récapitulatif" step, same rows and wording as the website's request form.

export type SummaryRow = { key: string; icon: 'build' | 'person-outline' | 'place' | 'info-outline' | 'phone' | 'mail-outline' | 'notes'; label: string; value: string }

const NOTES_MAX = 80

/** "26 octobre 2026", like the website's summary. */
function dayLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return y && m && d ? `${d} ${MONTHS[m - 1]} ${y}` : iso
}

/** Answer as the website's summary shows it (dates in words, several values joined). */
export function answerLabel(q: Question, value: Answer): string {
  if (Array.isArray(value)) return value.join(', ')
  if (q.type === 'date') return dayLabel(value)
  if (q.type === 'date & time' || q.type === 'datetime') {
    const d = new Date(value)
    if (Number.isNaN(d.getTime())) return value
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} à ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  return value
}

export const phoneLabel = (raw: string) =>
  parsePhoneNumberFromString(raw.trim(), 'FR')?.formatInternational() ?? raw.trim()

export function summaryRows(draft: Draft, questions: Question[]): SummaryRow[] {
  const rows: SummaryRow[] = []
  const add = (row: SummaryRow) => {
    if (row.value) rows.push(row)
  }
  const { location, contact } = draft
  add({ key: 'service', icon: 'build', label: 'Service', value: draft.service?.title ?? '' })
  add({ key: 'profile', icon: 'person-outline', label: 'Profil', value: draft.clientType === 'Company' ? 'Entreprise' : draft.clientType === 'Individual' ? 'Particulier' : '' })
  if (location) {
    add({
      key: 'address',
      icon: 'place',
      label: 'Adresse',
      value: [location.address || [location.pincode, location.city].filter(Boolean).join(' '), location.state, location.country].filter(Boolean).join(', '),
    })
  }
  for (const q of questions) {
    const value = draft.answers[q.key]
    if (isAnswered(value)) add({ key: `q-${q._id}`, icon: 'info-outline', label: q.label, value: answerLabel(q, value) })
  }
  add({ key: 'name', icon: 'person-outline', label: 'Nom complet', value: `${contact.firstName.trim()} ${contact.lastName.trim()}`.trim() })
  add({ key: 'phone', icon: 'phone', label: 'Téléphone', value: contact.phone.trim() ? phoneLabel(contact.phone) : '' })
  add({ key: 'email', icon: 'mail-outline', label: 'E-mail', value: contact.email.trim() })
  const notes = contact.notes.trim()
  add({ key: 'notes', icon: 'notes', label: 'Détails', value: notes.length > NOTES_MAX ? `${notes.slice(0, NOTES_MAX)}…` : notes })
  return rows
}
