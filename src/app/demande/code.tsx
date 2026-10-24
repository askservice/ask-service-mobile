import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useRef, useState, type ComponentRef } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import {
  resendAccountPhoneCode,
  resendEmailCode,
  resendPhoneCode,
  verifyAccountPhoneCode,
  verifyEmailCode,
  verifyPhoneCode,
} from '@/api/requests'
import { loadToken, saveToken } from '@/api/session'
import { Button, ErrorText, Footer, IconButton, Text, Title } from '@/components/ui'
import { useDraft } from '@/state/draft'
import { followOutcome, useSubmitRequest } from '@/state/flow'
import { colors, fonts, radius } from '@/theme'

const CODE_LENGTH = 6
const RESEND_DELAY = 60

type Mode = 'phone' | 'email' | 'account'

// Code sent by SMS (new client, or number of a signed-in account) or by e-mail (known client).
// Phone: the request already exists, the code confirms it. E-mail: once signed in, the request
// is sent again with the session, like on the website.
export default function CodeStep() {
  const { mode = 'phone', ref } = useLocalSearchParams<{ mode: Mode; ref?: string }>()
  const { draft } = useDraft()
  const submit = useSubmitRequest()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [countdown, setCountdown] = useState(RESEND_DELAY)
  const [resent, setResent] = useState(false)
  const input = useRef<ComponentRef<typeof TextInput>>(null)

  // Sent as typed, like the website: the backend normalizes French numbers.
  const phone = draft.contact.phone.trim()
  const email = draft.contact.email.trim()
  const target = mode === 'email' ? email : draft.contact.phone

  useEffect(() => {
    if (countdown <= 0) return
    const t = setTimeout(() => setCountdown((n) => n - 1), 1000)
    return () => clearTimeout(t)
  }, [countdown])

  const verify = async (value = code) => {
    if (value.length !== CODE_LENGTH) { setError(`Saisissez les ${CODE_LENGTH} chiffres du code.`); return }
    setError(null)
    setBusy(true)
    try {
      if (mode === 'account') {
        const token = await loadToken()
        const res = await verifyAccountPhoneCode(value, token ?? '')
        if (res.status >= 400) { setError(res.body.message || 'Code invalide.'); return }
        setError(followOutcome(await submit()))
        return
      }
      const res = mode === 'phone' ? await verifyPhoneCode(phone, value) : await verifyEmailCode(email, value)
      const token = res.body.data?.token
      if (res.status >= 400 || !token) { setError(res.body.message || 'Code invalide. Veuillez réessayer.'); return }
      await saveToken(token)
      if (mode === 'phone') router.replace({ pathname: '/demande/envoyee', params: { ref: ref ?? '' } })
      else setError(followOutcome(await submit()))
    } catch {
      setError('Connexion impossible. Vérifiez votre réseau et réessayez.')
    } finally {
      setBusy(false)
    }
  }

  const resend = async () => {
    setError(null)
    setResent(false)
    try {
      const res = mode === 'phone'
        ? await resendPhoneCode(phone)
        : mode === 'email'
          ? await resendEmailCode(email)
          : await resendAccountPhoneCode((await loadToken()) ?? '')
      if (res.status >= 400) { setError(res.body.message || "Le code n'a pas pu être renvoyé."); return }
      setResent(true)
      setCountdown(RESEND_DELAY)
    } catch {
      setError('Connexion impossible. Vérifiez votre réseau et réessayez.')
    }
  }

  const onChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, CODE_LENGTH)
    setCode(digits)
    if (digits.length === CODE_LENGTH) verify(digits)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, padding: 20, gap: 20 }}>
          <IconButton icon="arrow-back" label="Retour" onPress={() => router.back()} />
          <View style={{ gap: 8 }}>
            <Title>{mode === 'email' ? 'Vérifiez votre e-mail' : 'Vérifiez votre numéro'}</Title>
            <Text style={{ color: colors.textSecondary, lineHeight: 21 }}>
              {`Saisissez le code à ${CODE_LENGTH} chiffres envoyé ${mode === 'email' ? 'à' : 'au'} `}
              <Text weight="bold">{target}</Text>.
            </Text>
          </View>

          {/* One hidden field, six boxes drawn from its value (SMS auto-fill works on it). */}
          <Pressable onPress={() => input.current?.focus()} accessibilityLabel="Code de vérification" style={{ flexDirection: 'row', gap: 8 }}>
            {Array.from({ length: CODE_LENGTH }, (_, i) => (
              <View
                key={i}
                style={{ flex: 1, height: 58, borderRadius: radius.md, borderWidth: code.length === i ? 2 : 1, borderColor: code.length === i ? colors.primary : colors.border, alignItems: 'center', justifyContent: 'center' }}
              >
                <Text weight="bold" style={{ fontSize: 24 }}>{code[i] ?? ''}</Text>
              </View>
            ))}
          </Pressable>
          <TextInput
            ref={input}
            value={code}
            onChangeText={onChange}
            keyboardType="number-pad"
            textContentType="oneTimeCode"
            autoComplete="one-time-code"
            autoFocus
            maxLength={CODE_LENGTH}
            style={{ position: 'absolute', opacity: 0, height: 1, width: 1, fontFamily: fonts.regular }}
          />

          {error ? <ErrorText>{error}</ErrorText> : null}
          {resent && !error ? <Text style={{ color: colors.successDark }}>Un nouveau code a été envoyé.</Text> : null}

          <Pressable accessibilityRole="button" disabled={countdown > 0} onPress={resend} style={{ alignSelf: 'flex-start', paddingVertical: 8 }}>
            <Text weight="semibold" style={{ color: countdown > 0 ? colors.textMuted : colors.primary }}>
              {countdown > 0 ? `Renvoyer le code dans ${countdown} s` : 'Renvoyer le code'}
            </Text>
          </Pressable>
        </View>
        <Footer>
          <Button label="Valider" onPress={() => verify()} loading={busy} />
        </Footer>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
