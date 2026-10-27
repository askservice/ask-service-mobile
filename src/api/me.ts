import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import type { ProfileUpdate } from '@/lib/profile'
import type { Chat, Message, MyRequest, NotificationPrefs, Profile } from '@/lib/types'
import { useSession } from '@/state/session'

import { ApiError, apiGet, apiSend } from './client'

// Data of the signed-in client. Every key starts with "me" (cleared at sign-out); an expired
// session (401) signs the client out.

function useMe<T>(key: unknown[], path: string, options: { enabled?: boolean; refetchInterval?: number } = {}) {
  const { token, signOut } = useSession()
  const query = useQuery({
    queryKey: ['me', ...key],
    queryFn: () => apiGet<T>(path, token),
    enabled: Boolean(token) && options.enabled !== false,
    refetchInterval: options.refetchInterval,
    retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 1,
  })
  useEffect(() => {
    if (query.error instanceof ApiError && query.error.status === 401) signOut()
  }, [query.error, signOut])
  return query
}

export const useProfile = () => useMe<Profile>(['profile'], '/user/get-profile')

export const useMyRequests = () =>
  useMe<{ data?: MyRequest[] | null }>(['requests'], '/user/get-created-services?page=1&limit=50&sort=most_recent')

export const useMyRequest = (id: string) => useMe<MyRequest>(['request', id], `/user/get-created-services/${id}`)

export const useChats = () => useMe<Chat[]>(['chats'], '/user/fetch-chats', { refetchInterval: 30_000 })

export const useMessages = (chatId: string) =>
  useMe<{ messages?: Message[] | null }>(['messages', chatId], `/user/all-messages/${chatId}?index=1&limit=50`)

export const useNotificationPrefs = () => useMe<NotificationPrefs>(['notification-prefs'], '/user/notification')

/** Action of the signed-in client, then the given cached data is fetched again. */
export function useMeAction<A, R>(run: (token: string | null, args: A) => Promise<R>, refresh: unknown[][] = []) {
  const { token } = useSession()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (args: A) => run(token, args),
    onSuccess: () => Promise.all(refresh.map((key) => queryClient.invalidateQueries({ queryKey: ['me', ...key] }))),
  })
}

export const acceptQuote = (token: string | null, { requestId, quoteId }: { requestId: string; quoteId: string }) =>
  apiSend(`/user/service-requests/${requestId}/quotes/${quoteId}/accept`, 'POST', token)

export const ignoreQuote = (token: string | null, { requestId, quoteId }: { requestId: string; quoteId: string }) =>
  apiSend(`/user/service-requests/${requestId}/quotes/${quoteId}/ignore`, 'POST', token)

export const closeRequest = (token: string | null, { id, reason, comment }: { id: string; reason: string; comment: string }) =>
  apiSend(`/user/close-service-request/${id}`, 'PUT', token, { reason, reason_comment: comment })

/** Conversation with the provider of a quote (created by the API when it does not exist yet). */
export const openChat = (token: string | null, { vendorId, quoteId }: { vendorId: string; quoteId: string }) =>
  apiSend<{ _id: string }>('/user/access-chat', 'POST', token, { userId: vendorId, quote_id: quoteId })

export const sendMessage = (token: string | null, { chatId, content }: { chatId: string; content: string }) =>
  apiSend<Message>('/user/send-msg', 'POST', token, { chatId, content, media: '' })

export const saveNotificationPrefs = (token: string | null, prefs: NotificationPrefs) =>
  apiSend('/user/notification', 'PUT', token, prefs)

export const deleteAccount = (token: string | null, reason: string) => apiSend('/user/delete-account', 'PUT', token, { reason })

/** phone_otp_sent: set when the phone changed, false when no SMS could be sent yet. */
export const updateProfile = (token: string | null, body: ProfileUpdate) =>
  apiSend<{ phone_otp_sent?: boolean }>('/user/update-profile', 'PUT', token, body)
