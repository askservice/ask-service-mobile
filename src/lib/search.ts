const fold = (text: string) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

/** Service and answer search: accents and case ignored ("securite" finds "Sécurité privée"). */
export const matchesSearch = (title: string, query: string) => fold(title).includes(fold(query))
