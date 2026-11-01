import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { sendLoginCode, verifyLoginCode } from '@/api/requests'
import { CODE_LENGTH, CodeInput } from '@/components/CodeInput'
import { GoogleButton, SwitchAuthLink } from '@/components/GoogleButton'
import { ResendCode } from '@/components/ResendCode'
import { Button, ErrorText, Field, Footer, IconButton, Text, Title } from '@/components/ui'
import { loginCodeFailure, loginRefusal, NO_ACCOUNT } from '@/lib/auth'
import { isValidEmail } from '@/lib/contact'
import { KEYBOARD_BEHAVIOR } from '@/lib/keyboard'
import { useSession } from '@/state/session'
import { colors } from '@/theme'

const NETWORK_ERROR = 'Connexion impossible. Vérifiez votre réseau et réessayez.'

// Sign-in without password: the client's e-mail, then the 6-digit code sent to it.
// `email`: typed on the sign-up screen when the address already has an account. An address
// without a client account gets "Créer un compte" instead of the code boxes.
export default function SignIn() {
  const { signIn } = useSession()
  const params = useLocalSearchParams<{ email?: string }>()
  const [email, setEmail] = useState(params.email ?? '')
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [noAccount, setNoAccount] = useState(false)
  const [busy, setBusy] = useState(false)

  const toSignUp = () => router.replace({ pathname: '/inscription', params: { email: email.trim() } })

  const sendCode = async (): Promise<string | null> => {
    try {
      return loginCodeFailure(await sendLoginCode(email.trim()))
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
    setNoAccount(failure === NO_ACCOUNT)
    if (failure) setError(failure)
    else setStep('code')
  }

  const verify = async (value = code) => {
    if (value.length !== CODE_LENGTH) { setError(`Saisissez les ${CODE_LENGTH} chiffres du code.`); return }
    setError(null)
    setBusy(true)
    try {
      const res = await verifyLoginCode(email.trim(), value)
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={KEYBOARD_BEHAVIOR}>
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
                onChangeText={(value) => { setEmail(value); setNoAccount(false) }}
                placeholder="marie.dupont@email.fr"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                onSubmitEditing={askCode}
              />
              {/* Under the email field, before the "ou" of Google, like the sign-up screen. */}
              <Button label="Continuer" trailingIcon="arrow-forward" onPress={askCode} loading={busy} />
              {error ? <ErrorText>{error}</ErrorText> : null}
              {noAccount ? <Button label="Créer un compte" variant="outline" onPress={toSignUp} /> : null}
              <GoogleButton busy={busy} onBusy={setBusy} onError={setError} />
              <SwitchAuthLink question="Pas encore de compte ?" action="Créer un compte" onPress={toSignUp} />
            </>
          ) : (
            <>
              <View style={{ gap: 8 }}>
                <Title>Vérifiez votre e-mail</Title>
                <Text style={{ color: colors.textSecondary, lineHeight: 21 }}>
                  {`Nous avons envoyé un code à ${CODE_LENGTH} chiffres à `}
                  <Text weight="bold">{email.trim()}</Text>
                  {'. Pas reçu ? Vérifiez vos courriers indésirables.'}
                </Text>
              </View>
              <CodeInput value={code} onChange={setCode} onComplete={verify} />
              <ResendCode send={sendCode} onResult={setError} />
              {error ? <ErrorText>{error}</ErrorText> : null}
            </>
          )}
        </ScrollView>
        {step === 'code' ? (
          <Footer>
            <Button label="Se connecter" onPress={() => verify()} loading={busy} />
          </Footer>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
