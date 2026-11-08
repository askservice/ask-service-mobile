import { loginRefusal } from '../auth'
import { chatPartnerName, initials, quotePrice, sentLabel, shortTime } from '../requests'
import type { Chat, Quote } from '../types'

const quote = (over: Partial<Quote>): Quote => ({ _id: 'q', vendor_id: 'v', service_request_id: 'r', quote_price: 468, status: 'SENT', createdAt: '2026-10-21T10:00:00Z', ...over })

describe('quotes', () => {
  it('shows the TTC price entered by the provider', () => {
    expect(quotePrice(quote({ quote_price: 468 })).replace(/\s/g, ' ')).toBe('468,00 € TTC')
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
