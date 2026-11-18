import {
  canSubmitReview,
  chatRequestReference,
  placeLabel,
  preselectedRequest,
  requestOptionLabel,
  reviewDate,
  reviewErrorMessage,
  yearsLabel,
} from '../vendorProfile'

const requests = [
  { _id: 'a', reference_no: 'REF-1', service_title: 'Nettoyage' },
  { _id: 'b', reference_no: 'REF-2', service_title: null },
]

describe('provider profile', () => {
  it('writes the years of activity', () => {
    expect(yearsLabel('8')).toBe('8 ans')
    expect(yearsLabel('1')).toBe('1 an')
    expect(yearsLabel(' Depuis 2015 ')).toBe('Depuis 2015')
    expect(yearsLabel('')).toBeNull()
    expect(yearsLabel(null)).toBeNull()
  })
  it('shows the city and postal code, nothing when both are missing', () => {
    expect(placeLabel({ city: 'Paris', postal_code: '75011' })).toBe('Paris 75011')
    expect(placeLabel({ city: null, postal_code: null })).toBeNull()
  })
  it('writes the date of a review in French', () => {
    expect(reviewDate('2026-11-10T12:00:00Z')).toBe('10 novembre 2026')
    expect(reviewDate('not a date')).toBe('')
  })
})

describe('leave a review', () => {
  it('preselects the request of the conversation, else the most recent one', () => {
    expect(preselectedRequest(requests, 'REF-2')?._id).toBe('b')
    expect(preselectedRequest(requests, 'REF-9')?._id).toBe('a')
    expect(preselectedRequest([], 'REF-1')).toBeNull()
  })
  it('labels a request with its service and reference', () => {
    expect(requestOptionLabel(requests[0])).toBe('Nettoyage · REF-1')
    expect(requestOptionLabel(requests[1])).toBe('REF-2')
  })
  it('needs a request, a rating and 20 characters', () => {
    const text = 'Travail soigné et rapide.'
    expect(canSubmitReview(4, text, 'a')).toBe(true)
    expect(canSubmitReview(0, text, 'a')).toBe(false)
    expect(canSubmitReview(4, text, null)).toBe(false)
    expect(canSubmitReview(4, '   court    ', 'a')).toBe(false)
  })
  it('explains the refusals of the API in French', () => {
    expect(reviewErrorMessage('You have already submitted a review for this service')).toMatch(/déjà donné/)
    expect(reviewErrorMessage('You can only review vendors who have purchased your lead')).toMatch(/traité votre demande/)
    expect(reviewErrorMessage(undefined)).toMatch(/Réessayez/)
  })
  it('finds the reference of the conversation request', () => {
    expect(chatRequestReference({ service_request_id: { reference_no: 'REF-1' } })).toBe('REF-1')
    expect(chatRequestReference({ quote_id: { service_request_id: { reference_no: 'REF-2' } } })).toBe('REF-2')
    expect(chatRequestReference({ quote_id: { service_request_id: 'id-only' } })).toBeNull()
    expect(chatRequestReference(undefined)).toBeNull()
  })
})
