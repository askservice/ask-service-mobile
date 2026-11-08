import { useState } from 'react'
import { Modal, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { acceptQuote, useMeAction } from '@/api/me'
import { Button, ErrorText, Text } from '@/components/ui'
import { dayMonth, providerName, quotePrice, quoteValidUntil } from '@/lib/requests'
import type { Quote } from '@/lib/types'
import { colors, radius } from '@/theme'

import { REQUEST_REFRESH } from './QuoteCompareCard'

/** Confirmation of a quote from the bottom of the screen (mockup A5), instead of a plain alert. */
export function AcceptSheet({ quote: asked, requestId, onClose }: { quote: Quote | null; requestId: string; onClose: () => void }) {
  // Last quote asked, kept while the sheet slides down (its text would empty otherwise).
  const [quote, setQuote] = useState(asked)
  if (asked && asked !== quote) setQuote(asked)
  const insets = useSafeAreaInsets()
  const accept = useMeAction(acceptQuote, REQUEST_REFRESH)
  const close = () => {
    if (accept.isPending) return
    accept.reset()
    onClose()
  }
  const name = quote ? providerName(quote) : ''
  const until = quote ? quoteValidUntil(quote) : null
  const rows = quote
    ? [
        ['Montant', quotePrice(quote)],
        ...(quote.available_start_date ? [['Intervention dès le', dayMonth(quote.available_start_date, true)]] : []),
        ...(until ? [['Valable jusqu’au', dayMonth(until, true)]] : []),
      ]
    : []

  return (
    <Modal visible={Boolean(asked)} transparent animationType="slide" statusBarTranslucent onRequestClose={close}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable accessibilityLabel="Fermer" onPress={close} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(35,30,45,0.45)' }} />
        <View
          accessibilityViewIsModal
          style={{ backgroundColor: colors.card, borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 16) + 18, gap: 18 }}
        >
          <View style={{ alignSelf: 'center', width: 40, height: 5, borderRadius: 3, backgroundColor: colors.border }} />
          <View style={{ gap: 6 }}>
            <Text weight="extrabold" accessibilityRole="header" style={{ fontSize: 22 }}>{`Accepter le devis de ${name} ?`}</Text>
            <Text style={{ color: colors.textSecondary, lineHeight: 21 }}>Le professionnel est prévenu tout de suite et vous recontacte pour organiser l’intervention.</Text>
          </View>
          <View style={{ borderRadius: radius.lg, backgroundColor: colors.primaryDim, paddingHorizontal: 16, paddingVertical: 14, gap: 8 }}>
            {rows.map(([label, value], i) => (
              <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
                <Text style={{ color: '#1E2B57' }}>{label}</Text>
                <Text weight={i === 0 ? 'extrabold' : 'bold'}>{value}</Text>
              </View>
            ))}
          </View>
          {accept.error ? <ErrorText>{accept.error.message}</ErrorText> : null}
          <View style={{ gap: 8 }}>
            <Button
              label="Oui, j’accepte ce devis"
              loading={accept.isPending}
              onPress={() => quote && accept.mutate({ requestId, quoteId: quote._id }, { onSuccess: onClose })}
            />
            <Pressable accessibilityRole="button" onPress={close} style={{ height: 48, alignItems: 'center', justifyContent: 'center' }}>
              <Text weight="semibold">Annuler</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  )
}
