import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router } from 'expo-router'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button, ErrorText, Footer, StepHeader, Text, Title } from '@/components/ui'
import { summaryRows } from '@/lib/summary'
import { useDraft } from '@/state/draft'
import { followOutcome, useFlowSteps, useSubmitRequest } from '@/state/flow'
import { colors, radius } from '@/theme'

// Last step: everything typed, checked before the request is sent (a code follows for a new client).
export default function SummaryStep() {
  const { draft } = useDraft()
  const { total, questions } = useFlowSteps()
  const submit = useSubmitRequest()
  const [sending, setSending] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const rows = summaryRows(draft, questions)

  const send = async () => {
    setSubmitError(null)
    setSending(true)
    const outcome = await submit()
    setSending(false)
    setSubmitError(followOutcome(outcome))
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <StepHeader step={total} total={total} onBack={() => router.back()} />
        <View style={{ gap: 4 }}>
          <Title>Récapitulatif</Title>
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>Vérifiez et confirmez votre demande.</Text>
        </View>

        <View style={{ borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.background, overflow: 'hidden' }}>
          {rows.map((row, i) => (
            <View
              key={row.key}
              style={{ paddingHorizontal: 14, paddingVertical: 12, gap: 4, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.borderSubtle }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <MaterialIcons name={row.icon} size={16} color={colors.textMuted} />
                <Text style={{ flex: 1, fontSize: 13, color: colors.textSecondary }}>{row.label}</Text>
              </View>
              <Text weight="semibold" style={{ fontSize: 15, paddingLeft: 24 }}>{row.value}</Text>
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: colors.primaryDim }}>
          <MaterialIcons name="info-outline" size={18} color={colors.primary} />
          <Text style={{ flex: 1, fontSize: 13, lineHeight: 19, color: colors.primary }}>
            Votre demande sera transmise aux professionnels de votre zone. Vous recevrez leurs devis directement dans votre espace client.
          </Text>
        </View>
        {submitError ? <ErrorText>{submitError}</ErrorText> : null}
      </ScrollView>
      <Footer>
        <Button label="Envoyer ma demande" onPress={send} loading={sending} />
        <Button label="Modifier" variant="outline" onPress={() => router.back()} disabled={sending} />
        <Text style={{ textAlign: 'center', fontSize: 12, color: colors.textMuted }}>Un code de confirmation vous sera envoyé par SMS ou e-mail.</Text>
      </Footer>
    </SafeAreaView>
  )
}
