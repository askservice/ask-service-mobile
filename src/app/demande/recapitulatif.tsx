import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router } from 'expo-router'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Button, ErrorText, Footer, StepHeader, Text, Title } from '@/components/ui'
import { NEXT_STEPS } from '@/lib/requestCopy'
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
        <StepHeader step={total} total={total} note="Votre demande est prête" onBack={() => router.back()} />
        <View style={{ gap: 4 }}>
          <Title>Votre demande est prête</Title>
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>Vérifiez-la, puis envoyez-la.</Text>
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

        {/* What happens once sent, like the website. */}
        <View style={{ gap: 10, padding: 14, borderRadius: radius.lg, backgroundColor: colors.background }}>
          <Text weight="bold">Et ensuite ?</Text>
          {NEXT_STEPS.map((text, index) => (
            <View key={text} style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryDim }}>
                <Text weight="extrabold" style={{ fontSize: 12, color: colors.primary }}>{index + 1}</Text>
              </View>
              <Text style={{ flex: 1, fontSize: 14, lineHeight: 20, color: colors.textSecondary }}>{text}</Text>
            </View>
          ))}
        </View>
        {submitError ? <ErrorText>{submitError}</ErrorText> : null}
      </ScrollView>
      <Footer>
        <Button label="Recevoir mes devis gratuits" onPress={send} loading={sending} />
        <Text style={{ textAlign: 'center', fontSize: 12, color: colors.textSecondary, marginTop: -2 }}>Gratuit · sans engagement</Text>
        <Button label="Modifier" variant="outline" onPress={() => router.back()} disabled={sending} />
        <Text style={{ textAlign: 'center', fontSize: 12, color: colors.textMuted }}>Un code de confirmation vous sera envoyé par SMS ou e-mail.</Text>
      </Footer>
    </SafeAreaView>
  )
}
