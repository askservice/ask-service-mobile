import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import { useQueryClient } from '@tanstack/react-query'
import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Linking, Platform, Pressable, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { sendAttachment, sendMessage, useChats, useMessages, useProfile } from '@/api/me'
import { AttachmentPreview, AttachmentSheet, type AttachmentSource } from '@/components/AttachmentSheet'
import { Avatar } from '@/components/Avatar'
import { ChatSafetySheet } from '@/components/ChatSafetySheet'
import { AttachmentRow, AttachmentImage } from '@/components/Attachment'
import { ErrorText, IconButton, Text } from '@/components/ui'
import { attachmentProblem, type PickedFile } from '@/lib/attachments'
import { attachment, blockedNotice, chatBlock, chatRequestLabel, withMessage } from '@/lib/chat'
import { chatPartner, shortTime } from '@/lib/requests'
import type { Chat, Message } from '@/lib/types'
import { KEYBOARD_BEHAVIOR } from '@/lib/keyboard'
import { chooseDocument, choosePhoto, PickerPermissionError, takePhoto } from '@/lib/pickAttachment'
import { useLive } from '@/state/live'
import { useSession } from '@/state/session'
import { colors, fonts, radius } from '@/theme'

// One conversation with a provider: the last 50 messages (newest at the bottom), live updates.
export default function Conversation() {
  const { id, name = 'Prestataire' } = useLocalSearchParams<{ id: string; name?: string }>()
  const { token } = useSession()
  const queryClient = useQueryClient()
  const profile = useProfile()
  const { data, isLoading, error, dataUpdatedAt } = useMessages(id)
  const chat = useChats().data?.find((c) => c._id === id)
  const partnerId = chat ? chatPartner(chat)?._id : undefined
  const request = chatRequestLabel(chat)
  const { online, joinChat, announce } = useLive()
  const isOnline = Boolean(partnerId && online.has(partnerId))
  const [draft, setDraft] = useState('')
  const [sendError, setSendError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [safetyOpen, setSafetyOpen] = useState(false)
  const [attachOpen, setAttachOpen] = useState(false)
  const [file, setFile] = useState<PickedFile | null>(null)
  const block = chatBlock(chat)
  const notice = blockedNotice(block, name)

  // Newest first in the cache (the API order), the list is drawn upside down. Messages of the
  // other side arrive through LiveProvider.
  const add = useCallback((m: Message) => {
    queryClient.setQueryData<{ messages?: Message[] | null }>(['me', 'messages', id], (old) => ({ ...old, messages: withMessage(old?.messages, m) }))
    queryClient.invalidateQueries({ queryKey: ['me', 'chats'] })
  }, [queryClient, id])

  useEffect(() => joinChat(id), [joinChat, id])

  // Each load of the messages marks them read on the API (all-messages): the list shows it at once.
  useEffect(() => {
    if (!dataUpdatedAt) return
    queryClient.setQueryData<Chat[]>(['me', 'chats'], (old) => old?.map((c) => (c._id === id ? { ...c, unreadCount: 0 } : c)))
    queryClient.invalidateQueries({ queryKey: ['me', 'chats'] })
  }, [dataUpdatedAt, queryClient, id])
  const myId = profile.data?._id

  const canSend = Boolean(draft.trim() || file) && !sending

  const send = async () => {
    const content = draft.trim()
    if ((!content && !file) || sending) return
    const joined = file
    setSending(true)
    setSendError(null)
    setDraft('')
    try {
      const message = joined
        ? await sendAttachment(token, { chatId: id, content, file: joined })
        : await sendMessage(token, { chatId: id, content })
      if (joined) setFile(null)
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

  // The picker opens once the sheet has slid down (iOS cannot show both at once).
  const pick = (source: AttachmentSource) => {
    setAttachOpen(false)
    setTimeout(async () => {
      try {
        const picked = source === 'camera' ? await takePhoto() : source === 'library' ? await choosePhoto() : await chooseDocument()
        if (!picked) return
        const problem = attachmentProblem(picked)
        setSendError(problem)
        if (!problem) setFile(picked)
      } catch (e) {
        if (e instanceof PickerPermissionError) {
          Alert.alert('Appareil photo', e.message, [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Ouvrir les réglages', onPress: () => Linking.openSettings() },
          ])
        } else {
          setSendError('Le fichier n’a pas pu être ajouté. Réessayez.')
        }
      }
    }, Platform.OS === 'ios' ? 450 : 50)
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle }}>
        <IconButton icon="arrow-back" label="Retour" onPress={() => router.back()} />
        <Avatar name={name} size={40} online={isOnline} />
        <View style={{ flex: 1, gap: 1 }}>
          <Text weight="bold" numberOfLines={1} style={{ fontSize: 16 }}>{name}</Text>
          {isOnline ? <Text style={{ fontSize: 12, color: colors.successDark }}>En ligne</Text> : null}
        </View>
        {partnerId ? <IconButton icon="more-vert" label="Signaler ou bloquer" onPress={() => setSafetyOpen(true)} /> : null}
      </View>
      {request ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, backgroundColor: colors.primaryDim }}>
          <MaterialIcons name="description" size={16} color={colors.primaryDark} />
          <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, color: colors.primaryDark }}>
            Demande : <Text weight="semibold" style={{ fontSize: 13, color: colors.primaryDark }}>{request}</Text>
          </Text>
        </View>
      ) : null}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={KEYBOARD_BEHAVIOR}>
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
        {notice ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
            <MaterialIcons name="block" size={20} color={colors.textMuted} />
            <Text style={{ flex: 1, fontSize: 14, color: colors.textSecondary, lineHeight: 20 }}>{notice}</Text>
            {block === 'byMe' ? (
              <Pressable accessibilityRole="button" onPress={() => setSafetyOpen(true)} hitSlop={8}>
                <Text weight="bold" style={{ color: colors.primary }}>Débloquer</Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <View style={{ gap: 8, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: colors.card, borderTopWidth: 1, borderTopColor: colors.borderSubtle }}>
            {file ? <AttachmentPreview file={file} onRemove={() => setFile(null)} disabled={sending} /> : null}
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Joindre un fichier"
                onPress={() => setAttachOpen(true)}
                disabled={sending}
                hitSlop={4}
                style={({ pressed }) => ({ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', opacity: sending ? 0.4 : pressed ? 0.6 : 1 })}
              >
                <MaterialIcons name="attach-file" size={24} color={colors.textSecondary} />
              </Pressable>
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={file ? 'Ajouter un message (facultatif)' : 'Écrire un message'}
                placeholderTextColor={colors.textMuted}
                accessibilityLabel="Message"
                multiline
                style={{ flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 16, paddingTop: 11, paddingBottom: 11, fontFamily: fonts.regular, fontSize: 15, color: colors.text }}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Envoyer"
                onPress={send}
                disabled={!canSend}
                style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', opacity: canSend ? 1 : 0.5 }}
              >
                {sending ? <ActivityIndicator size="small" color={colors.white} /> : <MaterialIcons name="send" size={20} color={colors.white} />}
              </Pressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
      <AttachmentSheet open={attachOpen} onClose={() => setAttachOpen(false)} onChoose={pick} />
      <ChatSafetySheet
        open={safetyOpen}
        onClose={() => setSafetyOpen(false)}
        chatId={id}
        partnerId={partnerId}
        name={name}
        blockedByMe={block === 'byMe'}
      />
    </SafeAreaView>
  )
}

function Bubble({ message, mine }: { message: Message; mine: boolean }) {
  const file = attachment(message)
  return (
    <View style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%', gap: 3 }}>
      {file?.kind === 'image' ? <AttachmentImage path={file.path} /> : null}
      {file && file.kind !== 'image' ? <AttachmentRow label={file.label} path={file.path} /> : null}
      {message.content || !file ? (
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
            {message.content || (message.media_url ? 'Pièce jointe' : '')}
          </Text>
        </View>
      ) : null}
      <Text style={{ fontSize: 11, color: colors.textMuted, alignSelf: mine ? 'flex-end' : 'flex-start' }}>{shortTime(message.createdAt)}</Text>
    </View>
  )
}
