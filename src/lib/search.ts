const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Answer search: accents and case ignored ("securite" finds "Sécurité privée"). */
export const matchesSearch = (title: string, query: string) => fold(title).includes(fold(query))

const words = (text: string) => fold(text).split(/[\s\-'’]+/).filter(Boolean)

/** Each word typed starts a word of the text (« punaise lit » → « punaises de lit »). */
const startsWords = (text: string, typed: string[]) => {
  const own = words(text)
  return typed.every((t) => own.some((w) => w.startsWith(t)))
}

/**
 * Service search: the name and the search keywords set in the admin, by start of words
 * (« ménage » finds « Nettoyage » but not « Déménagement », « chauf » finds « Plomberie »).
 * Same rule as the website (src/utils/serviceSearch.ts).
 */
export function matchesServiceSearch(service: { title: string; keywords?: string[] | null }, query: string) {
  const typed = words(query)
  if (typed.length === 0) return true
  return [service.title, ...(service.keywords ?? [])].some((text) => startsWords(text, typed))
}
