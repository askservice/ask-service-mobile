import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router } from 'expo-router'
import { useState } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button, ErrorText, Field, Footer, StepHeader, Text, Title } from '@/components/ui'
import { contactErrors, type ContactErrors } from '@/lib/contact'
import type { Contact } from '@/lib/types'
import { useDraft } from '@/state/draft'
import { followOutcome, useFlowSteps, useSubmitRequest } from '@/state/flow'
import { colors, radius } from '@/theme'

// Last step: contact details, then the request is sent (a code follows for a new client).
export default function ContactStep() {
  const { draft, update } = useDraft()
  const { total, contactStep } = useFlowSteps()
  const submit = useSubmitRequest()
  const [errors, setErrors] = useState<ContactErrors>({})
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const c = draft.contact
  const set = (key: keyof Contact) => (value: string) => update({ contact: { ...c, [key]: value } })

  const send = async () => {
    const found = contactErrors(c)
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSubmitError(null)
    setSending(true)
    const outcome = await submit()
    setSending(false)
    setSubmitError(followOutcome(outcome))
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }} keyboardShouldPersistTaps="handled">
          <StepHeader step={contactStep} total={total} onBack={() => router.back()} />
          <Title>Comment les pros peuvent-ils vous joindre ?</Title>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Field style={{ flex: 1 }} label="Prénom" value={c.firstName} onChangeText={set('firstName')} placeholder="Marie" autoComplete="given-name" textContentType="givenName" error={errors.firstName} />
            <Field style={{ flex: 1 }} label="Nom" value={c.lastName} onChangeText={set('lastName')} placeholder="Dupont" autoComplete="family-name" textContentType="familyName" error={errors.lastName} />
          </View>
          <Field label="Numéro de téléphone" value={c.phone} onChangeText={set('phone')} placeholder="06 12 34 56 78" keyboardType="phone-pad" autoComplete="tel" textContentType="telephoneNumber" error={errors.phone} />
          <Field label="Adresse e-mail" value={c.email} onChangeText={set('email')} placeholder="marie.dupont@email.fr" keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="emailAddress" error={errors.email} />
          <Field label="Précisions sur votre besoin" hint="(facultatif)" value={c.notes} onChangeText={set('notes')} placeholder="Ex. : bureaux de 120 m², 2 passages par semaine" multiline numberOfLines={3} />

          <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: colors.background }}>
            <MaterialIcons name="lock-outline" size={18} color={colors.primary} />
            <Text style={{ flex: 1, fontSize: 13, lineHeight: 18, color: colors.textSecondary }}>
              Vos coordonnées vont uniquement aux professionnels qui prennent votre demande (3 au maximum).
            </Text>
          </View>
          {submitError ? <ErrorText>{submitError}</ErrorText> : null}
        </ScrollView>
        <Footer>
          <Button label="Recevoir mes devis" onPress={send} loading={sending} />
          <Text style={{ textAlign: 'center', fontSize: 12, color: colors.textMuted }}>Un code de confirmation vous sera envoyé par SMS ou e-mail.</Text>
        </Footer>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
