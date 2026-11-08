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

// Quotes of a request (lot A2, mockups A4-A6; same rules as the website lot C3)

export const isPendingQuote = (q: Quote) => (q.status ?? '').toUpperCase() === 'SENT'

const priceOf = (q: Quote) => Number(q.quote_price ?? q.price ?? 0) || 0
const time = (iso?: string | null) => (iso ? new Date(iso).getTime() || 0 : 0)

/** Last day the quote is valid: sent date + validity in days (not the start date). */
export function quoteValidUntil(q: Quote): Date | null {
  if (!q.createdAt || !q.quote_valid_days) return null
  const d = new Date(q.createdAt)
  if (Number.isNaN(d.getTime())) return null
  d.setDate(d.getDate() + q.quote_valid_days)
  return d
}

export type QuoteSort = 'price' | 'start' | 'recent'

export const QUOTE_SORTS: { key: QuoteSort; label: string }[] = [
  { key: 'price', label: 'Prix' },
  { key: 'start', label: 'Date de début' },
  { key: 'recent', label: 'Plus récents' },
]

/** Pending quotes in the order the client picked (no start date = last when sorting by start). */
export function sortQuotesBy(quotes: Quote[], sort: QuoteSort): Quote[] {
  const list = [...quotes]
  if (sort === 'price') return list.sort((a, b) => priceOf(a) - priceOf(b))
  if (sort === 'start') return list.sort((a, b) => (time(a.available_start_date) || Infinity) - (time(b.available_start_date) || Infinity))
  return list.sort((a, b) => time(b.createdAt) - time(a.createdAt))
}

/** Ids of the cheapest and earliest-start pending quotes, for their badges (only with 2+ quotes). */
export function quoteBadges(quotes: Quote[]): { cheapest?: string; earliest?: string } {
  const pending = quotes.filter(isPendingQuote)
  if (pending.length < 2) return {}
  const cheapest = sortQuotesBy(pending, 'price')[0]
  const withStart = pending.filter((q) => time(q.available_start_date))
  const earliest = withStart.length ? sortQuotesBy(withStart, 'start')[0] : undefined
  return { cheapest: cheapest._id, earliest: earliest && earliest._id !== cheapest._id ? earliest._id : undefined }
}

const SHORT_MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']
const LONG_MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']

/** "9 nov." or, long, "9 novembre". */
export function dayMonth(date: Date | string, long = false): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return `${d.getDate()} ${(long ? LONG_MONTHS : SHORT_MONTHS)[d.getMonth()]}`
}

const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/** "Dès aujourd'hui · valable jusqu'au 22 nov.", parts left out when the provider did not set them. */
export function quoteDatesLine(q: Quote, now = new Date()): string {
  const parts: string[] = []
  if (q.available_start_date) {
    const start = new Date(q.available_start_date)
    parts.push(sameDay(start, now) ? 'Dès aujourd’hui' : `Dès le ${dayMonth(start)}`)
  }
  const until = quoteValidUntil(q)
  if (until) parts.push(`valable jusqu’au ${dayMonth(until)}`)
  return parts.join(' · ')
}

const AMOUNT = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const AMOUNT_CENTS = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })

/** Big price of a compare card: "180 €", "180,50 €" (TTC written next to it). */
export function quoteAmount(q: Quote): string {
  const p = priceOf(q)
  return (Number.isInteger(p) ? AMOUNT : AMOUNT_CENTS).format(p)
}
