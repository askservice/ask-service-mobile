import { profileAddressQuery, searchAddress, toSuggestion } from '../address'
import { isoDay, longDate, monthGrid } from '../dates'

describe('address saved in the account', () => {
  it('is searched with the street, postal code and town', () => {
    expect(profileAddressQuery({ address: ' 12 rue de la Paix ', postal_code: '75002', city: 'Paris' })).toBe('12 rue de la Paix 75002 Paris')
    expect(profileAddressQuery({ address: '', postal_code: '45000', city: 'Orléans' })).toBe('45000 Orléans')
  })
  it('is ignored when the account has none', () => {
    expect(profileAddressQuery({ address: null, postal_code: null, city: null })).toBeNull()
    expect(profileAddressQuery({ address: '', postal_code: '', city: 'Ab' })).toBeNull()
  })
})

describe('address suggestions (Base Adresse Nationale)', () => {
  it('maps a street address to the request location', () => {
    const s = toSuggestion({
      properties: { id: 'a1', label: "12 Rue Jeanne d'Arc 45000 Orléans", name: "12 Rue Jeanne d'Arc", postcode: '45000', city: 'Orléans', context: '45, Loiret, Centre-Val de Loire', type: 'housenumber' },
    })
    expect(s).toEqual({
      id: 'a1',
      title: "12 Rue Jeanne d'Arc",
      subtitle: '45000 Orléans',
      location: { address: "12 Rue Jeanne d'Arc 45000 Orléans", pincode: '45000', city: 'Orléans', state: 'Centre-Val de Loire', country: 'France' },
    })
  })

  it('shows a town by its name', () => {
    expect(toSuggestion({ properties: { label: 'Olivet', name: 'Olivet', postcode: '45160', city: 'Olivet', context: '45, Loiret, Centre-Val de Loire', type: 'municipality' } }).title).toBe('Olivet')
  })

  it('does not call the API under 3 characters', async () => {
    const spy = jest.spyOn(globalThis, 'fetch')
    await expect(searchAddress('or')).resolves.toEqual([])
    expect(spy).not.toHaveBeenCalled()
    spy.mockRestore()
  })

  it('queries the Géoplateforme with autocomplete', async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ features: [] }) } as Response)
    await searchAddress('12 rue jeanne')
    expect(String(spy.mock.calls[0][0])).toBe('https://data.geopf.fr/geocodage/search?q=12+rue+jeanne&limit=5&autocomplete=1')
    spy.mockRestore()
  })
})

describe('dates', () => {
  it('formats a day as YYYY-MM-DD', () => {
    expect(isoDay(new Date(2026, 9, 5))).toBe('2026-10-05')
  })

  it('lays a month out in weeks starting on Monday', () => {
    // October 2026 starts on a Thursday and has 31 days.
    const weeks = monthGrid(2026, 9)
    expect(weeks).toHaveLength(5)
    expect(weeks[0].slice(0, 3)).toEqual([null, null, null])
    expect(weeks[0][3]?.getDate()).toBe(1)
    expect(weeks[4][5]?.getDate()).toBe(31)
    expect(weeks[4][6]).toBeNull()
  })

  it('writes the chosen date in full', () => {
    expect(longDate('2026-10-26')).toBe('lundi 26 octobre 2026')
  })
})
