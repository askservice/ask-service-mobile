import { router, useLocalSearchParams } from 'expo-router'
import { useRef, useState } from 'react'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Calendar } from '@/components/Calendar'
import { ServiceIconBadge } from '@/components/ServiceIcon'
import { Button, ErrorText, Field, Footer, OptionButton, StepHeader, Text, Title } from '@/components/ui'
import { longDate } from '@/lib/dates'
import { isMultiple, isSingleChoice, missingAnswers } from '@/lib/questions'
import type { Answer, Question } from '@/lib/types'
import { useDraft } from '@/state/draft'
import { goToQuestionStep, useFlowSteps } from '@/state/flow'
import { colors, radius } from '@/theme'

// Steps 3 and next: the service's questions (admin), one step per screen. A step made of one
// single-choice question goes on as soon as an answer is touched.
export default function QuestionStep() {
  const { step } = useLocalSearchParams<{ step: string }>()
  const index = Number(step ?? 0)
  const { draft, update } = useDraft()
  const { steps, total, isLoading, error, refetch } = useFlowSteps()
  const [tried, setTried] = useState(false)
  const leaving = useRef(false)

  const questions = steps[index] ?? []
  const answers = draft.answers
  const setAnswer = (key: string, value: Answer) => update({ answers: { ...answers, [key]: value } })
  const autoAdvance = questions.length === 1 && (isSingleChoice(questions[0]) || questions[0].type === 'date')
  const remaining = steps.length - index - 1

  const next = () => {
    setTried(true)
    if (missingAnswers(questions, answers).length > 0) return
    goToQuestionStep(index + 1, steps.length)
  }

  // Touch an answer -> short pause so the selection is seen, then the next screen.
  const answerAndGo = (key: string, value: string) => {
    setAnswer(key, value)
    if (!autoAdvance || leaving.current) return
    leaving.current = true
    setTimeout(() => { leaving.current = false; goToQuestionStep(index + 1, steps.length) }, 180)
  }

  if (isLoading) return <ActivityIndicator color={colors.primary} style={{ flex: 1 }} />
  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, padding: 20, justifyContent: 'center', gap: 12 }}>
        <ErrorText>Impossible de charger les questions.</ErrorText>
        <Button label="Réessayer" variant="outline" onPress={() => refetch()} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.card }}>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 22 }} keyboardShouldPersistTaps="handled">
        <StepHeader step={index + 3} total={total} onBack={() => router.back()} />

        {draft.service ? (
          <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryDim, borderRadius: radius.pill, paddingVertical: 4, paddingRight: 12, paddingLeft: 4 }}>
            <ServiceIconBadge icon={draft.service.icon} size={24} background={colors.primaryDim} />
            <Text weight="semibold" style={{ fontSize: 13, color: colors.primaryDark }}>
              {[draft.service.title, draft.location ? `${draft.location.city} ${draft.location.pincode}` : null].filter(Boolean).join(' · ')}
            </Text>
          </View>
        ) : null}

        {questions.map((q) => (
          <QuestionBlock
            key={q._id}
            question={q}
            answer={answers[q.key]}
            showHint={autoAdvance}
            error={tried && missingAnswers([q], answers).length > 0}
            onAnswer={(value) => setAnswer(q.key, value)}
            onPick={(value) => answerAndGo(q.key, value)}
          />
        ))}
      </ScrollView>
      <Footer>
        {autoAdvance ? (
          <Text style={{ textAlign: 'center', color: colors.textSecondary, fontSize: 14, paddingVertical: 8 }}>
            {remaining > 0 ? `Encore ${remaining} question${remaining > 1 ? 's' : ''}, moins d'une minute` : 'Dernière question'}
          </Text>
        ) : (
          <Button label="Continuer" onPress={next} />
        )}
      </Footer>
    </SafeAreaView>
  )
}

function QuestionBlock({ question: q, answer, showHint, error, onAnswer, onPick }: {
  question: Question
  answer: Answer | undefined
  showHint: boolean
  error: boolean
  onAnswer: (value: Answer) => void
  onPick: (value: string) => void
}) {
  const options = q.options ?? []
  return (
    <View style={{ gap: 14 }}>
      <View style={{ gap: 6 }}>
        <Title>{q.label}</Title>
        {showHint ? <Text style={{ color: colors.textMuted, fontSize: 14 }}>Touchez une réponse pour passer à la suite.</Text> : null}
      </View>

      {isSingleChoice(q) ? (
        <View style={{ gap: 10 }}>
          {options.map((o) => <OptionButton key={o.value} label={o.label} selected={answer === o.value} onPress={() => onPick(o.value)} />)}
        </View>
      ) : null}

      {isMultiple(q) && options.length > 0 ? (
        <View style={{ gap: 10 }}>
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>Plusieurs réponses possibles.</Text>
          {options.map((o) => {
            const list = Array.isArray(answer) ? answer : []
            const selected = list.includes(o.value)
            return (
              <OptionButton
                key={o.value}
                label={o.label}
                selected={selected}
                onPress={() => onAnswer(selected ? list.filter((v) => v !== o.value) : [...list, o.value])}
              />
            )
          })}
        </View>
      ) : null}

      {q.type === 'date' ? <Calendar value={typeof answer === 'string' ? answer : ''} onPick={onPick} /> : null}
      {q.type === 'date' && typeof answer === 'string' && answer ? (
        <Text style={{ color: colors.textSecondary }}>{`Date choisie : ${longDate(answer)}`}</Text>
      ) : null}

      {['text', 'textarea', 'number'].includes(q.type) ? (
        <Field
          label={q.placeholder || 'Votre réponse'}
          value={typeof answer === 'string' ? answer : ''}
          onChangeText={onAnswer}
          multiline={q.type === 'textarea'}
          keyboardType={q.type === 'number' ? 'numeric' : 'default'}
        />
      ) : null}

      {/* Types the prototype does not handle yet (time, file...): answered on the website. */}
      {!isSingleChoice(q) && !(isMultiple(q) && options.length > 0) && !['date', 'text', 'textarea', 'number'].includes(q.type) ? (
        <Text style={{ color: colors.textMuted }}>Cette question n’est pas encore disponible dans l’application.</Text>
      ) : null}

      {error ? <ErrorText>Répondez à cette question pour continuer.</ErrorText> : null}
    </View>
  )
}
