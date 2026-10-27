import type { Chat, ChatRequest, Message } from './types'

const title = (c: ChatRequest['service_category']) => (c && typeof c === 'object' ? c.title : undefined)

/** "Nettoyage de bureaux · REF-123" for the request the conversation is about, or null. */
export function chatRequestLabel(chat: Chat | undefined): string | null {
  const fromQuote = chat?.quote_id?.service_request_id
  const r = chat?.service_request_id ?? (fromQuote && typeof fromQuote === 'object' ? fromQuote : null)
  if (!r) return null
  const service = title(r.child_category) ?? r.manual_child_category ?? title(r.service_category)
  return [service, r.reference_no].filter(Boolean).join(' · ') || null
}

export const messageChatId = (m: Message) => (typeof m.chat === 'string' ? m.chat : m.chat?._id)

/** Messages newest first (API order), without the same message twice. */
export function withMessage(list: Message[] | null | undefined, m: Message): Message[] {
  const current = list ?? []
  return current.some((x) => x._id === m._id) ? current : [m, ...current]
}
