import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { acceptQuote, closeRequest, ignoreQuote, openChat, useMeAction, useMyRequest } from '@/api/me'
import { StatusBadge } from '@/components/RequestCard'
import { Button, ErrorText, Field, IconButton, OptionButton, Text } from '@/components/ui'
import { CLOSE_REASONS, initials, isOngoing, providerName, quotePrice, requestBadge, requestTitle, sentLabel, sortQuotes } from '@/lib/requests'
import type { Quote } from '@/lib/types'
import { colors, radius } from '@/theme'

const REFRESH = [['requests'], ['request'], ['chats']]

// One request: its answers, the quotes received (accept, refuse, write to the provider) and closing it.
export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const request = useMyRequest(id)
  const [closing, setClosing] = useState(false)
  const r = request.data
  // The request comes with all its quotes (accepted and refused ones too).
  const list = sortQuotes((r?.quotes ?? []).filter((q): q is Quote => Boolean(q) && q?.status !== 'WITHDRAWN'))
  const sent = list.filter((q) => q.status !== 'IGNORED').length


  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
        <IconButton icon="arrow-back" label="Retour" onPress={() => router.back()} style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }} />
        <Text weight="bold" numberOfLines={1} style={{ fontSize: 20, flex: 1 }}>{r ? requestTitle(r) : 'Demande'}</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 16 }}
        refreshControl={<RefreshControl refreshing={request.isRefetching} onRefresh={() => { request.refetch() }} tintColor={colors.primary} />}
      >
        {request.isLoading ? <ActivityIndicator color={colors.primary} style={{ paddingVertical: 32 }} /> : null}
        {request.error ? <ErrorText>Impossible de charger cette demande.</ErrorText> : null}

        {r ? (
          <>
            <View style={{ gap: 10 }}>
              <StatusBadge badge={requestBadge(r)} />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {[[r.city, r.pincode].filter(Boolean).join(' '), sentLabel(r.createdAt), ...(r.dynamic_answers ?? []).map((a) => a.value)]
                  .filter(Boolean)
                  .map((chip, i) => (
                    <View key={i} style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 6 }}>
                      <Text style={{ fontSize: 13, color: colors.textSecondary }}>{chip}</Text>
                    </View>
                  ))}
              </View>
              {r.note ? <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>{r.note}</Text> : null}
              {r.accepted_quote_message ? (
                <View style={{ flexDirection: 'row', gap: 10, padding: 14, borderRadius: radius.md, backgroundColor: '#D1FAE5' }}>
                  <MaterialIcons name="check-circle" size={20} color={colors.successDark} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text weight="bold" style={{ color: colors.successDark }}>{r.accepted_quote_message}</Text>
                    {r.accepted_quote_sub_message ? <Text style={{ color: colors.successDark, fontSize: 13 }}>{r.accepted_quote_sub_message}</Text> : null}
                  </View>
                </View>
              ) : null}
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Text weight="bold" style={{ fontSize: 17 }}>{`Devis reçus (${sent})`}</Text>
              {isOngoing(r) && sent < 3 ? <Text style={{ fontSize: 13, color: colors.textMuted }}>{`${3 - sent} place${3 - sent > 1 ? 's' : ''} restante${3 - sent > 1 ? 's' : ''} sur 3`}</Text> : null}
            </View>

            {list.length === 0 ? (
              <Text style={{ color: colors.textMuted }}>Pas encore de devis. Vous êtes prévenu dès qu’un professionnel répond.</Text>
            ) : null}
            {list.map((q) => <QuoteCard key={q._id} quote={q} requestId={r._id} editable={isOngoing(r) && r.quotes_status !== 'accepted'} />)}

            {isOngoing(r) ? (
              closing ? <CloseForm requestId={r._id} onDone={() => setClosing(false)} /> : (
                <Pressable accessibilityRole="button" onPress={() => setClosing(true)} style={{ alignSelf: 'center', padding: 12 }}>
                  <Text weight="semibold" style={{ color: colors.textSecondary }}>Clôturer cette demande</Text>
                </Pressable>
              )
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

function QuoteCard({ quote: q, requestId, editable }: { quote: Quote; requestId: string; editable: boolean }) {
  const accept = useMeAction(acceptQuote, REFRESH)
  const ignore = useMeAction(ignoreQuote, REFRESH)
  const chat = useMeAction(openChat, [['chats']])
  const name = providerName(q)
  const accepted = q.status === 'ACCEPTED'
  const ignored = q.status === 'IGNORED'
  const failure = accept.error ?? ignore.error ?? chat.error

  const confirmAccept = () => Alert.alert(
    'Accepter ce devis ?',
    `${name} sera prévenu et recevra vos coordonnées.`,
    [{ text: 'Annuler', style: 'cancel' }, { text: 'Accepter', onPress: () => accept.mutate({ requestId, quoteId: q._id }) }],
  )
  const confirmIgnore = () => Alert.alert(
    'Refuser ce devis ?',
    'Le prestataire ne pourra plus vous proposer ce devis.',
    [{ text: 'Annuler', style: 'cancel' }, { text: 'Refuser', style: 'destructive', onPress: () => ignore.mutate({ requestId, quoteId: q._id }) }],
  )
  const write = () => chat.mutate({ vendorId: q.vendor_id, quoteId: q._id }, {
    onSuccess: (c) => (c?._id ? router.push({ pathname: '/messages/[id]', params: { id: c._id, name } }) : router.push('/messages')),
  })

  return (
    <View style={{ backgroundColor: colors.card, borderWidth: accepted ? 2 : 1, borderColor: accepted ? colors.success : colors.borderSubtle, borderRadius: radius.xl, padding: 16, gap: 12, opacity: ignored ? 0.6 : 1 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Text weight="bold" style={{ color: colors.white }}>{initials(name)}</Text>
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text weight="bold" style={{ fontSize: 16 }}>{name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            {q.rating ? (
              <>
                <MaterialIcons name="star" size={15} color="#F59E0B" />
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>{`${String(q.rating).replace('.', ',')} (${q.reviews_count ?? 0} avis)`}</Text>
              </>
            ) : <Text style={{ fontSize: 13, color: colors.textSecondary }}>Nouveau sur Ask Service</Text>}
            <MaterialIcons name="verified-user" size={14} color={colors.successDark} />
            <Text weight="semibold" style={{ fontSize: 13, color: colors.successDark }}>Vérifié</Text>
          </View>
        </View>
        <Text weight="extrabold" style={{ fontSize: 17 }}>{quotePrice(q)}</Text>
      </View>
      {q.service_description ? <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>{q.service_description}</Text> : null}
      {accepted ? <Text weight="bold" style={{ color: colors.successDark }}>Devis accepté</Text> : null}
      {ignored ? <Text weight="semibold" style={{ color: colors.textMuted }}>Devis refusé</Text> : null}

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {editable && !ignored ? (
          <>
            <Button label="Accepter" onPress={confirmAccept} loading={accept.isPending} style={{ flex: 1, height: 46 }} />
            <Button label="Refuser" variant="outline" onPress={confirmIgnore} loading={ignore.isPending} style={{ flex: 1, height: 46 }} />
          </>
        ) : null}
        <IconButton
          icon="chat-bubble-outline"
          label={`Écrire à ${name}`}
          onPress={write}
          style={{ width: 46, height: 46, borderRadius: 13, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, ...(editable && !ignored ? {} : { flex: 1 }) }}
        />
      </View>
      {failure ? <ErrorText>{failure.message}</ErrorText> : null}
    </View>
  )
}

function CloseForm({ requestId, onDone }: { requestId: string; onDone: () => void }) {
  const close = useMeAction(closeRequest, REFRESH)
  const [reason, setReason] = useState<string | null>(null)
  const [comment, setComment] = useState('')
  const needsComment = reason === 'Other reason'

  return (
    <View style={{ gap: 10, backgroundColor: colors.card, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSubtle, padding: 16 }}>
      <Text weight="bold" style={{ fontSize: 16 }}>Pourquoi clôturer cette demande ?</Text>
      {CLOSE_REASONS.map((r) => <OptionButton key={r.key} label={r.label} selected={reason === r.key} onPress={() => setReason(r.key)} />)}
      {needsComment ? <Field label="Précisez" value={comment} onChangeText={setComment} multiline /> : null}
      {close.error ? <ErrorText>{close.error.message}</ErrorText> : null}
      <Button
        label="Clôturer la demande"
        disabled={!reason || (needsComment && !comment.trim())}
        loading={close.isPending}
        onPress={() => reason && close.mutate({ id: requestId, reason, comment: comment.trim() }, { onSuccess: onDone })}
      />
      <Button label="Annuler" variant="outline" onPress={onDone} />
    </View>
  )
}
