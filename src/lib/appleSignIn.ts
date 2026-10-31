import Constants, { ExecutionEnvironment } from 'expo-constants'
import { Platform } from 'react-native'

import { api } from '@/api/client'
import { FIREBASE_API_KEY } from '@/config'

// Sign in with Apple: iPhone only, and not in Expo Go (its tokens are issued for Expo Go's own
// app id, which Firebase refuses). Apple requires it on iOS because Google sign-in is offered.
export const appleSignInPlatform =
  Platform.OS === 'ios' && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient

export class AppleSignInError extends Error {}

const FAILED = 'La connexion avec Apple n’a pas abouti. Veuillez réessayer.'

/**
 * Apple ID token -> Firebase ID token of the website's Firebase project, like Google
 * (googleSignIn.ts). `rawNonce` is the nonce before hashing: Apple signed its SHA-256.
 */
export async function firebaseTokenFromApple(appleIdToken: string, rawNonce: string): Promise<string> {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${FIREBASE_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      postBody: `id_token=${encodeURIComponent(appleIdToken)}&nonce=${encodeURIComponent(rawNonce)}&providerId=apple.com`,
      requestUri: 'http://localhost',
      returnSecureToken: true,
    }),
  })
  const body = (await res.json().catch(() => ({}))) as { idToken?: string }
  if (!res.ok || !body.idToken) throw new AppleSignInError(FAILED)
  return body.idToken
}

/** Name Apple gives on the very first sign-in only, sent so the new account is not unnamed. */
export function nameFromApple(fullName: { givenName?: string | null; familyName?: string | null } | null) {
  return {
    ...(fullName?.givenName ? { first_name: fullName.givenName } : {}),
    ...(fullName?.familyName ? { last_name: fullName.familyName } : {}),
  }
}

/**
 * Opens Apple's sign-in sheet, then signs in to the backend through the same route as Google.
 * Returns the backend answer, or null when the client closed the sheet.
 */
export async function signInWithApple() {
  // Loaded here: the modules have no native code outside a build.
  const AppleAuthentication = await import('expo-apple-authentication')
  const Crypto = await import('expo-crypto')
  const rawNonce = Crypto.randomUUID()
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce)
  let credential: Awaited<ReturnType<typeof AppleAuthentication.signInAsync>>
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    })
  } catch (err) {
    if ((err as { code?: string })?.code === 'ERR_REQUEST_CANCELED') return null
    throw new AppleSignInError(FAILED)
  }
  if (!credential.identityToken) throw new AppleSignInError(FAILED)

  const firebaseToken = await firebaseTokenFromApple(credential.identityToken, rawNonce)
  return api<{ token?: string; role?: unknown }>('/user/google-login', {
    method: 'POST',
    body: { role_type: 'User', ...nameFromApple(credential.fullName) },
    token: firebaseToken,
  })
}
