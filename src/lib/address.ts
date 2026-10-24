import { GEOCODING_URL } from '@/config'

import type { Location } from './types'

export type AddressSuggestion = { id: string; title: string; subtitle: string; location: Location }

type Feature = {
  properties: {
    id?: string
    label: string
    name?: string
    postcode?: string
    city?: string
    context?: string
    type?: string
  }
}

/** One suggestion of the Base Adresse Nationale, in the request's location fields. */
export function toSuggestion(feature: Feature): AddressSuggestion {
  const p = feature.properties
  // context = "45, Loiret, Centre-Val de Loire": the region is the last part.
  const region = (p.context ?? '').split(',').map((s) => s.trim()).filter(Boolean).at(-1) ?? ''
  const isPlace = p.type === 'municipality'
  return {
    id: p.id ?? p.label,
    title: isPlace ? p.city ?? p.label : p.name ?? p.label,
    subtitle: [p.postcode, p.city].filter(Boolean).join(' '),
    location: {
      address: p.label,
      pincode: p.postcode ?? '',
      city: p.city ?? '',
      state: region,
      country: 'France',
    },
  }
}

async function features(url: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Recherche d'adresse indisponible (${res.status})`)
  const body = (await res.json()) as { features?: Feature[] }
  return (body.features ?? []).map(toSuggestion)
}

/** Addresses, towns or postal codes matching what the client types (3 characters minimum). */
export function searchAddress(query: string, signal?: AbortSignal): Promise<AddressSuggestion[]> {
  const q = query.trim()
  if (q.length < 3) return Promise.resolve([])
  return features(`${GEOCODING_URL}/search?${new URLSearchParams({ q, limit: '5', autocomplete: '1' })}`, signal)
}

/** Address at the phone's position. */
export async function addressAt(latitude: number, longitude: number): Promise<AddressSuggestion | null> {
  const list = await features(`${GEOCODING_URL}/reverse?${new URLSearchParams({ lat: String(latitude), lon: String(longitude), limit: '1' })}`)
  return list[0] ?? null
}
