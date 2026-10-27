import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import {
  resendAccountPhoneCode,
  resendEmailCode,
  resendPhoneCode,
  verifyAccountPhoneCode,
  verifyEmailCode,
  verifyPhoneCode,
} from '@/api/requests'
import { CODE_LENGTH, CodeInput } from '@/components/CodeInput'
import { ResendCode } from '@/components/ResendCode'
import { Button, ErrorText, Footer, IconButton, Text, Title } from '@/components/ui'
import { KEYBOARD_BEHAVIOR } from '@/lib/keyboard'
import { useDraft } from '@/state/draft'
import { followOutcome, useSubmitRequest } from '@/state/flow'
import { useSession } from '@/state/session'
import { colors } from '@/theme'

type Mode = 'phone' | 'email' | 'account'

const NETWORK_ERROR = 'Connexion impossible. Vérifiez votre réseau et réessayez.'

// Code sent by SMS (new client, or number of a signed-in account) or by e-mail (known client).
// Phone: the request already exists, the code confirms it. E-mail: once signed in, the request
// is sent again with the session, like on the website.
export default function CodeStep() {
  const { mode = 'phone', ref } = useLocalSearchParams<{ mode: Mode; ref?: string }>()
  const { draft } = useDraft()
  const { token, signIn } = useSession()
  const submit = useSubmitRequest()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  // Sent as typed, like the website: the backend normalizes French numbers.
  const phone = draft.contact.phone.trim()
  const email = draft.contact.email.trim()
  const target = mode === 'email' ? email : draft.contact.phone

  const verify = async (value = code) => {
    if (value.length !== CODE_LENGTH) { setError(`Saisissez les ${CODE_LENGTH} chiffres du code.`); return }
    setError(null)
    setBusy(true)
    try {
      if (mode === 'account') {
        const res = await verifyAccountPhoneCode(value, token ?? '')
        if (res.status >= 400) { setError(res.body.message || 'Code invalide.'); return }
        setError(followOutcome(await submit()))
        return
      }
      const res = mode === 'phone' ? await verifyPhoneCode(phone, value) : await verifyEmailCode(email, value)
      const session = res.body.data?.token
      if (res.status >= 400 || !session) { setError(res.body.message || 'Code invalide. Veuillez réessayer.'); return }
      await signIn(session)
      if (mode === 'phone') router.replace({ pathname: '/demande/envoyee', params: { ref: ref ?? '' } })
      else setError(followOutcome(await submit()))
    } catch {
      setError(NETWORK_ERROR)
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    try {
      const res = mode === 'phone'
        ? await resendPhoneCode(phone)
        : mode === 'email'
          ? await resendEmailCode(email)
          : await resendAccountPhoneCode(token ?? '')
      return res.status >= 400 ? res.body.message || 'Le code n’a pas pu être renvoyé.' : null
    } catch {
      return NETWORK_ERROR
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={KEYBOARD_BEHAVIOR}>
        <View style={{ flex: 1, padding: 20, gap: 20 }}>
          <IconButton icon="arrow-back" label="Retour" onPress={() => router.back()} />
          <View style={{ gap: 8 }}>
            <Title>{mode === 'email' ? 'Vérifiez votre e-mail' : 'Vérifiez votre numéro'}</Title>
            <Text style={{ color: colors.textSecondary, lineHeight: 21 }}>
              {`Saisissez le code à ${CODE_LENGTH} chiffres envoyé ${mode === 'email' ? 'à' : 'au'} `}
              <Text weight="bold">{target}</Text>.
            </Text>
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
