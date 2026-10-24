// API of the Ask Service backend. Set EXPO_PUBLIC_API_URL (in .env) to point the app elsewhere,
// e.g. a backend running on the developer's machine.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://api.askservice.fr').replace(/\/$/, '')

// French address search of the IGN Géoplateforme (Base Adresse Nationale), free and without key.
export const GEOCODING_URL = 'https://data.geopf.fr/geocodage'
