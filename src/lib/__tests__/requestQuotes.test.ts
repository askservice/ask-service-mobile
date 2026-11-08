import { dayMonth, quoteAmount, quoteBadges, quoteDatesLine, quoteValidUntil, sortQuotesBy } from '../requests'
import type { Quote } from '../types'

const quote = (over: Partial<Quote>): Quote => ({ _id: 'q', vendor_id: 'v', service_request_id: 'r', quote_price: 200, status: 'SENT', createdAt: '2026-11-08T10:00:00', ...over })

const A = quote({ _id: 'a', quote_price: 210, available_start_date: '2026-11-08T09:00:00', createdAt: '2026-11-07T10:00:00' })
const B = quote({ _id: 'b', quote_price: 180, available_start_date: '2026-11-09T09:00:00', createdAt: '2026-11-08T10:00:00' })
const C = quote({ _id: 'c', quote_price: 265, createdAt: '2026-11-06T10:00:00' })

describe('quote validity', () => {
  it('ends validity days after the quote was sent (not at the start date)', () => {
    expect(dayMonth(quoteValidUntil(quote({ createdAt: '2026-11-08T10:00:00', quote_valid_days: 30 }))!)).toBe('8 déc.')
  })
  it('is unknown without validity days', () => {
    expect(quoteValidUntil(quote({ quote_valid_days: undefined }))).toBeNull()
  })
})

describe('sort and badges', () => {
  it('sorts by price, start date (none last) or newest', () => {
    expect(sortQuotesBy([A, B, C], 'price').map((q) => q._id)).toEqual(['b', 'a', 'c'])
    expect(sortQuotesBy([C, B, A], 'start').map((q) => q._id)).toEqual(['a', 'b', 'c'])
    expect(sortQuotesBy([A, B, C], 'recent').map((q) => q._id)).toEqual(['b', 'a', 'c'])
  })
  it('marks the cheapest and the earliest pending quotes', () => {
    expect(quoteBadges([A, B, C])).toEqual({ cheapest: 'b', earliest: 'a' })
  })
  it('gives no earliest badge when it is also the cheapest, and no badge with a single quote', () => {
    expect(quoteBadges([B, C])).toEqual({ cheapest: 'b', earliest: undefined })
    expect(quoteBadges([A])).toEqual({})
    expect(quoteBadges([A, quote({ _id: 'x', status: 'IGNORED' })])).toEqual({})
  })
})

describe('labels', () => {
  const now = new Date('2026-11-08T12:00:00')
  it('says when the work can start and until when the quote is valid', () => {
    expect(quoteDatesLine(quote({ available_start_date: '2026-11-08T09:00:00', quote_valid_days: 14 }), now)).toBe('Dès aujourd’hui · valable jusqu’au 22 nov.')
    expect(quoteDatesLine(quote({ available_start_date: '2026-11-09T09:00:00' }), now)).toBe('Dès le 9 nov.')
    expect(quoteDatesLine(quote({}), now)).toBe('')
  })
  it('shows the amount without cents when there are none', () => {
    expect(quoteAmount(quote({ quote_price: 180 })).replace(/\s/g, ' ')).toBe('180 €')
    expect(quoteAmount(quote({ quote_price: 180.5 })).replace(/\s/g, ' ')).toBe('180,50 €')
    expect(dayMonth('2026-11-09T09:00:00', true)).toBe('9 novembre')
  })
})
