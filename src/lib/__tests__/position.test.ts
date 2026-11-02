import { addressAt, REVERSE_RADIUS_M, type AddressSuggestion } from '../address'
import { addressAtMyPosition, POSITION_MESSAGES, type LocationModule } from '../position'

const PARIS = { latitude: 48.8566, longitude: 2.3522 }
const found: AddressSuggestion = {
  id: 'a',
  title: '8 Place de l’Hôtel de Ville',
  subtitle: '75004 Paris',
  location: { address: '8 Place de l’Hôtel de Ville 75004 Paris', pincode: '75004', city: 'Paris', state: 'Île-de-France', country: 'France' },
}

const phone = (over: Partial<LocationModule> = {}): LocationModule => ({
  requestForegroundPermissionsAsync: async () => ({ granted: true }),
  hasServicesEnabledAsync: async () => true,
  getCurrentPositionAsync: async () => ({ coords: PARIS }),
  getLastKnownPositionAsync: async () => null,
  Accuracy: { Balanced: 3 },
  ...over,
})

describe('« Utiliser ma position »', () => {
  it('gives the nearest address to the phone position', async () => {
    const find = jest.fn(async () => found)
    expect(await addressAtMyPosition(phone(), find)).toEqual({ ok: true, address: found })
    expect(find).toHaveBeenCalledWith(PARIS.latitude, PARIS.longitude)
  })

  it('stops when the permission is refused', async () => {
    const find = jest.fn(async () => found)
    expect(await addressAtMyPosition(phone({ requestForegroundPermissionsAsync: async () => ({ granted: false }) }), find)).toEqual({ ok: false, reason: 'denied' })
    expect(find).not.toHaveBeenCalled()
  })

  it('asks to turn location on when the phone has it off', async () => {
    expect(await addressAtMyPosition(phone({ hasServicesEnabledAsync: async () => false }), async () => found)).toEqual({ ok: false, reason: 'disabled' })
  })

  it('uses the last known position when the fresh one fails', async () => {
    const find = jest.fn(async () => found)
    const result = await addressAtMyPosition(
      phone({ getCurrentPositionAsync: async () => { throw new Error('no fix') }, getLastKnownPositionAsync: async () => ({ coords: { latitude: 47.9, longitude: 1.9 } }) }),
      find,
    )
    expect(result.ok).toBe(true)
    expect(find).toHaveBeenCalledWith(47.9, 1.9)
  })

  it('does not wait forever for a position', async () => {
    const never = () => new Promise<{ coords: typeof PARIS }>(() => {})
    const result = await addressAtMyPosition(phone({ getCurrentPositionAsync: never }), async () => found, 20)
    expect(result).toEqual({ ok: false, reason: 'unavailable' })
  })

  it('tells when no address is near, or when the address service fails', async () => {
    expect(await addressAtMyPosition(phone(), async () => null)).toEqual({ ok: false, reason: 'not-found' })
    expect(await addressAtMyPosition(phone(), async () => { throw new Error('503') })).toEqual({ ok: false, reason: 'unavailable' })
  })

  it('has a French message for every failure', () => {
    for (const reason of ['denied', 'disabled', 'unavailable', 'not-found'] as const) expect(POSITION_MESSAGES[reason]).toMatch(/adresse/)
  })
})

describe('reverse geocoding', () => {
  it(`looks for the nearest address within ${REVERSE_RADIUS_M} m, not only at the exact point`, async () => {
    const spy = jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: true, json: async () => ({ features: [] }) } as Response)
    expect(await addressAt(48.8325, 2.433)).toBeNull()
    const url = new URL(String(spy.mock.calls[0][0]))
    expect(url.pathname).toBe('/geocodage/reverse')
    expect(url.searchParams.get('lat')).toBe('48.8325')
    expect(url.searchParams.get('lon')).toBe('2.433')
    expect(JSON.parse(url.searchParams.get('searchgeom') ?? '{}')).toEqual({ type: 'Circle', coordinates: [2.433, 48.8325], radius: 500 })
    spy.mockRestore()
  })
})
