import { useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native'

import { useMyRequests } from '@/api/me'
import { RequestCard } from '@/components/RequestCard'
import { SignInPrompt, TabScreen } from '@/components/TabScreen'
import { Button, ErrorText, Text } from '@/components/ui'
import { isOngoing } from '@/lib/requests'
import { useSession } from '@/state/session'
import { colors, radius } from '@/theme'

export default function MyRequests() {
  const { token } = useSession()
  return (
    <TabScreen active="demandes">
      {token ? (
        <RequestList />
      ) : (
        <SignInPrompt icon="assignment" title="Vos demandes" text="Connectez-vous avec l’e-mail de votre demande pour suivre vos devis." />
      )}
    </TabScreen>
  )
}

function RequestList() {
  const { data, isLoading, error, refetch, isRefetching } = useMyRequests()
  const [tab, setTab] = useState<'ongoing' | 'done'>('ongoing')
  const all = data?.data ?? []
  const ongoing = all.filter(isOngoing)
  const done = all.filter((r) => !isOngoing(r))
  const shown = tab === 'ongoing' ? ongoing : done

  return (
    <FlatList
      data={shown}
      keyExtractor={(r) => r._id}
      contentContainerStyle={{ padding: 20, gap: 10 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch() }} tintColor={colors.primary} />}
      ListHeaderComponent={(
        <View style={{ gap: 16, marginBottom: 8 }}>
          <Text weight="bold" accessibilityRole="header" style={{ fontSize: 28 }}>Mes demandes</Text>
          <View style={{ flexDirection: 'row', gap: 6, padding: 4, borderRadius: radius.md, backgroundColor: '#EEF1F6' }}>
            {([['ongoing', `En cours (${ongoing.length})`], ['done', 'Terminées']] as const).map(([key, label]) => (
              <Pressable
                key={key}
                accessibilityRole="tab"
                accessibilityState={{ selected: tab === key }}
                onPress={() => setTab(key)}
                style={{ flex: 1, height: 40, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: tab === key ? colors.card : 'transparent' }}
              >
                <Text weight={tab === key ? 'bold' : 'semibold'} style={{ color: tab === key ? colors.text : colors.textSecondary }}>{label}</Text>
              </Pressable>
            ))}
          </View>
          {isLoading ? <ActivityIndicator color={colors.primary} style={{ paddingVertical: 24 }} /> : null}
          {error ? (
            <View style={{ gap: 10 }}>
              <ErrorText>Impossible de charger vos demandes.</ErrorText>
              <Button label="Réessayer" variant="outline" onPress={() => refetch()} />
            </View>
          ) : null}
        </View>
      )}
      renderItem={({ item }) => <RequestCard request={item} />}
      ListEmptyComponent={!isLoading && !error ? (
        <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 24 }}>
          {tab === 'ongoing' ? 'Aucune demande en cours. Touchez « Demander » pour en faire une.' : 'Aucune demande terminée.'}
        </Text>
      ) : undefined}
    />
  )
}
