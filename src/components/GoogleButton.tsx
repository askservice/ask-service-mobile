import { router } from 'expo-router'
import { Image, Pressable, View } from 'react-native'

import { loginRefusal } from '@/lib/auth'
import { GoogleSignInError, googleSignInAvailable, signInWithGoogle } from '@/lib/googleSignIn'
import { useSession } from '@/state/session'
import { colors, radius } from '@/theme'

import { Text } from './ui'

const NETWORK_ERROR = 'Connexion impossible. Vérifiez votre réseau et réessayez.'

/**
 * "ou" + "Continuer avec Google", on the sign-in and sign-up screens. Same as the website:
 * the account is created if needed, client accounts only (the API refuses a vendor).
 * Nothing shown when Google sign-in is not available (Expo Go).
 */
export function GoogleButton({ busy, onBusy, onError }: { busy: boolean; onBusy: (busy: boolean) => void; onError: (error: string | null) => void }) {
  const { signIn } = useSession()
  if (!googleSignInAvailable) return null

  const google = async () => {
    onError(null)
    onBusy(true)
    try {
      const res = await signInWithGoogle()
      if (!res) return
      const token = res.body.data?.token
      if (res.status >= 400 || !token) { onError(res.body.message || 'La connexion avec Google n’a pas abouti. Veuillez réessayer.'); return }
      const refusal = loginRefusal(res.body.data?.role)
      if (refusal) { onError(refusal); return }
      await signIn(token)
      router.replace('/demandes')
    } catch (err) {
      onError(err instanceof GoogleSignInError ? err.message : NETWORK_ERROR)
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
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: busy }}
        disabled={busy}
        onPress={google}
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
      </Pressable>
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
