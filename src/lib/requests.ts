import type { Chat, ChatUser, MyRequest, Quote } from './types'

/** Service shown for a request (the precise service when there is one). */
export const requestService = (r: MyRequest) => r.child_category ?? r.service_category ?? null

export const requestTitle = (r: MyRequest) => requestService(r)?.title ?? 'Demande'

export const isOngoing = (r: MyRequest) => r.status === 'ACTIVE'

export type RequestStep = 1 | 2 | 3 | 4

export type RequestProgress = {
  /** Current step of the 4-step tracker (Envoyée, Pros, Devis reçus, Vous choisissez). */
  step: RequestStep
  label: string
  tone: 'action' | 'waiting' | 'done' | 'closed'
  finished: boolean
}

// Same logic as the website (front src/utils/clientRequests.ts). Fields of /user/get-created-services:
// quotes_status hold | open | accepted | ignore | closed, quotes_count = quotes waiting for an answer.
export const STEP_LABELS = ['Demande envoyée', 'Les pros vous contactent', 'Devis reçus', 'Vous choisissez'] as const

/** Label of step 2 from the number of pros who have the client's contact (pros_contacted_count). */
export function prosStepLabel(count?: number | null): string {
  if (count == null) return STEP_LABELS[1]
  if (count <= 0) return 'Les pros consultent votre demande'
  return count === 1 ? '1 pro a vos coordonnées' : `${count} pros ont vos coordonnées`
}

/** The 4 tracker labels, step 2 with the number of pros when the API sends it. */
export const stepLabels = (prosCount?: number | null): string[] => [STEP_LABELS[0], prosStepLabel(prosCount), STEP_LABELS[2], STEP_LABELS[3]]

export function requestProgress(r: MyRequest): RequestProgress {
  const qs = (r.quotes_status ?? '').toLowerCase()
  if (!isOngoing(r) || qs === 'closed') return { step: 4, label: 'Terminée', tone: 'closed', finished: true }
  if (qs === 'accepted') return { step: 4, label: 'Devis accepté', tone: 'done', finished: false }
  const waiting = r.quotes_count ?? 0
  if (qs === 'open' && waiting > 0) {
    return { step: 3, label: waiting > 1 ? `${waiting} devis à comparer` : '1 devis à étudier', tone: 'action', finished: false }
  }
  if (qs === 'ignore') return { step: 2, label: 'En attente d’autres devis', tone: 'waiting', finished: false }
  return { step: 2, label: 'En attente de devis', tone: 'waiting', finished: false }
}

/** First request with quotes waiting for the client's answer, for the blue banner. */
export const requestToCompare = (requests: MyRequest[]) => requests.find((r) => requestProgress(r).tone === 'action')

export type Badge = { label: string; tone: 'primary' | 'neutral' | 'success' | 'muted'; line?: string }

/** Pill and status line of a request card. */
export function requestBadge(r: MyRequest): Badge {
  const progress = requestProgress(r)
  if (progress.tone === 'closed') return { label: r.status === 'EXPIRED' ? 'Expirée' : 'Clôturée', tone: 'muted', line: 'Demande terminée' }
  if (progress.tone === 'done') return { label: 'Devis accepté', tone: 'success', line: 'Vous avez choisi votre professionnel' }
  if (progress.tone === 'action') return { label: `${r.quotes_count} devis`, tone: 'primary', line: 'Devis reçus · à vous de choisir' }
  const pros = r.pros_contacted_count
  return { label: 'En attente', tone: 'neutral', line: pros && pros > 0 ? `${prosStepLabel(pros)} · devis à venir` : prosStepLabel(pros) }
}

const PRICE = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 })

/** Quote price entered TTC by the provider. */
export const quotePrice = (q: Quote) => `${PRICE.format(Number(q.quote_price ?? q.price) || 0)} TTC`

export function providerName(q: Quote): string {
  if (q.provider_name) return q.provider_name
  const v = q.vendor
  return [v?.first_name, v?.last_name].filter(Boolean).join(' ') || 'Prestataire'
}

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?'

/** Quotes of the detail screen: the accepted one first, then the newest. */
export function sortQuotes(quotes: Quote[]): Quote[] {
  const rank = (q: Quote) => (q.status === 'ACCEPTED' ? 0 : q.status === 'IGNORED' ? 2 : 1)
  return [...quotes].sort((a, b) => rank(a) - rank(b) || Date.parse(b.createdAt) - Date.parse(a.createdAt))
}

/** The other person of a conversation (the provider, for a client). */
export function chatPartner(chat: Chat): ChatUser | null {
  return chat.users?.find((u) => !u.itsMe) ?? chat.users?.[0] ?? null
}

export function chatPartnerName(chat: Chat): string {
  const p = chatPartner(chat)
  if (!p) return 'Prestataire'
  return p.business_name || [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Prestataire'
}

/** "14:32" today, "hier", or "12 oct." */
export function shortTime(iso: string | undefined, now = new Date()): string {
  if (!iso) return ''
  const d = new Date(iso)
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const diff = Math.round((day(now) - day(d)) / 86_400_000)
  if (diff === 0) return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  if (diff === 1) return 'hier'
  const months = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
  return `${d.getDate()} ${months[d.getMonth()]}`
}

/** Reasons offered when closing a request (same keys as the website). */
export const CLOSE_REASONS = [
  { key: 'No longer need the service', label: 'Je n’ai plus besoin de ce service' },
  { key: 'Found a provider elsewhere', label: 'J’ai trouvé un prestataire ailleurs' },
  { key: 'Quotes are too expensive', label: 'Les devis sont trop chers' },
  { key: 'Changed my mind', label: 'J’ai changé d’avis' },
  { key: 'Other reason', label: 'Autre raison' },
]

/** "envoyée aujourd’hui", "envoyée hier", "envoyée le 12 oct." */
export function sentLabel(iso: string, now = new Date()): string {
  const t = shortTime(iso, now)
  if (t === 'hier') return 'envoyée hier'
  return t.includes(':') ? 'envoyée aujourd’hui' : `envoyée le ${t}`
}
