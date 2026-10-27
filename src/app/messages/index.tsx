import { router } from 'expo-router'
import { ActivityIndicator, FlatList, Pressable, RefreshControl, View } from 'react-native'

import { useChats } from '@/api/me'
import { SignInPrompt, TabScreen } from '@/components/TabScreen'
import { Button, ErrorText, Text } from '@/components/ui'
import { chatPartnerName, initials, shortTime } from '@/lib/requests'
import type { Chat } from '@/lib/types'
import { useSession } from '@/state/session'
import { colors, radius } from '@/theme'

export default function Conversations() {
  const { token } = useSession()
  return (
    <TabScreen active="messages">
      {token ? (
        <ChatList />
      ) : (
        <SignInPrompt icon="chat-bubble-outline" title="Vos messages" text="Connectez-vous pour échanger avec les professionnels qui ont répondu à vos demandes." />
      )}
    </TabScreen>
  )
}

function ChatList() {
  const { data, isLoading, error, refetch, isRefetching } = useChats()
  const chats = [...(data ?? [])].sort((a, b) => Date.parse(b.latestMessage?.createdAt ?? b.updatedAt) - Date.parse(a.latestMessage?.createdAt ?? a.updatedAt))

  return (
    <FlatList
      data={chats}
      keyExtractor={(c) => c._id}
      contentContainerStyle={{ padding: 20, gap: 8 }}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => { refetch() }} tintColor={colors.primary} />}
      ListHeaderComponent={(
        <View style={{ gap: 12, marginBottom: 8 }}>
          <Text weight="bold" accessibilityRole="header" style={{ fontSize: 28 }}>Messages</Text>
          {isLoading ? <ActivityIndicator color={colors.primary} style={{ paddingVertical: 24 }} /> : null}
          {error ? (
            <View style={{ gap: 10 }}>
              <ErrorText>Impossible de charger vos messages.</ErrorText>
              <Button label="Réessayer" variant="outline" onPress={() => refetch()} />
            </View>
          ) : null}
        </View>
      )}
      renderItem={({ item }) => <ChatRow chat={item} />}
      ListEmptyComponent={!isLoading && !error ? (
        <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 24 }}>
          Pas encore de conversation. Depuis un devis, touchez l’icône de message pour écrire au professionnel.
        </Text>
      ) : undefined}
    />
  )
}

function ChatRow({ chat }: { chat: Chat }) {
  const name = chatPartnerName(chat)
  const unread = chat.unreadCount ?? 0
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/messages/[id]', params: { id: chat._id, name } })}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, backgroundColor: pressed ? colors.primaryDim : colors.card, borderWidth: 1, borderColor: colors.borderSubtle })}
    >
      <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
        <Text weight="bold" style={{ color: colors.white }}>{initials(name)}</Text>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
          <Text weight="bold" numberOfLines={1} style={{ flex: 1, fontSize: 16 }}>{name}</Text>
          <Text style={{ fontSize: 12, color: colors.textMuted }}>{shortTime(chat.latestMessage?.createdAt ?? chat.updatedAt)}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text numberOfLines={1} weight={unread ? 'semibold' : 'regular'} style={{ flex: 1, fontSize: 14, color: unread ? colors.text : colors.textMuted }}>
            {chat.latestMessage?.content || 'Nouvelle conversation'}
          </Text>
          {unread ? (
            <View style={{ minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Text weight="bold" style={{ fontSize: 12, color: colors.white }}>{String(unread)}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  )
}
