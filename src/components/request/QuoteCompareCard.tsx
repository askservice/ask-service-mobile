import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router } from 'expo-router'
import { Alert, Pressable, View } from 'react-native'

import { ignoreQuote, openChat, quoteAttachmentPath, useMeAction } from '@/api/me'
import { AttachmentRow } from '@/components/Attachment'
import { Button, ErrorText, IconButton, Text } from '@/components/ui'
import { initials, providerName, quoteAmount, quoteDatesLine } from '@/lib/requests'
import type { Quote } from '@/lib/types'
import { colors, radius } from '@/theme'

export const REQUEST_REFRESH = [['requests'], ['request'], ['chats']]

type Tag = 'cheapest' | 'earliest'
const TAGS: Record<Tag, { label: string; color: string; background: string }> = {
  cheapest: { label: 'Le moins cher', color: colors.primaryDark, background: colors.primaryDim },
  earliest: { label: 'Le plus tôt', color: '#7A3E06', background: colors.warningDim },
}

/**
 * A quote of the request page (mockups A4 / A6): price, start date and validity, message, joined
 * file. `editable`: Accepter + Écrire + « Ne pas retenir »; otherwise only « Écrire à … ».
 */
export function QuoteCompareCard({ quote: q, requestId, editable, tag, onAccept }: {
  quote: Quote
  requestId: string
  editable: boolean
  tag?: Tag
  onAccept?: (quote: Quote) => void
}) {
  const ignore = useMeAction(ignoreQuote, REQUEST_REFRESH)
  const chat = useMeAction(openChat, [['chats']])
  const name = providerName(q)
  const accepted = q.status === 'ACCEPTED'
  const ignored = q.status === 'IGNORED'
  const dates = quoteDatesLine(q)
  const failure = ignore.error ?? chat.error

  const confirmIgnore = () => Alert.alert(
    'Ne pas retenir ce devis ?',
    'Le prestataire ne pourra plus vous proposer ce devis.',
    [{ text: 'Annuler', style: 'cancel' }, { text: 'Ne pas retenir', style: 'destructive', onPress: () => ignore.mutate({ requestId, quoteId: q._id }) }],
  )
  const write = () => chat.mutate({ vendorId: q.vendor_id, quoteId: q._id }, {
    onSuccess: (c) => (c?._id ? router.push({ pathname: '/messages/[id]', params: { id: c._id, name } }) : router.push('/messages')),
  })

  return (
    <View style={{
      backgroundColor: colors.card,
      borderWidth: accepted || tag === 'cheapest' ? 2 : 1,
      borderColor: accepted ? colors.success : tag === 'cheapest' ? colors.primary : colors.borderSubtle,
      borderRadius: radius.xl,
      padding: 16,
      gap: 10,
      opacity: ignored ? 0.7 : 1,
    }}>
      {tag ? (
        <View style={{ alignSelf: 'flex-start', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: TAGS[tag].background }}>
          <Text weight="bold" style={{ fontSize: 12, color: TAGS[tag].color }}>{TAGS[tag].label}</Text>
        </View>
      ) : null}

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Text weight="bold" style={{ color: colors.white }}>{initials(name)}</Text>
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text weight="bold" style={{ fontSize: 16 }}>{name}</Text>
          <Text weight="semibold" style={{ fontSize: 13, color: colors.successDark }}>Professionnel vérifié</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text weight="extrabold" style={{ fontSize: 20 }}>{quoteAmount(q)}</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>TTC</Text>
        </View>
      </View>

      {dates ? <Text style={{ fontSize: 13, color: colors.textSecondary }}>{dates}</Text> : null}
      {q.service_description ? <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>{q.service_description}</Text> : null}
      {q.has_attachment ? <AttachmentRow label="Devis joint" path={quoteAttachmentPath(requestId, q._id)} /> : null}
      {ignored ? <Text weight="semibold" style={{ color: colors.textMuted }}>Non retenu</Text> : null}

      {editable && !ignored && !accepted ? (
        <>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button label="Accepter" onPress={() => onAccept?.(q)} style={{ flex: 1, height: 46 }} />
            <IconButton
              icon="chat-bubble-outline"
              label={`Écrire à ${name}`}
              onPress={write}
              style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
            />
          </View>
          <Pressable accessibilityRole="button" onPress={confirmIgnore} disabled={ignore.isPending} style={{ alignSelf: 'center', minHeight: 40, justifyContent: 'center', paddingHorizontal: 12 }}>
            <Text weight="semibold" style={{ color: colors.textSecondary }}>{ignore.isPending ? 'Un instant…' : 'Ne pas retenir'}</Text>
          </Pressable>
        </>
      ) : (
        <Pressable
          accessibilityRole="button"
          onPress={write}
          disabled={chat.isPending}
          style={({ pressed }) => ({
            minHeight: 48,
            borderRadius: 13,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            backgroundColor: accepted ? colors.primary : colors.card,
            borderWidth: accepted ? 0 : 1,
            borderColor: colors.border,
            opacity: pressed || chat.isPending ? 0.8 : 1,
          })}
        >
          <MaterialIcons name="chat-bubble-outline" size={20} color={accepted ? colors.white : colors.text} />
          <Text weight="bold" style={{ color: accepted ? colors.white : colors.text }}>{`Écrire à ${name}`}</Text>
        </Pressable>
      )}
      {failure ? <ErrorText>{failure.message}</ErrorText> : null}
    </View>
  )
}
