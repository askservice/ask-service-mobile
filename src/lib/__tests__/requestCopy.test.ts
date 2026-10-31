import { NEXT_STEPS, POPULAR_SERVICE_IDS, popularServices, questionsLeftNote } from '../requestCopy'
import type { ServiceGroup } from '../types'

const group = (id: string, ids: string[]): ServiceGroup => ({
  _id: id,
  title: id,
  child_categories: ids.map((s) => ({ _id: s, title: `service ${s}` })),
})

describe('popularServices', () => {
  it('keeps the owner order, whatever the catalogue order', () => {
    const [nettoyage, securite, jardinage] = POPULAR_SERVICE_IDS
    const groups = [group('a', [jardinage, 'other']), group('b', [securite, nettoyage])]
    expect(popularServices(groups).map((s) => s._id)).toEqual([nettoyage, securite, jardinage])
  })

  it('leaves out the services no longer in the catalogue', () => {
    expect(popularServices([group('a', ['other'])])).toEqual([])
    expect(popularServices(undefined)).toEqual([])
  })
})

describe('questionsLeftNote', () => {
  it('counts the question screens left, this one included', () => {
    expect(questionsLeftNote(0, 3)).toBe("Encore 3 questions, moins d'une minute")
    expect(questionsLeftNote(1, 3)).toBe("Encore 2 questions, moins d'une minute")
  })

  it('says when it is the last one', () => {
    expect(questionsLeftNote(2, 3)).toBe('Dernière question')
    expect(questionsLeftNote(0, 1)).toBe('Dernière question')
  })
})

it('« Et ensuite ? » has three steps', () => {
  expect(NEXT_STEPS).toHaveLength(3)
})
