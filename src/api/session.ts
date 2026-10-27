import * as SecureStore from 'expo-secure-store'

// Session token returned by verify-phone / verify-email, kept in the phone's encrypted store,
// with the time of the last activity (signed out after 20 minutes without use).
const TOKEN_KEY = 'askservice.session'
const ACTIVITY_KEY = 'askservice.lastActivity'

export const loadToken = () => SecureStore.getItemAsync(TOKEN_KEY)

export const saveToken = (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token)

export const clearToken = () =>
  Promise.all([SecureStore.deleteItemAsync(TOKEN_KEY), SecureStore.deleteItemAsync(ACTIVITY_KEY)]).then(() => undefined)

export async function loadLastActivity(): Promise<number | null> {
  const value = Number(await SecureStore.getItemAsync(ACTIVITY_KEY))
  return Number.isFinite(value) && value > 0 ? value : null
}

export const saveLastActivity = (time: number) => SecureStore.setItemAsync(ACTIVITY_KEY, String(time))
