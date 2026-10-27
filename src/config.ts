// API of the Ask Service backend. Set EXPO_PUBLIC_API_URL (in .env) to point the app elsewhere,
// e.g. a backend running on the developer's machine.
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || 'https://api.askservice.fr').replace(/\/$/, '')

// French address search of the IGN Géoplateforme (Base Adresse Nationale), free and without key.
export const GEOCODING_URL = 'https://data.geopf.fr/geocodage'

// Google sign-in (same Firebase project as the website, ask-service--login). The web API key is
// public (it is in the website's code). GOOGLE_WEB_CLIENT_ID: OAuth client of type "Web" of
// that project (google-services.json, oauth_client with client_type 3).
export const FIREBASE_API_KEY = process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'AIzaSyBm-6Ffv6IK8HcuPpGM370LVbZc1kTQ058'
export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '112726239018-0ke139dgrf05nb7bpima44msk7lcrrth.apps.googleusercontent.com'
