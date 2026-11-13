import { attachment, blockedNotice, chatBlock, chatRequestLabel, messageChatId, REPORT_REASONS, withMessage } from '../chat'
import type { Chat, Message } from '../types'

const chat = (over: Partial<Chat>): Chat => ({ _id: 'c', updatedAt: '2026-10-27T10:00:00Z', ...over })
const message = (id: string, chatRef: Message['chat'] = 'c'): Message => ({ _id: id, sender: { _id: 'v' }, content: 'Bonjour', chat: chatRef, createdAt: '2026-10-27T10:00:00Z' })

describe('request of a conversation', () => {
  it('shows the request written about before any quote', () => {
    expect(chatRequestLabel(chat({ service_request_id: { reference_no: 'REF-1', service_category: { title: 'Nettoyage' } } }))).toBe('Nettoyage · REF-1')
  })
  it('prefers the precise service, then falls back to the quote', () => {
    expect(chatRequestLabel(chat({ service_request_id: { reference_no: 'REF-1', service_category: { title: 'Nettoyage' }, child_category: { title: 'Bureaux' } } }))).toBe('Bureaux · REF-1')
    expect(chatRequestLabel(chat({ quote_id: { _id: 'q', service_request_id: { reference_no: 'REF-2', service_category: { title: 'Jardinage' } } } }))).toBe('Jardinage · REF-2')
  })
  it('shows nothing for an old conversation without request', () => {
    expect(chatRequestLabel(chat({}))).toBeNull()
    expect(chatRequestLabel(chat({ quote_id: { _id: 'q', service_request_id: 'id-only' } }))).toBeNull()
    expect(chatRequestLabel(undefined)).toBeNull()
  })
})

describe('live messages', () => {
  it('reads the chat id sent by the server (populated) or by the API (id)', () => {
    expect(messageChatId(message('m', { _id: 'c1' }))).toBe('c1')
    expect(messageChatId(message('m', 'c2'))).toBe('c2')
  })
  it('adds a message on top once, even if it comes twice (send + socket)', () => {
    const list = withMessage([message('old')], message('new'))
    expect(list.map((m) => m._id)).toEqual(['new', 'old'])
    expect(withMessage(list, message('new'))).toBe(list)
    expect(withMessage(undefined, message('a')).map((m) => m._id)).toEqual(['a'])
  })
})

describe('foreground', () => {
  // Imported here: live.tsx pulls React Native, mocked by jest-expo.
  const { isForeground } = jest.requireActual('../../state/live') as typeof import('../../state/live')
  it('keeps the socket unless the app is in the background', () => {
    expect(isForeground('active')).toBe(true)
    expect(isForeground('inactive')).toBe(true)
    expect(isForeground('unknown')).toBe(true)
    expect(isForeground(null)).toBe(true)
    expect(isForeground('background')).toBe(false)
  })
})

describe('attachments', () => {
  it('reads the kind given by the API', () => {
    expect(attachment({ media_url: '/api/user/messages/m1/media', media_kind: 'image' })).toEqual({ path: '/api/user/messages/m1/media', kind: 'image', label: 'Photo' })
    expect(attachment({ media_url: '/api/user/messages/m2/media', media_kind: 'pdf' })?.label).toBe('Document PDF')
    expect(attachment({ media_url: '/api/user/messages/m3/media' })?.kind).toBe('file')
  })
  it('never uses a storage link or key', () => {
    expect(attachment({ media_url: null })).toBeNull()
    expect(attachment({ media_url: 'chat/1-a.jpg' })).toBeNull()
    expect(attachment({ media_url: 'https://storage.askservice.fr/public/chat/1-a.jpg' })).toBeNull()
  })
})

describe('report and block (Apple guideline 1.2)', () => {
  it('reads who blocked whom; the client\'s own block wins', () => {
    expect(chatBlock(chat({}))).toBe('none')
    expect(chatBlock(undefined)).toBe('none')
    expect(chatBlock(chat({ blockedByMe: true }))).toBe('byMe')
    expect(chatBlock(chat({ blockedMe: true }))).toBe('byOther')
    expect(chatBlock(chat({ blockedByMe: true, blockedMe: true }))).toBe('byMe')
  })
  it('replaces the message field by a notice when blocked', () => {
    expect(blockedNotice('none', 'Clairnet')).toBeNull()
    expect(blockedNotice('byMe', 'Clairnet')).toContain('Vous avez bloqué Clairnet')
    expect(blockedNotice('byOther', 'Clairnet')).toBe('Vous ne pouvez plus écrire dans cette conversation.')
  })
  it('uses the reason keys the admin reads (website report form)', () => {
    expect(REPORT_REASONS.map((r) => r.key)).toEqual(['harassment', 'inappropriate', 'fraud', 'spam', 'fake', 'other'])
  })
})
