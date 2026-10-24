import { useEffect, useRef } from 'react'
import { io, type Socket } from 'socket.io-client'

import { API_URL } from '@/config'
import type { Message } from '@/lib/types'
import { useSession } from '@/state/session'

// Real-time messages (backend src/socket/chatSocket.js): the socket carries the session token,
// the server puts it in the client's own room, where the other side's messages arrive.
// Event names are the backend's ("message recieved" is spelled that way there).

const RECEIVED = ['message recieved', 'message received']

/** Calls `onMessage` for each message received in `chatId`; returns a function to announce a sent one. */
export function useChatSocket(chatId: string, onMessage: (m: Message) => void) {
  const { token } = useSession()
  const socket = useRef<Socket | null>(null)
  const handler = useRef(onMessage)

  useEffect(() => {
    handler.current = onMessage
  }, [onMessage])

  useEffect(() => {
    if (!token) return
    const s = io(API_URL, { transports: ['websocket'], auth: { token } })
    socket.current = s
    s.on('connect', () => {
      s.emit('setup', {})
      s.emit('join chat', chatId)
    })
    const received = (m: Message) => {
      const id = typeof m.chat === 'string' ? m.chat : m.chat?._id
      if (id === chatId) handler.current(m)
    }
    RECEIVED.forEach((e) => s.on(e, received))
    return () => {
      s.disconnect()
      socket.current = null
    }
  }, [token, chatId])

  /** The server relays a message saved with send-msg to the other members of the chat. */
  return (message: Message) => socket.current?.emit('new message', { _id: message._id })
}
