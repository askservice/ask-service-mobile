import { prosStepLabel, requestBadge, requestProgress, requestToCompare, stepLabels } from '../requests'
import type { MyRequest } from '../types'

const request = (over: Partial<MyRequest>): MyRequest => ({ _id: 'r', reference_no: 'R', status: 'ACTIVE', createdAt: '2026-10-20T10:00:00Z', ...over })

describe('request progress (4-step tracker, same as the website)', () => {
  it('is on step 2 while no quote waits for an answer', () => {
    expect(requestProgress(request({ quotes_status: 'hold', quotes_count: 0 }))).toMatchObject({ step: 2, tone: 'waiting', finished: false })
    expect(requestProgress(request({}))).toMatchObject({ step: 2, tone: 'waiting' })
  })
  it('is on step 3 with quotes to compare', () => {
    expect(requestProgress(request({ quotes_status: 'open', quotes_count: 3 }))).toMatchObject({ step: 3, tone: 'action', label: '3 devis à comparer' })
    expect(requestProgress(request({ quotes_status: 'open', quotes_count: 1 })).label).toBe('1 devis à étudier')
  })
  it('goes back to waiting when every quote was set aside', () => {
    expect(requestProgress(request({ quotes_status: 'ignore', quotes_count: 0 }))).toMatchObject({ step: 2, tone: 'waiting', label: 'En attente d’autres devis' })
  })
  it('is on step 4 once a quote is accepted, and finished when closed or expired', () => {
    expect(requestProgress(request({ quotes_status: 'accepted', quotes_count: 0 }))).toMatchObject({ step: 4, tone: 'done', finished: false })
    expect(requestProgress(request({ status: 'CANCELLED' }))).toMatchObject({ step: 4, tone: 'closed', finished: true })
    expect(requestProgress(request({ status: 'ACTIVE', quotes_status: 'closed' })).finished).toBe(true)
  })
})

describe('step 2 label (number of pros who have the contact)', () => {
  it('uses the count the API sends', () => {
    expect(prosStepLabel(0)).toBe('Les pros consultent votre demande')
    expect(prosStepLabel(1)).toBe('1 pro a vos coordonnées')
    expect(prosStepLabel(3)).toBe('3 pros ont vos coordonnées')
  })
  it('falls back to a generic label without the field', () => {
    expect(prosStepLabel(undefined)).toBe('Les pros vous contactent')
    expect(stepLabels(2)).toEqual(['Demande envoyée', '2 pros ont vos coordonnées', 'Devis reçus', 'Vous choisissez'])
  })
})

describe('card status line and pill', () => {
  it('asks to choose when quotes wait', () => {
    expect(requestBadge(request({ quotes_status: 'open', quotes_count: 2 }))).toEqual({ label: '2 devis', tone: 'primary', line: 'Devis reçus · à vous de choisir' })
  })
  it('shows the pros count while waiting', () => {
    expect(requestBadge(request({ quotes_status: 'hold', quotes_count: 0, pros_contacted_count: 1 }))).toEqual({ label: 'En attente', tone: 'neutral', line: '1 pro a vos coordonnées · devis à venir' })
    expect(requestBadge(request({ quotes_status: 'hold', pros_contacted_count: 0 })).line).toBe('Les pros consultent votre demande')
  })
  it('says when a quote was accepted or the request is over', () => {
    expect(requestBadge(request({ quotes_status: 'accepted' }))).toMatchObject({ label: 'Devis accepté', tone: 'success' })
    expect(requestBadge(request({ status: 'CANCELLED' })).label).toBe('Clôturée')
    expect(requestBadge(request({ status: 'EXPIRED' })).label).toBe('Expirée')
  })
})

describe('banner', () => {
  it('picks the first ongoing request with quotes to compare', () => {
    const list = [
      request({ _id: 'a', quotes_status: 'hold' }),
      request({ _id: 'b', quotes_status: 'open', quotes_count: 2 }),
      request({ _id: 'c', quotes_status: 'open', quotes_count: 1 }),
    ]
    expect(requestToCompare(list)?._id).toBe('b')
    expect(requestToCompare([request({ quotes_status: 'accepted' })])).toBeUndefined()
  })
})
