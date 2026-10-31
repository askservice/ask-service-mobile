import * as AppleAuthentication from 'expo-apple-authentication'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Image, Linking, Pressable, View } from 'react-native'

import type { ApiResult } from '@/api/client'
import { AppleSignInError, appleSignInPlatform, signInWithApple } from '@/lib/appleSignIn'
import { loginRefusal } from '@/lib/auth'
import { GoogleSignInError, googleSignInAvailable, signInWithGoogle } from '@/lib/googleSignIn'
import { useSession } from '@/state/session'
import { colors, radius } from '@/theme'

import { Text } from './ui'

const SITE = 'https://askservice.fr'
const NETWORK_ERROR = 'Connexion impossible. Vérifiez votre réseau et réessayez.'

/** Whether this iPhone can show "Continuer avec Apple" (checked once, at mount). */
function useAppleSignInAvailable() {
  const [available, setAvailable] = useState(false)
  useEffect(() => {
    if (!appleSignInPlatform) return
    AppleAuthentication.isAvailableAsync().then(setAvailable, () => setAvailable(false))
  }, [])
  return available
}

/**
 * "ou" + "Continuer avec Google" (+ "Continuer avec Apple" on iPhone), on the sign-in and
 * sign-up screens. Same as the website: the account is created if needed, client accounts only
 * (the API refuses a vendor). Nothing shown when neither is available (Expo Go).
 */
export function GoogleButton({ busy, onBusy, onError }: { busy: boolean; onBusy: (busy: boolean) => void; onError: (error: string | null) => void }) {
  const { signIn } = useSession()
  const apple = useAppleSignInAvailable()
  if (!googleSignInAvailable && !apple) return null

  const run = async (provider: 'Google' | 'Apple', start: () => Promise<ApiResult<{ token?: string; role?: unknown }> | null>) => {
    if (busy) return
    onError(null)
    onBusy(true)
    try {
      const res = await start()
      if (!res) return
      const token = res.body.data?.token
      if (res.status >= 400 || !token) { onError(res.body.message || `La connexion avec ${provider} n’a pas abouti. Veuillez réessayer.`); return }
      const refusal = loginRefusal(res.body.data?.role)
      if (refusal) { onError(refusal); return }
      await signIn(token)
      router.replace('/demandes')
    } catch (err) {
      onError(err instanceof GoogleSignInError || err instanceof AppleSignInError ? err.message : NETWORK_ERROR)
    } finally {
      onBusy(false)
    }
  }

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        <Text style={{ fontSize: 13, color: colors.textMuted }}>ou</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
      </View>
      {googleSignInAvailable && <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        onPress={() => run('Google', signInWithGoogle)}
        style={({ pressed }) => ({
          height: 54,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          opacity: pressed ? 0.85 : 1,
        })}
      >
        <Image source={require('@/assets/images/google-g.png')} accessibilityIgnoresInvertColors style={{ width: 20, height: 20 }} />
        <Text weight="bold" style={{ fontSize: 17 }}>Continuer avec Google</Text>
      </Pressable>}
      {/* Apple's own button (required look); it cannot be disabled, run() ignores taps while busy. */}
      {apple && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={radius.lg}
          onPress={() => run('Apple', signInWithApple)}
          style={{ height: 54, width: '100%', opacity: busy ? 0.6 : 1 }}
        />
      )}
      {/* Google and Apple can create the account without the terms checkbox, like on the website. */}
      <Text style={{ fontSize: 12, lineHeight: 18, color: colors.textMuted, textAlign: 'center', marginTop: -8 }}>
        {`En continuant avec ${[googleSignInAvailable && 'Google', apple && 'Apple'].filter(Boolean).join(' ou ')}, vous acceptez les `}
        <Text weight="semibold" style={{ fontSize: 12, color: colors.primary }} onPress={() => Linking.openURL(`${SITE}/terms`)}>Conditions d’utilisation</Text>
        {' et la '}
        <Text weight="semibold" style={{ fontSize: 12, color: colors.primary }} onPress={() => Linking.openURL(`${SITE}/privacy`)}>Politique de confidentialité</Text>
        .
      </Text>
    </>
  )
}

/** "Pas encore de compte ? Créer un compte" / "Déjà un compte ? Se connecter". */
export function SwitchAuthLink({ question, action, onPress }: { question: string; action: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress} hitSlop={8} style={{ alignSelf: 'center', paddingVertical: 4 }}>
      <Text style={{ fontSize: 15, color: colors.textSecondary }}>
        {`${question} `}
        <Text weight="bold" style={{ fontSize: 15, color: colors.primary }}>{action}</Text>
      </Text>
    </Pressable>
  )
}
