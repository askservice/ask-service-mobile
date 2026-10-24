import { searchAddress, toSuggestion } from '../address'
import { isoDay, nextDays } from '../dates'

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
  it('gives the next days from today, as YYYY-MM-DD', () => {
    const days = nextDays(3, new Date(2026, 9, 30))
    expect(days.map(isoDay)).toEqual(['2026-10-30', '2026-10-31', '2026-11-01'])
  })
})
