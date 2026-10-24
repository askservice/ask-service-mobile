import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useState } from 'react'
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, Pressable, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { sendMessage, useMessages, useProfile } from '@/api/me'
import { useChatSocket } from '@/api/socket'
import { ErrorText, IconButton, Text } from '@/components/ui'
import { initials, shortTime } from '@/lib/requests'
import type { Message } from '@/lib/types'
import { useSession } from '@/state/session'
import { colors, fonts, radius } from '@/theme'

// One conversation with a provider: the last 50 messages (newest at the bottom), live updates.
export default function Conversation() {
  const { id, name = 'Prestataire' } = useLocalSearchParams<{ id: string; name?: string }>()
  const { token } = useSession()
  const queryClient = useQueryClient()
  const profile = useProfile()
  const { data, isLoading, error } = useMessages(id)
  const [draft, setDraft] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  // Newest first in the cache (the API order), the list is drawn upside down.
  const add = useCallback((m: Message) => {
    queryClient.setQueryData<{ messages?: Message[] | null }>(['me', 'messages', id], (old) => {
      const list = old?.messages ?? []
      return list.some((x) => x._id === m._id) ? old : { ...old, messages: [m, ...list] }
    })
    queryClient.invalidateQueries({ queryKey: ['me', 'chats'] })
  }, [queryClient, id])

  const announce = useChatSocket(id, add)
  const myId = profile.data?._id

  const send = async () => {
    const content = draft.trim()
    if (!content || sending) return
    setSending(true)
    setSendError(null)
    setDraft('')
    try {
      const message = await sendMessage(token, { chatId: id, content })
      if (message?._id) {
        add(message)
        announce(message)
      }
    } catch (e) {
      setDraft(content)
      setSendError((e as Error).message || 'Le message n’a pas pu être envoyé.')
    } finally {
      setSending(false)
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}>
        <IconButton icon="arrow-back" label="Retour" onPress={() => router.back()} />
        <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Text weight="bold" style={{ color: colors.white, fontSize: 14 }}>{initials(name)}</Text>
        </View>
        <Text weight="bold" numberOfLines={1} style={{ flex: 1, fontSize: 16 }}>{name}</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {isLoading ? <ActivityIndicator color={colors.primary} style={{ flex: 1 }} /> : null}
        {error ? <View style={{ padding: 20 }}><ErrorText>Impossible de charger la conversation.</ErrorText></View> : null}
        {data ? (
          <FlatList
            inverted
            data={data.messages ?? []}
            keyExtractor={(m) => m._id}
            contentContainerStyle={{ padding: 16, gap: 8 }}
            renderItem={({ item }) => <Bubble message={item} mine={item.sender?._id === myId} />}
            ListEmptyComponent={<Text style={{ color: colors.textMuted, textAlign: 'center', transform: [{ scaleY: -1 }] }}>Écrivez votre premier message.</Text>}
          />
        ) : <View style={{ flex: 1 }} />}

        {sendError ? <View style={{ paddingHorizontal: 16 }}><ErrorText>{sendError}</ErrorText></View> : null}
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Écrire un message"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Message"
            multiline
            style={{ flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, fontFamily: fonts.regular, fontSize: 15, color: colors.text }}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Envoyer"
            onPress={send}
            disabled={!draft.trim() || sending}
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: !draft.trim() || sending ? 0.5 : 1 }}
          >
            <MaterialIcons name="send" size={20} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

function Bubble({ message, mine }: { message: Message; mine: boolean }) {
  return (
    <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%', gap: 3 }}>
      <View
        style={{
          backgroundColor: mine ? colors.primary : colors.card,
          borderWidth: mine ? 0 : 1,
          borderColor: colors.borderSubtle,
          borderRadius: radius.xl,
          borderBottomRightRadius: mine ? 6 : radius.xl,
          borderBottomLeftRadius: mine ? radius.xl : 6,
          paddingHorizontal: 14,
          paddingVertical: 10,
        }}
      >
        <Text style={{ fontSize: 15, lineHeight: 21, color: mine ? colors.white : colors.text }}>
          {message.content || (message.media_url ? 'Pièce jointe (à ouvrir sur askservice.fr)' : '')}
        </Text>
      </View>
      <Text style={{ fontSize: 11, color: colors.textMuted, alignSelf: mine ? 'flex-end' : 'flex-start' }}>{shortTime(message.createdAt)}</Text>
    </View>
  )
}
