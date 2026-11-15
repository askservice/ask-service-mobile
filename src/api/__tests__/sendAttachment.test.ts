// The fetch installed by Expo (expo/fetch) rejects React Native's { uri, name, type } file parts
// ("Unsupported FormDataPart implementation"): the file must go as an expo-file-system File.
import { File } from 'expo-file-system'

import { sendAttachment } from '../me'

// jest.mock calls are hoisted above the imports.
jest.mock('expo-file-system', () => ({
  File: class {
    uri: string
    constructor(path: string) {
      this.uri = path
    }
    async bytes() {
      return new Uint8Array([0xff, 0xd8, 0xff])
    }
  },
  Directory: class {},
  Paths: {},
}))
jest.mock('@/state/session', () => ({ useSession: () => ({ token: null }) }))

const fetchMock = jest.fn()
globalThis.fetch = fetchMock as unknown as typeof fetch

// The form of React Native (Node's own FormData would turn the File into a string).
class RnFormData {
  _parts: [string, unknown][] = []
  append(name: string, value: unknown) {
    this._parts.push([name, value])
  }
}
globalThis.FormData = RnFormData as unknown as typeof FormData

const photo = { uri: 'file:///cache/p.jpg', name: 'photo-20261115-153000.jpg', mimeType: 'image/jpeg', kind: 'image' as const }

const partsOf = (form: FormData) => (form as unknown as { _parts: [string, unknown][] })._parts

beforeEach(() => fetchMock.mockReset())

describe('sendAttachment', () => {
  it('sends the file as an expo-file-system File, never as { uri, name, type }', async () => {
    fetchMock.mockResolvedValue({ status: 200, json: async () => ({ data: { _id: 'm1' } }) })
    const message = await sendAttachment('tok', { chatId: 'c1', content: 'Voici', file: photo })
    expect(message).toEqual({ _id: 'm1' })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toMatch(/\/api\/user\/send-msg$/)
    expect(init.headers.Authorization).toBe('Bearer tok')
    const parts = partsOf(init.body)
    expect(parts.slice(0, 2)).toEqual([['chatId', 'c1'], ['content', 'Voici']])
    expect(parts[2][0]).toBe('media')
    expect(parts[2][1]).toBeInstanceOf(File)
    expect((parts[2][1] as { uri: string }).uri).toBe('file:///cache/p.jpg')
  })

  it('gives the phone error in the message when the request cannot be made', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network request failed'))
    await expect(sendAttachment('tok', { chatId: 'c1', content: '', file: photo })).rejects.toMatchObject({
      status: 0,
      message: expect.stringContaining('(détail : TypeError: Network request failed)'),
    })
  })

  it('shows the API refusal', async () => {
    fetchMock.mockResolvedValue({ status: 403, json: async () => ({ message: 'Cette conversation est bloquée' }) })
    await expect(sendAttachment('tok', { chatId: 'c1', content: '', file: photo })).rejects.toMatchObject({ status: 403, message: 'Cette conversation est bloquée' })
  })
})
