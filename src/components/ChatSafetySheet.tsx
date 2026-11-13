import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useState, type ComponentProps } from 'react'
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { reportUser, setUserBlocked, useMeAction } from '@/api/me'
import { Button, ErrorText, Field, OptionButton, Text } from '@/components/ui'
import { REPORT_REASONS } from '@/lib/chat'
import { KEYBOARD_BEHAVIOR } from '@/lib/keyboard'
import { colors, radius } from '@/theme'

type Step = 'menu' | 'report' | 'reported' | 'block'

const CHAT_REFRESH = [['chats']]

/**
 * Report or block the provider of a conversation (Apple guideline 1.2: content exchanged between
 * users needs both). Opened from the "⋯" button of the conversation header.
 */
export function ChatSafetySheet({ open, onClose, chatId, partnerId, name, blockedByMe }: {
  open: boolean
  onClose: () => void
  chatId: string
  partnerId: string | undefined
  name: string
  blockedByMe: boolean
}) {
  const insets = useSafeAreaInsets()
  const [step, setStep] = useState<Step>('menu')
  const [reason, setReason] = useState<string | null>(null)
  const [details, setDetails] = useState('')
  const report = useMeAction(reportUser)
  const block = useMeAction(setUserBlocked, CHAT_REFRESH)
  const busy = report.isPending || block.isPending

  const close = () => {
    if (busy) return
    onClose()
    // Back to the menu for the next opening, once the sheet has slid down.
    setTimeout(() => {
      setStep('menu')
      setReason(null)
      setDetails('')
      report.reset()
      block.reset()
    }, 300)
  }

  const sendReport = () => {
    if (!partnerId || !reason) return
    report.mutate({ userId: partnerId, chatId, reason, description: details.trim() }, { onSuccess: () => setStep('reported') })
  }

  const toggleBlock = (blocked: boolean, then?: () => void) => {
    if (!partnerId) return
    block.mutate({ userId: partnerId, blocked }, { onSuccess: then ?? close })
  }

  return (
    <Modal visible={open} transparent animationType="slide" statusBarTranslucent onRequestClose={close}>
      <KeyboardAvoidingView behavior={KEYBOARD_BEHAVIOR} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityLabel="Fermer" onPress={close} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(35,30,45,0.45)' }} />
        <View
          accessibilityViewIsModal
          style={{ maxHeight: '90%', backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 16) + 12 }}
        >
          <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 12 }} />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
            {step === 'menu' ? (
              <>
                <Text weight="extrabold" accessibilityRole="header" style={{ fontSize: 20 }}>{name}</Text>
                <MenuRow icon="flag" label="Signaler" hint="Prévenir Ask Service d’un comportement anormal" onPress={() => setStep('report')} />
                {blockedByMe ? (
                  <MenuRow icon="lock-open" label={`Débloquer ${name}`} hint="La conversation reprend normalement" onPress={() => toggleBlock(false)} />
                ) : (
                  <MenuRow icon="block" label={`Bloquer ${name}`} hint="Plus aucun message dans un sens comme dans l’autre" danger onPress={() => setStep('block')} />
                )}
                {block.error ? <ErrorText>{block.error.message}</ErrorText> : null}
                <Button label="Fermer" variant="outline" onPress={close} />
              </>
            ) : null}

            {step === 'report' ? (
              <>
                <View style={{ gap: 6 }}>
                  <Text weight="extrabold" accessibilityRole="header" style={{ fontSize: 20 }}>{`Signaler ${name}`}</Text>
                  <Text style={{ color: colors.textSecondary, lineHeight: 21 }}>Notre équipe examine chaque signalement sous 24 heures. Le professionnel n’est pas prévenu.</Text>
                </View>
                {REPORT_REASONS.map((r) => <OptionButton key={r.key} label={r.label} selected={reason === r.key} onPress={() => setReason(r.key)} />)}
                <Field label="Précisions (facultatif)" value={details} onChangeText={setDetails} multiline maxLength={2000} />
                {report.error ? <ErrorText>{report.error.message}</ErrorText> : null}
                <Button label="Envoyer le signalement" disabled={!reason} loading={report.isPending} onPress={sendReport} />
                <Button label="Retour" variant="outline" onPress={() => setStep('menu')} />
              </>
            ) : null}

            {step === 'reported' ? (
              <>
                <View style={{ alignItems: 'center', gap: 10, paddingVertical: 8 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name="check" size={30} color={colors.primary} />
                  </View>
                  <Text weight="extrabold" accessibilityRole="header" style={{ fontSize: 20, textAlign: 'center' }}>Merci, signalement envoyé</Text>
                  <Text style={{ color: colors.textSecondary, lineHeight: 21, textAlign: 'center' }}>Notre équipe va l’examiner sous 24 heures. Vous pouvez aussi bloquer ce professionnel pour ne plus recevoir ses messages.</Text>
                </View>
                {!blockedByMe ? <Button label={`Bloquer ${name}`} onPress={() => setStep('block')} /> : null}
                <Button label="Fermer" variant="outline" onPress={close} />
              </>
            ) : null}

            {step === 'block' ? (
              <>
                <View style={{ gap: 6 }}>
                  <Text weight="extrabold" accessibilityRole="header" style={{ fontSize: 20 }}>{`Bloquer ${name} ?`}</Text>
                  <Text style={{ color: colors.textSecondary, lineHeight: 21 }}>
                    Vous ne recevrez plus ses messages et il ne pourra plus vous écrire dans l’application. Vous pourrez le débloquer à tout moment depuis cette conversation.
                  </Text>
                </View>
                {block.error ? <ErrorText>{block.error.message}</ErrorText> : null}
                <Button label="Bloquer" loading={block.isPending} onPress={() => toggleBlock(true)} />
                <Button label="Annuler" variant="outline" onPress={() => setStep('menu')} />
              </>
            ) : null}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}

function MenuRow({ icon, label, hint, danger, onPress }: {
  icon: ComponentProps<typeof MaterialIcons>['name']
  label: string
  hint: string
  danger?: boolean
  onPress: () => void
}) {
  const tint = danger ? colors.danger : colors.text
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        minHeight: 64,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: pressed ? colors.background : colors.card,
      })}
    >
      <MaterialIcons name={icon} size={24} color={tint} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text weight="bold" style={{ fontSize: 16, color: tint }}>{label}</Text>
        <Text style={{ fontSize: 13, color: colors.textSecondary }}>{hint}</Text>
      </View>
    </Pressable>
  )
}
