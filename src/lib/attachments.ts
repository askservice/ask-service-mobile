// Files joined to a message from the app: a photo (camera or gallery) or a document. The API
// accepts JPEG/PNG/WebP/GIF, PDF and Word up to 10 MB and checks the real content of the file.

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
/** Longest side of a photo once reduced: sharp on a phone, light to send. */
export const MAX_PHOTO_SIDE = 2000

const PDF = 'application/pdf'
const DOC = 'application/msword'
const DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
const IMAGES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/** Types offered by the document picker (the photos go through the photo picker). */
export const DOCUMENT_TYPES = [PDF, DOC, DOCX]
const ACCEPTED = [...IMAGES, ...DOCUMENT_TYPES]

const BY_EXTENSION: Record<string, string> = {
  pdf: PDF,
  doc: DOC,
  docx: DOCX,
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
}

export type PickedFile = {
  uri: string
  name: string
  mimeType: string
  size?: number | null
  kind: 'image' | 'pdf' | 'file'
}

const kindOf = (mimeType: string): PickedFile['kind'] =>
  mimeType.startsWith('image/') ? 'image' : mimeType === PDF ? 'pdf' : 'file'

const extensionOf = (name: string) => name.split('.').pop()?.toLowerCase() ?? ''

/** A file of the document picker. */
export function documentFile(asset: { uri: string; name?: string | null; mimeType?: string | null; size?: number | null }): PickedFile {
  const fromPath = decodeURIComponent(asset.uri.split('/').pop() ?? '')
  const named = asset.name || (fromPath.includes('.') ? fromPath : '')
  const mimeType = asset.mimeType || BY_EXTENSION[extensionOf(named)] || 'application/octet-stream'
  const fallbackExt = Object.entries(BY_EXTENSION).find(([, m]) => m === mimeType)?.[0]
  const name = named || `document${fallbackExt ? `.${fallbackExt}` : ''}`
  return { uri: asset.uri, name, mimeType, size: asset.size, kind: kindOf(mimeType) }
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Name of a photo taken or chosen in the app. */
export function photoName(at: Date = new Date()) {
  const day = `${at.getFullYear()}${pad(at.getMonth() + 1)}${pad(at.getDate())}`
  return `photo-${day}-${pad(at.getHours())}${pad(at.getMinutes())}${pad(at.getSeconds())}.jpg`
}

/** A photo once converted to JPEG by the app (see pickAttachment). */
export function photoFile(image: { uri: string; size?: number | null }, at: Date = new Date()): PickedFile {
  return { uri: image.uri, name: photoName(at), mimeType: 'image/jpeg', size: image.size, kind: 'image' }
}

/** Resize to apply so that the longest side is MAX_PHOTO_SIDE; null when the photo is small enough. */
export function photoResize(width: number, height: number, max = MAX_PHOTO_SIDE): { width: number } | { height: number } | null {
  if (!width || !height || Math.max(width, height) <= max) return null
  return width >= height ? { width: max } : { height: max }
}

/** "850 Ko", "2,4 Mo". */
export function formatSize(bytes: number | null | undefined) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} Mo`
}

const TYPE_REFUSED = 'Ce type de fichier n’est pas accepté : photo, PDF ou Word uniquement.'

/** Why the file cannot be sent, or null. */
export function attachmentProblem(file: PickedFile): string | null {
  if (!ACCEPTED.includes(file.mimeType)) return TYPE_REFUSED
  if (file.size && file.size > MAX_ATTACHMENT_BYTES) return `Fichier trop lourd (${formatSize(file.size)}) : 10 Mo maximum.`
  return null
}

/** Fields of the multipart form sent to send-msg (the file goes in "media", as on the website). */
export function messageParts({ chatId, content, file }: { chatId: string; content: string; file: PickedFile }) {
  const parts: [string, string | { uri: string; name: string; type: string }][] = [['chatId', chatId]]
  const text = content.trim()
  if (text) parts.push(['content', text])
  parts.push(['media', { uri: file.uri, name: file.name, type: file.mimeType }])
  return parts
}

/** Message shown when the API refuses the file or cannot be reached. */
export function sendFailureMessage(status: number, message: string) {
  if (status === 413) return 'Fichier trop lourd : 10 Mo maximum.'
  if (status === 400) return TYPE_REFUSED
  if (status >= 400 && message) return message
  return 'La pièce jointe n’a pas pu être envoyée. Vérifiez votre connexion et réessayez.'
}
