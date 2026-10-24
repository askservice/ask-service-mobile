import * as SecureStore from 'expo-secure-store'

// Session token returned by verify-phone / verify-email, kept in the phone's encrypted store.
const TOKEN_KEY = 'askservice.session'

export const loadToken = () => SecureStore.getItemAsync(TOKEN_KEY)

export const saveToken = (token: string) => SecureStore.setItemAsync(TOKEN_KEY, token)

export const clearToken = () => SecureStore.deleteItemAsync(TOKEN_KEY)
