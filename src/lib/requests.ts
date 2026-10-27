import type { Chat, ChatUser, MyRequest, Quote } from './types'

/** Service shown for a request (the precise service when there is one). */
export const requestService = (r: MyRequest) => r.child_category ?? r.service_category ?? null

export const requestTitle = (r: MyRequest) => requestService(r)?.title ?? 'Demande'

export const isOngoing = (r: MyRequest) => r.status === 'ACTIVE'

export type Badge = { label: string; tone: 'primary' | 'neutral' | 'success' | 'muted' }

/** Badge of a request in the list, from the quotes summary the API computes. */
export function requestBadge(r: MyRequest): Badge {
  if (!isOngoing(r)) return { label: r.status === 'EXPIRED' ? 'Expirée' : 'Clôturée', tone: 'muted' }
  if (r.quotes_status === 'accepted') return { label: 'Prestataire choisi', tone: 'success' }
  const count = r.quotes_count ?? 0
  if (count > 0) return { label: `${count} devis reçu${count > 1 ? 's' : ''}`, tone: 'primary' }
  return { label: 'En attente de devis', tone: 'neutral' }
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
