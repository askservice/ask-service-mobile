import Constants, { ExecutionEnvironment } from 'expo-constants'
import { Platform } from 'react-native'

import { api } from '@/api/client'
import { FIREBASE_API_KEY, GOOGLE_WEB_CLIENT_ID } from '@/config'

// Google sign-in needs the native module: not in Expo Go (only in a development or store
// build), and only once the Google client id is set.
export const googleSignInAvailable =
  Platform.OS !== 'web' &&
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient &&
  Boolean(GOOGLE_WEB_CLIENT_ID)

export class GoogleSignInError extends Error {}

/**
 * Google ID token -> Firebase ID token of the website's Firebase project (Identity Toolkit REST
 * API, the same exchange the website's Firebase SDK does): the backend's /user/google-login
 * only accepts Firebase tokens.
 */
export async function firebaseTokenFromGoogle(googleIdToken: string): Promise<string> {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      postBody: `id_token=${encodeURIComponent(googleIdToken)}&providerId=google.com`,
      requestUri: 'http://localhost',
      returnSecureToken: true,
    }),
  })
  const body = (await res.json().catch(() => ({}))) as { idToken?: string }
  if (!res.ok || !body.idToken) throw new GoogleSignInError('La connexion avec Google n’a pas abouti. Veuillez réessayer.')
  return body.idToken
}

/**
 * Opens the Google account chooser, then signs in to the backend like the website.
 * Returns the backend answer, or null when the client closed the chooser.
 */
export async function signInWithGoogle() {
  // Loaded here: importing the module in Expo Go fails (no native code).
  const { GoogleSignin, isCancelledResponse, isErrorWithCode, statusCodes } = await import('@react-native-google-signin/google-signin')
  GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID })
  let googleIdToken: string | null
  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true })
    // Always show the account chooser, even after a previous sign-in.
    await GoogleSignin.signOut()
    const response = await GoogleSignin.signIn()
    if (isCancelledResponse(response)) return null
    googleIdToken = response.data.idToken
  } catch (err) {
    if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) return null
    if (isErrorWithCode(err) && err.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new GoogleSignInError('Les services Google Play ne sont pas disponibles sur ce téléphone.')
    }
    throw new GoogleSignInError('La connexion avec Google n’a pas abouti. Veuillez réessayer.')
  }
  if (!googleIdToken) throw new GoogleSignInError('La connexion avec Google n’a pas abouti. Veuillez réessayer.')

  const firebaseToken = await firebaseTokenFromGoogle(googleIdToken)
  return api<{ token?: string; role?: unknown }>('/user/google-login', {
    method: 'POST',
    body: { role_type: 'User' },
    token: firebaseToken,
  })
}
