import { addressAt, type AddressSuggestion } from './address'

// « Utiliser ma position »: phone position -> nearest address. Shared by the request's address
// step and the profile. The location module is passed in, so it can be tested without a phone.

type Coords = { latitude: number; longitude: number }
export type LocationModule = {
  requestForegroundPermissionsAsync: () => Promise<{ granted: boolean }>
  hasServicesEnabledAsync: () => Promise<boolean>
  getCurrentPositionAsync: (options: { accuracy: number }) => Promise<{ coords: Coords }>
  getLastKnownPositionAsync: (options?: { maxAge?: number }) => Promise<{ coords: Coords } | null>
  Accuracy: { Balanced: number }
}

export type PositionResult =
  | { ok: true; address: AddressSuggestion }
  | { ok: false; reason: 'denied' | 'disabled' | 'unavailable' | 'not-found' }

/** Longest wait for a fresh position before using the phone's last known one. */
export const POSITION_TIMEOUT_MS = 12_000
/** A last known position older than this is not used. */
export const LAST_KNOWN_MAX_AGE_MS = 10 * 60_000

export const POSITION_MESSAGES: Record<Exclude<PositionResult, { ok: true }>['reason'], string> = {
  denied: 'Autorisez la localisation, ou saisissez votre adresse.',
  disabled: 'Activez la localisation de votre téléphone, ou saisissez votre adresse.',
  unavailable: 'Position indisponible. Saisissez votre adresse.',
  'not-found': 'Aucune adresse trouvée près de votre position. Saisissez-la.',
}

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T | null> =>
  Promise.race([promise, new Promise<null>((resolve) => setTimeout(() => resolve(null), ms))])

export async function addressAtMyPosition(
  location: LocationModule,
  findAddress: (lat: number, lon: number) => Promise<AddressSuggestion | null> = addressAt,
  timeoutMs = POSITION_TIMEOUT_MS,
): Promise<PositionResult> {
  const { granted } = await location.requestForegroundPermissionsAsync()
  if (!granted) return { ok: false, reason: 'denied' }
  if (!(await location.hasServicesEnabledAsync().catch(() => true))) return { ok: false, reason: 'disabled' }

  const fresh = await withTimeout(
    location.getCurrentPositionAsync({ accuracy: location.Accuracy.Balanced }).catch(() => null),
    timeoutMs,
  )
  const position = fresh ?? (await location.getLastKnownPositionAsync({ maxAge: LAST_KNOWN_MAX_AGE_MS }).catch(() => null))
  if (!position) return { ok: false, reason: 'unavailable' }

  const address = await findAddress(position.coords.latitude, position.coords.longitude).catch(() => undefined)
  if (address === undefined) return { ok: false, reason: 'unavailable' }
  return address ? { ok: true, address } : { ok: false, reason: 'not-found' }
}
