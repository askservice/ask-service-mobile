import { MONTHS } from './dates'

// Profile of a provider as the client sees it (opened from a conversation): GET
// /user/vendor-details/:id gives a public profile only (no contact details, main activity only),
// for the providers that unlocked one of the client's requests.

export type VendorPublicProfile = {
  _id: string
  business_name: string | null
  profile_pic: string | null
  city: string | null
  postal_code: string | null
  main_activity: { _id: string; title: string } | null
  about_company: string | null
  years_of_activity: string | null
  company_size: string | null
  is_verified: boolean
}

export type VendorPublicReview = {
  _id: string
  /** « Marie D. » */
  author_name: string
  rating: number
  review: string
  createdAt: string
  likes_count: number
  liked_by_me: boolean
}

export type ReviewableRequest = { _id: string; reference_no: string; service_title: string | null }

export type VendorDetails = {
  vendor: VendorPublicProfile
  review: {
    averageRating: number
    totalReviews: number
    ratingDistribution: Record<'1' | '2' | '3' | '4' | '5', number>
    reviews: VendorPublicReview[]
  }
  /** The client's requests handled by this provider and not reviewed yet. */
  reviewable_requests: ReviewableRequest[]
}

export const MIN_REVIEW_LENGTH = 20

/** « 8 ans », « 1 an », or the text as typed by the provider (« Depuis 2015 »). */
export function yearsLabel(value: string | null | undefined): string | null {
  const v = value?.trim()
  if (!v) return null
  return /^\d+$/.test(v) ? `${v} an${v === '1' ? '' : 's'}` : v
}

export const placeLabel = (v: Pick<VendorPublicProfile, 'city' | 'postal_code'>) =>
  [v.city, v.postal_code].filter(Boolean).join(' ') || null

export const requestOptionLabel = (r: ReviewableRequest) => [r.service_title, r.reference_no].filter(Boolean).join(' · ')

/** The request of the conversation when it can be reviewed, else the most recent one. */
export function preselectedRequest(requests: ReviewableRequest[], reference?: string | null): ReviewableRequest | null {
  return requests.find((r) => r.reference_no === reference) ?? requests[0] ?? null
}

export const canSubmitReview = (rating: number, text: string, requestId: string | null) =>
  Boolean(requestId) && rating >= 1 && rating <= 5 && text.trim().length >= MIN_REVIEW_LENGTH

/** Messages of the API (English) shown in French. */
export function reviewErrorMessage(message: string | undefined): string {
  if (message?.includes('already submitted')) return 'Vous avez déjà donné votre avis pour cette demande.'
  if (message?.includes('purchased your lead')) return 'Vous ne pouvez noter que les professionnels qui ont traité votre demande.'
  return 'Votre avis n’a pas pu être envoyé. Réessayez.'
}

/** Reference of the request of a conversation (« REF-… »), to preselect it in « Laisser un avis ». */
export function chatRequestReference(chat: { service_request_id?: unknown; quote_id?: unknown } | undefined): string | null {
  const ref = (v: unknown) => (v && typeof v === 'object' && 'reference_no' in v ? String((v as { reference_no?: unknown }).reference_no ?? '') : '')
  const quote = chat?.quote_id && typeof chat.quote_id === 'object' ? (chat.quote_id as { service_request_id?: unknown }) : null
  return ref(chat?.service_request_id) || ref(quote?.service_request_id) || null
}

/** « 10 novembre 2026 » (date of a review, local time). */
export function reviewDate(iso: string): string {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? '' : `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}
