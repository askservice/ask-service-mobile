import {
  attachmentProblem,
  documentFile,
  formatSize,
  MAX_ATTACHMENT_BYTES,
  messageParts,
  photoFile,
  photoName,
  photoResize,
  sendFailureMessage,
} from '../attachments'

// Files joined to a message from the app (photo or document): the API accepts JPEG/PNG/WebP/GIF,
// PDF and Word up to 10 MB (utils/multer.js, chatMediaUpload) and checks the real content.

describe('documents', () => {
  it('keeps the name, type and size given by the picker', () => {
    expect(documentFile({ uri: 'file:///devis.pdf', name: 'devis.pdf', mimeType: 'application/pdf', size: 1200 })).toEqual({
      uri: 'file:///devis.pdf', name: 'devis.pdf', mimeType: 'application/pdf', size: 1200, kind: 'pdf',
    })
  })
  it('guesses the type from the extension when the picker gives none', () => {
    expect(documentFile({ uri: 'file:///a', name: 'Plan.PDF' }).mimeType).toBe('application/pdf')
    expect(documentFile({ uri: 'file:///a', name: 'note.docx' }).mimeType).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document')
    expect(documentFile({ uri: 'file:///a', name: 'old.doc' }).mimeType).toBe('application/msword')
    expect(documentFile({ uri: 'file:///a', name: 'photo.jpg' })).toMatchObject({ mimeType: 'image/jpeg', kind: 'image' })
  })
  it('names a document without name from its path', () => {
    expect(documentFile({ uri: 'file:///cache/DocumentPicker/abc/facture.pdf' }).name).toBe('facture.pdf')
    expect(documentFile({ uri: 'content://x', mimeType: 'application/pdf' }).name).toBe('document.pdf')
  })
  it('a Word document is a file, not a PDF', () => {
    expect(documentFile({ uri: 'file:///a.docx', name: 'a.docx' }).kind).toBe('file')
  })
})

describe('photos', () => {
  it('are always sent as JPEG (iPhone HEIC photos are refused by the API)', () => {
    const at = new Date(2026, 10, 14, 15, 30, 5)
    expect(photoFile({ uri: 'file:///m.jpg', size: 900_000 }, at)).toEqual({
      uri: 'file:///m.jpg', name: 'photo-20261114-153005.jpg', mimeType: 'image/jpeg', size: 900_000, kind: 'image',
    })
    expect(photoName(at)).toBe('photo-20261114-153005.jpg')
  })
  it('are reduced to 2000 px on their longest side, never enlarged', () => {
    expect(photoResize(4032, 3024)).toEqual({ width: 2000 })
    expect(photoResize(3024, 4032)).toEqual({ height: 2000 })
    expect(photoResize(1200, 800)).toBeNull()
    expect(photoResize(0, 0)).toBeNull()
  })
})

describe('checks before sending', () => {
  const file = (over = {}) => ({ uri: 'file:///a.pdf', name: 'a.pdf', mimeType: 'application/pdf', size: 1000, kind: 'pdf' as const, ...over })
  it('accepts photos, PDF and Word up to 10 MB', () => {
    expect(attachmentProblem(file())).toBeNull()
    expect(attachmentProblem(file({ mimeType: 'image/png', kind: 'image' }))).toBeNull()
    expect(attachmentProblem(file({ size: MAX_ATTACHMENT_BYTES }))).toBeNull()
    expect(attachmentProblem(file({ size: undefined }))).toBeNull()
  })
  it('refuses a file over 10 MB, with its size', () => {
    expect(attachmentProblem(file({ size: 12_400_000 }))).toBe('Fichier trop lourd (11,8 Mo) : 10 Mo maximum.')
  })
  it('refuses other types', () => {
    expect(attachmentProblem(file({ mimeType: 'application/zip', name: 'a.zip' }))).toBe('Ce type de fichier n’est pas accepté : photo, PDF ou Word uniquement.')
    expect(attachmentProblem(file({ mimeType: 'video/mp4' }))).not.toBeNull()
  })
})

describe('sizes', () => {
  it('reads in Ko under 1 Mo, in Mo above', () => {
    expect(formatSize(850 * 1024)).toBe('850 Ko')
    expect(formatSize(2.4 * 1024 * 1024)).toBe('2,4 Mo')
    expect(formatSize(300)).toBe('1 Ko')
    expect(formatSize(undefined)).toBe('')
  })
})

describe('form sent to send-msg', () => {
  it('sends the chat, the text and the file in the "media" field', () => {
    const parts = messageParts({ chatId: 'c1', content: ' Voici la photo ', file: { uri: 'file:///p.jpg', name: 'p.jpg', mimeType: 'image/jpeg', kind: 'image' } })
    expect(parts).toEqual([
      ['chatId', 'c1'],
      ['content', 'Voici la photo'],
      ['media', { uri: 'file:///p.jpg', name: 'p.jpg', type: 'image/jpeg' }],
    ])
  })
  it('a file alone has no text', () => {
    const parts = messageParts({ chatId: 'c1', content: '  ', file: { uri: 'file:///a.pdf', name: 'a.pdf', mimeType: 'application/pdf', kind: 'pdf' } })
    expect(parts.map(([k]) => k)).toEqual(['chatId', 'media'])
  })
})

describe('send failures', () => {
  it('explains the refusals of the API in French', () => {
    expect(sendFailureMessage(413, 'File too large')).toBe('Fichier trop lourd : 10 Mo maximum.')
    expect(sendFailureMessage(400, 'File type not allowed')).toBe('Ce type de fichier n’est pas accepté : photo, PDF ou Word uniquement.')
    expect(sendFailureMessage(403, 'Cette conversation est bloquée')).toBe('Cette conversation est bloquée')
    expect(sendFailureMessage(0, '')).toBe('La pièce jointe n’a pas pu être envoyée. Vérifiez votre connexion et réessayez.')
  })

  it('adds the technical detail of the failure, to find the cause from the phone', () => {
    const generic = 'La pièce jointe n’a pas pu être envoyée. Vérifiez votre connexion et réessayez.'
    expect(sendFailureMessage(0, '', 'TypeError: Network request failed')).toBe(`${generic} (détail : TypeError: Network request failed)`)
    expect(sendFailureMessage(502, '')).toBe(`${generic} (détail : erreur HTTP 502)`)
    expect(sendFailureMessage(0, '', `a\n${'x'.repeat(300)}`)).toBe(`${generic} (détail : a ${'x'.repeat(118)})`)
  })
})
