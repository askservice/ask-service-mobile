import { useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { resendPhoneCode, verifyPhoneCode } from '@/api/requests'
import { CODE_LENGTH, CodeInput } from '@/components/CodeInput'
import { ResendCode } from '@/components/ResendCode'
import { Button, ErrorText, Footer, IconButton, Text, Title } from '@/components/ui'
import { displayPhone } from '@/lib/profile'
import { useSession } from '@/state/session'
import { colors } from '@/theme'

const NETWORK_ERROR = 'Connexion impossible. Vérifiez votre réseau et réessayez.'

// SMS code for the account's number (new number saved in Mes informations, or « Vérifier » on
// the account). phone = number as the API stores it (+33…); sent = '0' when no SMS left yet.
export default function PhoneCodeScreen() {
  const { phone = '', sent } = useLocalSearchParams<{ phone: string; sent?: string }>()
  const { signIn } = useSession()
  const queryClient = useQueryClient()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const verify = async (value = code) => {
    if (value.length !== CODE_LENGTH) { setError(`Saisissez les ${CODE_LENGTH} chiffres du code.`); return }
    setError(null)
    setBusy(true)
    try {
      const res = await verifyPhoneCode(phone, value)
      const session = res.body.data?.token
      if (res.status >= 400 || !session) { setError(res.body.message || 'Code invalide. Veuillez réessayer.'); return }
      await signIn(session)
      await queryClient.invalidateQueries({ queryKey: ['me', 'profile'] })
      Alert.alert('Numéro vérifié', undefined, [{ text: 'OK' }])
      router.dismissTo('/compte')
    } catch {
      setError(NETWORK_ERROR)
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    try {
      const res = await resendPhoneCode(phone)
      return res.status >= 400 ? res.body.message || 'Le code n’a pas pu être renvoyé.' : null
    } catch {
      return NETWORK_ERROR
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, padding: 20, gap: 20 }}>
          <IconButton icon="arrow-back" label="Retour" onPress={() => router.back()} />
          <View style={{ gap: 8 }}>
            <Title>Vérifiez votre numéro</Title>
            <Text style={{ color: colors.textSecondary, lineHeight: 21 }}>
              {`Saisissez le code à ${CODE_LENGTH} chiffres envoyé au `}
              <Text weight="bold">{displayPhone(phone)}</Text>.
            </Text>
            {sent === '0' ? (
              <Text style={{ color: colors.warning, lineHeight: 21 }}>Le SMS n’a pas pu partir tout de suite. Touchez « Renvoyer le code » dès que possible.</Text>
            ) : null}
          </View>
          <CodeInput value={code} onChange={setCode} onComplete={verify} />
          {error ? <ErrorText>{error}</ErrorText> : null}
          <ResendCode send={resend} onResult={setError} />
        </View>
        <Footer>
          <Button label="Valider" onPress={() => verify()} loading={busy} />
        </Footer>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
