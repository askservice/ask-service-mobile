// Date answers ("Vous cherchez pour quand ?") are sent as YYYY-MM-DD, like the website's date field.

const pad = (n: number) => String(n).padStart(2, '0')

export const isoDay = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

/** The next `count` days from `from` (today first). */
export function nextDays(count: number, from = new Date()): Date[] {
  return Array.from({ length: count }, (_, i) => new Date(from.getFullYear(), from.getMonth(), from.getDate() + i))
}

const DAY = new Intl.DateTimeFormat('fr-FR', { weekday: 'short' })
const DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' })

export const dayLabel = (d: Date) => DAY.format(d).replace('.', '')
export const dateLabel = (d: Date) => DATE.format(d).replace('.', '')
