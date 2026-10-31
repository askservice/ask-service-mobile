import { matchingOptions } from '../questions'

const options = [
  { label: 'Nettoyage de bureaux', value: 'bureaux' },
  { label: 'Fin de chantier', value: 'chantier' },
  { label: 'Vitres', value: 'vitres' },
]

describe('answers of a choice question', () => {
  it('are all listed while nothing is typed', () => {
    expect(matchingOptions(options, '')).toEqual(options)
    expect(matchingOptions(options, '  ')).toEqual(options)
  })
  it('are filtered by their label, accents and case ignored', () => {
    expect(matchingOptions(options, 'CHANT').map((o) => o.value)).toEqual(['chantier'])
    expect(matchingOptions([{ label: 'Sécurité événementielle', value: 'evt' }], 'evenement').map((o) => o.value)).toEqual(['evt'])
  })
  it('give an empty list when nothing matches', () => {
    expect(matchingOptions(options, 'piscine')).toEqual([])
  })
})
