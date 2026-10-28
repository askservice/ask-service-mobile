import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Linking, Pressable, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { resendEmailCode, signup, verifyEmailCode } from '@/api/requests'
import { CODE_LENGTH, CodeInput } from '@/components/CodeInput'
import { GoogleButton, SwitchAuthLink } from '@/components/GoogleButton'
import { ResendCode } from '@/components/ResendCode'
import { Button, ErrorText, Field, Footer, IconButton, Text, Title } from '@/components/ui'
import { loginRefusal } from '@/lib/auth'
import { KEYBOARD_BEHAVIOR } from '@/lib/keyboard'
import { signupErrors, signupFailure, signupPayload, type SignupErrors, type SignupForm } from '@/lib/signup'
import { useSession } from '@/state/session'
import { colors } from '@/theme'

const NETWORK_ERROR = 'Connexion impossible. Vérifiez votre réseau et réessayez.'
const VENDOR_ACCOUNT = 'Cette adresse est celle d’un compte prestataire : connectez-vous sur le site, dans l’espace prestataire.'
const SITE = 'https://askservice.fr'

// Client sign-up like the website: name, e-mail, optional phone, terms, then the 6-digit code
// sent to the e-mail. No password: next time the client signs in with a code.
export default function SignUp() {
  const { signIn } = useSession()
  const [form, setForm] = useState<SignupForm>({ firstName: '', lastName: '', email: '', phone: '', termsAccepted: false })
  const [errors, setErrors] = useState<SignupErrors>({})
  const [step, setStep] = useState<'form' | 'code'>('form')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [accountExists, setAccountExists] = useState(false)
  const [busy, setBusy] = useState(false)

  const set = (key: 'firstName' | 'lastName' | 'email' | 'phone') => (value: string) => setForm((f) => ({ ...f, [key]: value }))
  const email = form.email.trim()
  const toSignIn = () => router.replace({ pathname: '/connexion', params: email ? { email } : {} })

  const register = async () => {
    const found = signupErrors(form)
    setErrors(found)
    setAccountExists(false)
    if (Object.keys(found).length) { setError(null); return }
    setError(null)
    setBusy(true)
    try {
      const res = await signup(signupPayload(form))
      if (res.status >= 400) {
        const failure = signupFailure(res.status, res.body.message)
        setError(failure.message)
        setAccountExists(Boolean(failure.accountExists))
        return
      }
      setStep('code')
    } catch {
      setError(NETWORK_ERROR)
    } finally {
      setBusy(false)
    }
  }

  const resend = async (): Promise<string | null> => {
    try {
      const res = await resendEmailCode(email)
      return res.status >= 400 ? res.body.message || 'Le code n’a pas pu être envoyé.' : null
    } catch {
      return NETWORK_ERROR
    }
  }

  const verify = async (value = code) => {
    if (value.length !== CODE_LENGTH) { setError(`Saisissez les ${CODE_LENGTH} chiffres du code.`); return }
    setError(null)
    setBusy(true)
    try {
      const res = await verifyEmailCode(email, value)
      const data = res.body.data as { token?: string; role?: unknown; flow?: string } | undefined
      if (data?.flow === 'VENDOR_ACCOUNT') { setError(VENDOR_ACCOUNT); return }
      if (res.status >= 400 || !data?.token) { setError(res.body.message || 'Code invalide. Veuillez réessayer.'); return }
      const refusal = loginRefusal(data.role)
      if (refusal) { setError(refusal); return }
      await signIn(data.token)
      router.replace('/demandes')
    } catch {
      setError(NETWORK_ERROR)
    } finally {
      setBusy(false)
    }
  }

  const toggleTerms = () => {
    setForm((f) => ({ ...f, termsAccepted: !f.termsAccepted }))
    setErrors((e) => ({ ...e, termsAccepted: undefined }))
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={KEYBOARD_BEHAVIOR}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 20 }} keyboardShouldPersistTaps="handled">
          <IconButton
            icon={step === 'code' ? 'arrow-back' : 'close'}
            label={step === 'code' ? 'Retour' : 'Fermer'}
            onPress={() => (step === 'code' ? (setStep('form'), setCode(''), setError(null)) : router.back())}
          />
          {step === 'form' ? (
            <>
              <View style={{ gap: 8 }}>
                <Title>Créer un compte</Title>
                <Text style={{ color: colors.textSecondary, lineHeight: 21 }}>
                  Pas de mot de passe : vous vous connecterez avec un code reçu par e-mail.
                </Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Field style={{ flex: 1 }} label="Prénom" value={form.firstName} onChangeText={set('firstName')} placeholder="Marie" autoComplete="given-name" textContentType="givenName" error={errors.firstName} />
                <Field style={{ flex: 1 }} label="Nom" value={form.lastName} onChangeText={set('lastName')} placeholder="Dupont" autoComplete="family-name" textContentType="familyName" error={errors.lastName} />
              </View>
              <Field label="Adresse e-mail" value={form.email} onChangeText={set('email')} placeholder="marie.dupont@email.fr" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" error={errors.email} />
              <Field label="Numéro de téléphone" hint="(facultatif)" value={form.phone} onChangeText={set('phone')} placeholder="06 12 34 56 78" keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" error={errors.phone} />
              <View style={{ gap: 6 }}>
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: form.termsAccepted }}
                  accessibilityLabel="J’accepte les conditions d’utilisation et la politique de confidentialité"
                  onPress={toggleTerms}
                  hitSlop={6}
                  style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}
                >
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      marginTop: 1,
                      borderRadius: 6,
                      borderWidth: 1.5,
                      borderColor: form.termsAccepted ? colors.primary : errors.termsAccepted ? colors.danger : colors.border,
                      backgroundColor: form.termsAccepted ? colors.primary : colors.card,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {form.termsAccepted ? <MaterialIcons name="check" size={16} color={colors.white} /> : null}
                  </View>
                  <Text style={{ flex: 1, fontSize: 14, lineHeight: 21, color: colors.textSecondary }}>
                    {'J’accepte les '}
                    <Text weight="semibold" style={{ fontSize: 14, color: colors.primary }} onPress={() => Linking.openURL(`${SITE}/terms`)}>Conditions d’utilisation</Text>
                    {' et la '}
                    <Text weight="semibold" style={{ fontSize: 14, color: colors.primary }} onPress={() => Linking.openURL(`${SITE}/privacy`)}>Politique de confidentialité</Text>
                    .
                  </Text>
                </Pressable>
                {errors.termsAccepted ? <Text style={{ fontSize: 13, color: colors.danger }}>{errors.termsAccepted}</Text> : null}
              </View>
              {/* Under the terms, like the website. */}
              <Button label="Continuer" trailingIcon="arrow-forward" onPress={register} loading={busy} />
              {error ? <ErrorText>{error}</ErrorText> : null}
              {accountExists ? <Button label="Se connecter" variant="outline" onPress={toSignIn} /> : null}
              <GoogleButton busy={busy} onBusy={setBusy} onError={setError} />
              <SwitchAuthLink question="Déjà un compte ?" action="Se connecter" onPress={toSignIn} />
            </>
          ) : (
            <>
              <View style={{ gap: 8 }}>
                <Title>Vérifiez votre e-mail</Title>
                <Text style={{ color: colors.textSecondary, lineHeight: 21 }}>
                  {`Nous avons envoyé un code à ${CODE_LENGTH} chiffres à `}
                  <Text weight="bold">{email}</Text>
                  . Pas reçu ? Vérifiez l’adresse et vos courriers indésirables.
                </Text>
              </View>
              <CodeInput value={code} onChange={setCode} onComplete={verify} />
              <ResendCode send={resend} onResult={setError} />
              {error ? <ErrorText>{error}</ErrorText> : null}
            </>
          )}
        </ScrollView>
        {step === 'code' ? (
          <Footer>
            <Button label="Valider" onPress={() => verify()} loading={busy} />
          </Footer>
        ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
