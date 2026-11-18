import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useState } from 'react'
import { KeyboardAvoidingView, Modal, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { submitReview, useMeAction } from '@/api/me'
import { Button, ErrorText, Field, OptionButton, Text } from '@/components/ui'
import { KEYBOARD_BEHAVIOR } from '@/lib/keyboard'
import {
  canSubmitReview,
  MIN_REVIEW_LENGTH,
  preselectedRequest,
  requestOptionLabel,
  reviewErrorMessage,
  type ReviewableRequest,
} from '@/lib/vendorProfile'
import { colors } from '@/theme'

/**
 * « Laisser un avis » from a provider's profile: a rating, the request (only those handled by
 * this provider and not reviewed yet) and a text. The profile is fetched again once sent.
 */
export function ReviewSheet({ open, onClose, vendorId, name, requests, requestRef }: {
  open: boolean
  onClose: () => void
  vendorId: string
  name: string
  requests: ReviewableRequest[]
  requestRef?: string | null
}) {
  const insets = useSafeAreaInsets()
  const [rating, setRating] = useState(0)
  const [requestId, setRequestId] = useState<string | null>(preselectedRequest(requests, requestRef)?._id ?? null)
  const [text, setText] = useState('')
  const [sent, setSent] = useState(false)
  const send = useMeAction(submitReview, [['vendor-profile', vendorId]])
  const left = MIN_REVIEW_LENGTH - text.trim().length

  const close = () => {
    if (send.isPending) return
    onClose()
    setTimeout(() => {
      setRating(0)
      setText('')
      setSent(false)
      send.reset()
    }, 300)
  }

  const submit = () => {
    if (!requestId || !canSubmitReview(rating, text, requestId)) return
    send.mutate({ vendorId, requestId, rating, text: text.trim() }, { onSuccess: () => setSent(true) })
  }

  return (
    <Modal visible={open} transparent animationType="slide" statusBarTranslucent onRequestClose={close}>
      <KeyboardAvoidingView behavior={KEYBOARD_BEHAVIOR} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityLabel="Fermer" onPress={close} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(35,30,45,0.45)' }} />
        <View
          accessibilityViewIsModal
          style={{ maxHeight: '92%', backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 16) + 12 }}
        >
          <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border, marginBottom: 12 }} />
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
            {sent ? (
              <>
                <View style={{ alignItems: 'center', gap: 10, paddingVertical: 8 }}>
                  <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryDim, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name="check" size={30} color={colors.primary} />
                  </View>
                  <Text weight="extrabold" accessibilityRole="header" style={{ fontSize: 20, textAlign: 'center' }}>Merci pour votre avis</Text>
                  <Text style={{ color: colors.textSecondary, lineHeight: 21, textAlign: 'center' }}>Il est maintenant visible sur le profil de {name}.</Text>
                </View>
                <Button label="Fermer" variant="outline" onPress={close} />
              </>
            ) : (
              <>
                <View style={{ gap: 4 }}>
                  <Text weight="extrabold" accessibilityRole="header" style={{ fontSize: 20 }}>Laisser un avis</Text>
                  <Text style={{ color: colors.textSecondary }}>{name}</Text>
                </View>

                <View style={{ gap: 6 }}>
                  <Text weight="semibold">Votre note</Text>
                  <View style={{ flexDirection: 'row', gap: 4 }} accessibilityRole="radiogroup">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Pressable
                        key={star}
                        accessibilityRole="radio"
                        accessibilityLabel={`${star} étoile${star > 1 ? 's' : ''}`}
                        accessibilityState={{ checked: rating === star }}
                        onPress={() => setRating(star)}
                        hitSlop={4}
                        style={{ padding: 4 }}
                      >
                        <MaterialIcons name={star <= rating ? 'star' : 'star-border'} size={38} color={star <= rating ? '#FFB900' : colors.textMuted} />
                      </Pressable>
                    ))}
                  </View>
                </View>

                <View style={{ gap: 8 }}>
                  <Text weight="semibold">Demande concernée</Text>
                  {requests.map((r) => (
                    <OptionButton key={r._id} label={requestOptionLabel(r)} selected={requestId === r._id} onPress={() => setRequestId(r._id)} />
                  ))}
                </View>

                <Field
                  label="Votre avis"
                  hint={left > 0 ? `Encore ${left} caractère${left > 1 ? 's' : ''} minimum` : undefined}
                  placeholder="Ponctualité, qualité du travail, échanges…"
                  value={text}
                  onChangeText={setText}
                  multiline
                  maxLength={2000}
                />
                <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 19 }}>
                  Votre avis est visible par les autres clients avec votre prénom et l’initiale de votre nom.
                </Text>
                {send.error ? <ErrorText>{reviewErrorMessage(send.error.message)}</ErrorText> : null}
                <Button label="Publier mon avis" disabled={!canSubmitReview(rating, text, requestId)} loading={send.isPending} onPress={submit} />
                <Button label="Annuler" variant="outline" onPress={close} />
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  )
}
