import { router } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { resendEmailCode, verifyEmailCode } from '@/api/requests'
import { CODE_LENGTH, CodeInput } from '@/components/CodeInput'
import { ResendCode } from '@/components/ResendCode'
import { Button, ErrorText, Field, Footer, IconButton, Text, Title } from '@/components/ui'
import { loginRefusal } from '@/lib/auth'
import { isValidEmail } from '@/lib/contact'
import { useSession } from '@/state/session'
import { colors } from '@/theme'

const NETWORK_ERROR = 'Connexion impossible. Vérifiez votre réseau et réessayez.'

// Sign-in without password: the client's e-mail, then the 6-digit code sent to it.
export default function SignIn() {
  const { signIn } = useSession()
  const [email, setEmail] = useState('')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const sendCode = async (): Promise<string | null> => {
    try {
      const res = await resendEmailCode(email.trim())
      if (res.status === 404) return 'Aucun compte avec cet e-mail. Faites une demande pour en créer un.'
      return res.status >= 400 ? res.body.message || 'Le code n’a pas pu être envoyé.' : null
    } catch {
      return NETWORK_ERROR
    }
  }

  const askCode = async () => {
    if (!isValidEmail(email)) { setError('Adresse e-mail invalide.'); return }
    setError(null)
    setBusy(true)
    const failure = await sendCode()
    setBusy(false)
    if (failure) setError(failure)
    else setStep('code')
  }

  const verify = async (value = code) => {
    if (value.length !== CODE_LENGTH) { setError(`Saisissez les ${CODE_LENGTH} chiffres du code.`); return }
    setError(null)
    setBusy(true)
    try {
      const res = await verifyEmailCode(email.trim(), value)
      const token = (res.body.data as { token?: string; role?: unknown } | undefined)?.token
      if (res.status >= 400 || !token) { setError(res.body.message || 'Code invalide. Veuillez réessayer.'); return }
      const refusal = loginRefusal((res.body.data as { role?: unknown }).role)
      if (refusal) { setError(refusal); return }
      await signIn(token)
      router.replace('/demandes')
    } catch {
      setError(NETWORK_ERROR)
    } finally {
      setBusy(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
          <IconButton
            icon={step === 'code' ? 'arrow-back' : 'close'}
            label={step === 'code' ? 'Retour' : 'Fermer'}
            onPress={() => (step === 'code' ? (setStep('email'), setCode(''), setError(null)) : router.back())}
          />
          {step === 'email' ? (
            <>
              <View style={{ gap: 8 }}>
                <Title>Suivre mes demandes</Title>
                <Text style={{ color: colors.textSecondary, lineHeight: 21 }}>
                  Saisissez l’e-mail utilisé pour votre demande : nous vous envoyons un code de connexion. Pas de mot de passe à retenir.
                </Text>
              </View>
              <Field
                label="Adresse e-mail"
                value={email}
                onChangeText={setEmail}
                placeholder="marie.dupont@email.fr"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                autoFocus
                onSubmitEditing={askCode}
              />
            </>
          ) : (
            <>
              <View style={{ gap: 8 }}>
                <Title>Vérifiez votre e-mail</Title>
                <Text style={{ color: colors.textSecondary, lineHeight: 21 }}>
                  {`Saisissez le code à ${CODE_LENGTH} chiffres envoyé à `}
                  <Text weight="bold">{email.trim()}</Text>.
                </Text>
              </View>
              <CodeInput value={code} onChange={setCode} onComplete={verify} />
              <ResendCode send={sendCode} onResult={setError} />
            </>
          )}
          {error ? <ErrorText>{error}</ErrorText> : null}
        </ScrollView>
        <Footer>
          {step === 'email'
            ? <Button label="Recevoir un code" onPress={askCode} loading={busy} />
            : <Button label="Se connecter" onPress={() => verify()} loading={busy} />}
        </Footer>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
