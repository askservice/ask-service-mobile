import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AppState, type AppStateStatus } from 'react-native'
import { io, type Socket } from 'socket.io-client'

import { API_URL } from '@/config'
import { messageChatId, withMessage } from '@/lib/chat'
import type { Message } from '@/lib/types'

import { useSession } from './session'

// Real time for the whole app (backend src/socket/chatSocket.js), like the website: one socket
// while the client is signed in and the app is in the foreground. The server sends the other
// side's messages to the client's own room ("message recieved" is spelled that way there) and
// tells who is online among the people the client talks with.

const RECEIVED = ['message recieved', 'message received']

// Only "background" closes the socket: at launch Android may report "unknown" (or nothing) before
// the first change, and iOS goes "inactive" for a moment (notification centre, app switcher).
export const isForeground = (state: AppStateStatus | string | null | undefined) => state !== 'background'

const debug = (...args: unknown[]) => {
  if (__DEV__) console.log('[live]', ...args)
}

type Live = {
  online: ReadonlySet<string>
  /** Joins the conversation's room (typing, read receipts of the website); returns the leave function. */
  joinChat: (chatId: string) => () => void
  /** The server relays a message saved with send-msg to the other members of the chat. */
  announce: (message: Message) => void
}

const LiveContext = createContext<Live>({ online: new Set(), joinChat: () => () => {}, announce: () => {} })

export function LiveProvider({ children }: { children: ReactNode }) {
  const { token } = useSession()
  const queryClient = useQueryClient()
  const socket = useRef<Socket | null>(null)
  const openChat = useRef<string | null>(null)
  const [online, setOnline] = useState<ReadonlySet<string>>(new Set())
  const [active, setActive] = useState(isForeground(AppState.currentState))

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => setActive(isForeground(state)))
    return () => sub.remove()
  }, [])

  useEffect(() => {
    if (!token || !active) { debug('no socket', { signedIn: Boolean(token), active }); return }
    const s = io(API_URL, { transports: ['websocket'], auth: { token } })
    socket.current = s
    debug('connecting to', API_URL)

    s.on('connect_error', (e) => debug('connect_error', e.message))
    s.on('disconnect', (reason) => debug('disconnected', reason))
    s.on('connect', () => {
      debug('connected', s.id)
      s.emit('setup', {})
      if (openChat.current) s.emit('join chat', openChat.current)
      // Messages may have arrived while disconnected (app in background, network loss).
      queryClient.invalidateQueries({ queryKey: ['me', 'chats'] })
      queryClient.invalidateQueries({ queryKey: ['me', 'messages'] })
    })
    s.on('online:users', (ids: string[]) => setOnline(new Set(ids)))
    s.on('user:online', (id: string) => setOnline((prev) => new Set(prev).add(id)))
    s.on('user:offline', (id: string) => setOnline((prev) => {
      const next = new Set(prev)
      next.delete(id)
      return next
    }))
    const received = (m: Message) => {
      const chatId = messageChatId(m)
      debug('message received in', chatId)
      if (!chatId) return
      queryClient.setQueryData<{ messages?: Message[] | null }>(['me', 'messages', chatId], (old) =>
        old ? { ...old, messages: withMessage(old.messages, m) } : old)
      // Conversation on screen: loading its messages again tells the API they are read
      // (all-messages resets the unread count), then the list is refreshed by the screen.
      if (chatId === openChat.current) queryClient.invalidateQueries({ queryKey: ['me', 'messages', chatId] })
      else queryClient.invalidateQueries({ queryKey: ['me', 'chats'] })
    }
    RECEIVED.forEach((e) => s.on(e, received))

    return () => {
      s.disconnect()
      socket.current = null
      setOnline(new Set())
    }
  }, [token, active, queryClient])

  const joinChat = useCallback((chatId: string) => {
    openChat.current = chatId
    socket.current?.emit('join chat', chatId)
    return () => {
      if (openChat.current === chatId) openChat.current = null
    }
  }, [])

  const announce = useCallback((message: Message) => {
    socket.current?.emit('new message', { _id: message._id })
  }, [])

  const value = useMemo(() => ({ online, joinChat, announce }), [online, joinChat, announce])
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>
}

export const useLive = () => useContext(LiveContext)
