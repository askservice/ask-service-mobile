import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { router, useLocalSearchParams } from 'expo-router'
import { useState, type ReactNode } from 'react'
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { closeRequest, useMeAction, useMyRequest } from '@/api/me'
import { StatusBadge } from '@/components/RequestCard'
import { TrackerBars } from '@/components/Tracker'
import { AcceptSheet } from '@/components/request/AcceptSheet'
import { QuoteCompareCard, REQUEST_REFRESH } from '@/components/request/QuoteCompareCard'
import { WaitingSteps } from '@/components/request/WaitingSteps'
import { Button, ErrorText, Field, IconButton, OptionButton, Text } from '@/components/ui'
import {
  CLOSE_REASONS,
  isOngoing,
  isPendingQuote,
  prosStepLabel,
  providerName,
  QUOTE_SORTS,
  quoteBadges,
  requestBadge,
  requestProgress,
  requestTitle,
  sentLabel,
  sortQuotesBy,
  type QuoteSort,
} from '@/lib/requests'
import type { MyRequest, Quote } from '@/lib/types'
import { colors, radius } from '@/theme'

// One request (lot A2, mockups A3-A6): where it stands, then by state
// - waiting for quotes: the 4 steps with hints;
// - quotes to compare: sort, badges, Accepter (bottom sheet), Écrire, « Ne pas retenir »;
// - a quote accepted: green banner, the chosen pro, the other quotes folded;
// then the request's answers and closing it.
export default function RequestDetail() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const request = useMyRequest(id)
  const r = request.data
  const place = r ? [r.city, r.pincode].filter(Boolean).join(' ') : ''

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 }}>
        <IconButton icon="arrow-back" label="Retour" onPress={() => router.back()} style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }} />
        <View style={{ flex: 1 }}>
          <Text weight="bold" numberOfLines={1} accessibilityRole="header" style={{ fontSize: 20 }}>{r ? requestTitle(r) : 'Demande'}</Text>
          {r ? <Text numberOfLines={1} style={{ fontSize: 13, color: colors.textMuted }}>{[place, sentLabel(r.createdAt)].filter(Boolean).join(' · ')}</Text> : null}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32, gap: 16 }}
        refreshControl={<RefreshControl refreshing={request.isRefetching} onRefresh={() => { request.refetch() }} tintColor={colors.primary} />}
      >
        {request.isLoading ? <ActivityIndicator color={colors.primary} style={{ paddingVertical: 32 }} /> : null}
        {request.error ? <ErrorText>Impossible de charger cette demande.</ErrorText> : null}
        {r ? <RequestBody request={r} /> : null}
      </ScrollView>
    </SafeAreaView>
  )
}

function RequestBody({ request: r }: { request: MyRequest }) {
  const [closing, setClosing] = useState(false)
  const [sort, setSort] = useState<QuoteSort>('price')
  const [accepting, setAccepting] = useState<Quote | null>(null)
  const progress = requestProgress(r)
  const quotes = (r.quotes ?? []).filter((q): q is Quote => Boolean(q) && q?.status !== 'WITHDRAWN')
  const pending = quotes.filter(isPendingQuote)
  const accepted = quotes.filter((q) => q.status === 'ACCEPTED')
  const declined = quotes.filter((q) => q.status === 'IGNORED')
  const badges = quoteBadges(pending)
  const tagOf = (q: Quote) => (badges.cheapest === q._id ? 'cheapest' : badges.earliest === q._id ? 'earliest' : undefined)
  const card = (q: Quote, editable: boolean, tag?: 'cheapest' | 'earliest') => (
    <QuoteCompareCard key={q._id} quote={q} requestId={r._id} editable={editable} tag={tag} onAccept={setAccepting} />
  )

  return (
    <>
      {progress.tone === 'closed' ? <StatusBadge badge={requestBadge(r)} /> : null}

      {progress.tone === 'waiting' ? <WaitingSteps request={r} /> : null}

      {progress.tone === 'action' ? (
        <>
          <View style={{ gap: 6 }}>
            <TrackerBars step={progress.step} label={progress.label} />
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>
              {[prosStepLabel(r.pros_contacted_count), `${pending.length} devis reçu${pending.length > 1 ? 's' : ''}`, 'à vous de choisir'].join(' · ')}
            </Text>
          </View>
          <Text weight="bold" accessibilityRole="header" style={{ fontSize: 17 }}>{progress.label}</Text>
          {pending.length > 1 ? (
            <View accessibilityLabel="Trier les devis" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {QUOTE_SORTS.map((o) => {
                const on = o.key === sort
                return (
                  <Pressable
                    key={o.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    onPress={() => setSort(o.key)}
                    style={{ height: 36, paddingHorizontal: 14, borderRadius: radius.pill, justifyContent: 'center', backgroundColor: on ? colors.text : colors.card, borderWidth: on ? 0 : 1, borderColor: colors.border }}
                  >
                    <Text weight={on ? 'bold' : 'semibold'} style={{ fontSize: 13, color: on ? colors.white : colors.text }}>{o.label}</Text>
                  </Pressable>
                )
              })}
            </View>
          ) : null}
          {sortQuotesBy(pending, sort).map((q) => card(q, true, tagOf(q)))}
        </>
      ) : null}

      {progress.tone === 'done' ? (
        <>
          <View style={{ gap: 6 }}>
            <TrackerBars step={4} label="Vous avez choisi votre professionnel" />
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>Vous avez choisi votre professionnel</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 12, padding: 16, borderRadius: radius.xl, backgroundColor: '#D1FAE5' }}>
            <MaterialIcons name="check-circle" size={22} color="#065F46" />
            <View style={{ flex: 1, gap: 3 }}>
              <Text weight="extrabold" style={{ fontSize: 16, color: '#065F46' }}>{accepted.length > 1 ? 'Devis acceptés' : 'Devis accepté'}</Text>
              <Text style={{ fontSize: 14, lineHeight: 20, color: '#065F46' }}>
                {accepted.length === 1
                  ? `${providerName(accepted[0])} est prévenu et vous recontacte pour fixer le rendez-vous.`
                  : 'Les professionnels choisis sont prévenus et vous recontactent pour fixer le rendez-vous.'}
              </Text>
            </View>
          </View>
          {accepted.map((q) => card(q, false))}
          {pending.length ? <Folded title={`Autres devis reçus (${pending.length})`}>{pending.map((q) => card(q, false))}</Folded> : null}
        </>
      ) : null}

      {progress.tone === 'closed' ? [...accepted, ...pending].map((q) => card(q, false)) : null}

      {declined.length ? <Folded title={`Devis non retenus (${declined.length})`}>{declined.map((q) => card(q, false))}</Folded> : null}

      <Recap request={r} />

      {isOngoing(r) ? (
        closing ? <CloseForm requestId={r._id} onDone={() => setClosing(false)} /> : (
          <Pressable accessibilityRole="button" onPress={() => setClosing(true)} style={{ alignSelf: 'center', padding: 12 }}>
            <Text weight="semibold" style={{ color: colors.textSecondary }}>Clôturer cette demande</Text>
          </Pressable>
        )
      ) : null}

      <AcceptSheet quote={accepting} requestId={r._id} onClose={() => setAccepting(null)} />
    </>
  )
}

/** Quotes kept out of the way (other quotes after a choice, quotes set aside). */
function Folded({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <View style={{ gap: 10 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        onPress={() => setOpen(!open)}
        style={{ minHeight: 52, paddingHorizontal: 16, borderRadius: radius.xl, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderSubtle, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <Text weight="bold">{title}</Text>
        <MaterialIcons name={open ? 'expand-less' : 'expand-more'} size={24} color={colors.textMuted} />
      </Pressable>
      {open ? children : null}
    </View>
  )
}

/** The request as sent: place and answers as chips, then the client's note. */
function Recap({ request: r }: { request: MyRequest }) {
  const chips = [[r.city, r.pincode].filter(Boolean).join(' '), ...(r.dynamic_answers ?? []).map((a) => a.value)].filter(Boolean)
  if (!chips.length && !r.note) return null
  return (
    <View style={{ gap: 8 }}>
      <Text weight="bold" accessibilityRole="header" style={{ fontSize: 16 }}>Votre demande</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {chips.map((chip, i) => (
          <View key={i} style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.borderSubtle, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 6 }}>
            <Text style={{ fontSize: 13, color: colors.textSecondary }}>{chip}</Text>
          </View>
        ))}
      </View>
      {r.note ? <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>{r.note}</Text> : null}
    </View>
  )
}

function CloseForm({ requestId, onDone }: { requestId: string; onDone: () => void }) {
  const close = useMeAction(closeRequest, REQUEST_REFRESH)
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
