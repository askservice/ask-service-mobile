import { loginRefusal } from '../auth'
import { chatPartnerName, initials, quotePrice, requestBadge, sentLabel, shortTime, sortQuotes } from '../requests'
import type { Chat, MyRequest, Quote } from '../types'

const request = (over: Partial<MyRequest>): MyRequest => ({ _id: 'r', reference_no: 'R', status: 'ACTIVE', createdAt: '2026-10-20T10:00:00Z', ...over })
const quote = (over: Partial<Quote>): Quote => ({ _id: 'q', vendor_id: 'v', service_request_id: 'r', quote_price: 468, status: 'SENT', createdAt: '2026-10-21T10:00:00Z', ...over })

describe('request badge', () => {
  it('counts the quotes received', () => {
    expect(requestBadge(request({ quotes_status: 'open', quotes_count: 2 }))).toEqual({ label: '2 devis reçus', tone: 'primary' })
    expect(requestBadge(request({ quotes_status: 'open', quotes_count: 1 })).label).toBe('1 devis reçu')
  })
  it('says when nobody answered yet, a provider was chosen, or the request is over', () => {
    expect(requestBadge(request({ quotes_status: 'hold', quotes_count: 0 })).label).toBe('En attente de devis')
    expect(requestBadge(request({ quotes_status: 'accepted', quotes_count: 1 })).label).toBe('Prestataire choisi')
    expect(requestBadge(request({ status: 'CANCELLED' })).label).toBe('Clôturée')
    expect(requestBadge(request({ status: 'EXPIRED' })).label).toBe('Expirée')
  })
})

describe('quotes', () => {
  it('shows the TTC price entered by the provider', () => {
    expect(quotePrice(quote({ quote_price: 468 })).replace(/\s/g, ' ')).toBe('468,00 € TTC')
  })
  it('puts the accepted quote first, refused ones last, newest first otherwise', () => {
    const list = sortQuotes([
      quote({ _id: 'old', createdAt: '2026-10-20T10:00:00Z' }),
      quote({ _id: 'refused', status: 'IGNORED', createdAt: '2026-10-23T10:00:00Z' }),
      quote({ _id: 'new', createdAt: '2026-10-22T10:00:00Z' }),
      quote({ _id: 'accepted', status: 'ACCEPTED', createdAt: '2026-10-19T10:00:00Z' }),
    ])
    expect(list.map((q) => q._id)).toEqual(['accepted', 'new', 'old', 'refused'])
  })
})

describe('conversations', () => {
  it('names the provider (business name first)', () => {
    const chat = (users: Chat['users']): Chat => ({ _id: 'c', users, updatedAt: '' })
    expect(chatPartnerName(chat([{ _id: 'me', itsMe: true, first_name: 'Marie' }, { _id: 'v', first_name: 'Jean', last_name: 'Martin', business_name: 'Loire Propreté' }]))).toBe('Loire Propreté')
    expect(chatPartnerName(chat([{ _id: 'me', itsMe: true }, { _id: 'v', first_name: 'Jean', last_name: 'Martin' }]))).toBe('Jean Martin')
    expect(initials('Loire Propreté')).toBe('LP')
  })

  it('shows the time today, "hier", then the date', () => {
    const now = new Date(2026, 9, 24, 18, 0)
    expect(shortTime(new Date(2026, 9, 24, 14, 32).toISOString(), now)).toBe('14:32')
    expect(shortTime(new Date(2026, 9, 23, 9, 0).toISOString(), now)).toBe('hier')
    expect(shortTime(new Date(2026, 9, 12, 9, 0).toISOString(), now)).toBe('12 oct.')
    expect(sentLabel(new Date(2026, 9, 24, 9, 0).toISOString(), now)).toBe('envoyée aujourd’hui')
    expect(sentLabel(new Date(2026, 9, 12, 9, 0).toISOString(), now)).toBe('envoyée le 12 oct.')
  })
})

describe('sign-in', () => {
  it('accepts client accounts only', () => {
    expect(loginRefusal({ _id: 'x', name: 'User' })).toBeNull()
    expect(loginRefusal({ _id: 'y', name: 'Vendor' })).toMatch(/prestataire/)
    expect(loginRefusal(undefined)).not.toBeNull()
  })
})
