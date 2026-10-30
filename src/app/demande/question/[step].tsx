import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router, useLocalSearchParams } from 'expo-router'
import { useRef, useState } from 'react'
import { ActivityIndicator, Keyboard, KeyboardAvoidingView, Pressable, ScrollView, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { Calendar } from '@/components/Calendar'
import { ServiceIconBadge } from '@/components/ServiceIcon'
import { Button, CheckDot, ErrorText, fieldBorder, Field, Footer, OptionButton, StepHeader, Text, Title } from '@/components/ui'
import { longDate } from '@/lib/dates'
import { KEYBOARD_BEHAVIOR, useRevealField } from '@/lib/keyboard'
import { isAnswered, isMultiple, isSingleChoice, matchingOptions, missingAnswers } from '@/lib/questions'
import type { Answer, Question, QuestionOption } from '@/lib/types'
import { useDraft } from '@/state/draft'
import { goToQuestionStep, useFlowSteps } from '@/state/flow'
import { colors, fonts, radius } from '@/theme'

// Steps 3 and next: the service's questions (admin), one step per screen. A single-choice question
// is a field over its answers, like the address; a step made of one such question goes on as soon
// as an answer is touched.
export default function QuestionStep() {
  const { step } = useLocalSearchParams<{ step: string }>()
  const index = Number(step ?? 0)
  const { draft, update } = useDraft()
  const { steps, total, isLoading, error, refetch } = useFlowSteps()
  const [tried, setTried] = useState(false)
  const leaving = useRef(false)
  // Choice field being used, and where each question starts in the scrolled content.
  const [typingKey, setTypingKey] = useState<string | null>(null)
  const [shownCount, setShownCount] = useState(0)
  const blockY = useRef<Record<string, number>>({})
  const { scroll, reveal, fieldY } = useRevealField(typingKey !== null, shownCount)

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
    Keyboard.dismiss()
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={KEYBOARD_BEHAVIOR}>
        <ScrollView ref={scroll} contentContainerStyle={{ padding: 20, gap: 22 }} keyboardShouldPersistTaps="handled">
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
              onLayout={(y) => { blockY.current[q.key] = y }}
              onTyping={(typing, count) => {
                if (!typing) { setTypingKey((k) => (k === q.key ? null : k)); return }
                fieldY.current = blockY.current[q.key] ?? 0
                setTypingKey(q.key)
                setShownCount(count)
                if (Keyboard.isVisible()) reveal()
              }}
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function QuestionBlock({ question: q, answer, showHint, error, onAnswer, onPick, onLayout, onTyping }: {
  question: Question
  answer: Answer | undefined
  showHint: boolean
  error: boolean
  onAnswer: (value: Answer) => void
  onPick: (value: string) => void
  onLayout: (y: number) => void
  onTyping: (typing: boolean, shownCount: number) => void
}) {
  const options = q.options ?? []
  return (
    <View style={{ gap: 14 }} onLayout={(e) => onLayout(e.nativeEvent.layout.y)}>
      <View style={{ gap: 6 }}>
        <Title>{q.label}</Title>
        {showHint ? (
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>
            {isSingleChoice(q) ? 'Touchez le champ pour voir les réponses.' : 'Touchez une réponse pour passer à la suite.'}
          </Text>
        ) : null}
      </View>

      {isSingleChoice(q) ? (
        <ChoiceField label={q.label} options={options} answer={typeof answer === 'string' ? answer : undefined} error={error} onPick={onPick} onTyping={onTyping} />
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

      {error && !isSingleChoice(q) ? <ErrorText>Répondez à cette question pour continuer.</ErrorText> : null}
    </View>
  )
}

/**
 * Single choice, like the address: a field whose answers (set in the admin) unfold under it once
 * touched, filtered while typing. Once answered, only the answer is shown with « Modifier ».
 */
function ChoiceField({ label, options, answer, error, onPick, onTyping }: {
  label: string
  options: QuestionOption[]
  answer: string | undefined
  error: boolean
  onPick: (value: string) => void
  onTyping: (typing: boolean, shownCount: number) => void
}) {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [choosing, setChoosing] = useState(!isAnswered(answer))
  // List closed until the field is touched, then left open until an answer is chosen (like the address suggestions).
  const [open, setOpen] = useState(false)
  const shown = matchingOptions(options, query)
  const chosen = options.find((o) => o.value === answer)

  const pick = (value: string) => {
    setQuery('')
    setOpen(false)
    setChoosing(false)
    onPick(value)
  }

  if (!choosing && chosen) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: radius.lg, borderWidth: 2, borderColor: colors.primary, backgroundColor: colors.primaryDim }}>
        <CheckDot />
        <Text weight="bold" style={{ flex: 1, fontSize: 16 }}>{chosen.label}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Modifier la réponse : ${label}`}
          onPress={() => setChoosing(true)}
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.card }}
        >
          <MaterialIcons name="edit" size={16} color={colors.primary} />
          <Text weight="bold" style={{ color: colors.primary, fontSize: 14 }}>Modifier</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={{ gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 52, paddingHorizontal: 14, borderRadius: radius.md, ...fieldBorder(focused, error), backgroundColor: colors.card }}>
        <TextInput
          value={query}
          onChangeText={(t) => { setQuery(t); setOpen(true); onTyping(true, matchingOptions(options, t).length) }}
          onFocus={() => { setFocused(true); setOpen(true); onTyping(true, shown.length) }}
          onBlur={() => { setFocused(false); onTyping(false, 0) }}
          placeholder="Rechercher une réponse"
          placeholderTextColor={colors.textMuted}
          accessibilityLabel={label}
          autoCorrect={false}
          style={{ flex: 1, alignSelf: 'stretch', fontFamily: fonts.regular, fontSize: 16, color: colors.text }}
        />
        {query ? (
          <Pressable accessibilityLabel="Effacer" onPress={() => setQuery('')} hitSlop={8}>
            <MaterialIcons name="cancel" size={22} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>
      {error ? <ErrorText>Choisissez une réponse dans la liste.</ErrorText> : null}

      {open ? (
        <View style={{ padding: 6, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
          {shown.map((o) => {
            const selected = o.value === answer
            return (
              <Pressable
                key={o.value}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => pick(o.value)}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48, paddingHorizontal: 10, paddingVertical: 10, borderRadius: radius.sm, backgroundColor: pressed || selected ? colors.primaryDim : 'transparent' })}
              >
                <Text weight="semibold" style={{ flex: 1, fontSize: 16 }}>{o.label}</Text>
                {selected ? <CheckDot /> : null}
              </Pressable>
            )
          })}
          {shown.length === 0 ? <Text style={{ color: colors.textMuted, padding: 10 }}>Aucune réponse ne correspond.</Text> : null}
        </View>
      ) : null}
    </View>
  )
}
