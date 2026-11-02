import { matchesServiceSearch } from '../search'

const nettoyage = { title: 'Nettoyage', keywords: ['ménage', 'femme de ménage', 'vitres'] }
const plomberie = { title: 'Plomberie', keywords: ['plombier', 'chauffage', 'chauffe-eau'] }
const nuisibles = { title: 'Nuisibles', keywords: ['dératisation', 'rats', 'punaises de lit'] }
const demenagement = { title: 'Déménagement', keywords: ['déménageur'] }

describe('matchesServiceSearch', () => {
  it('champ vide : tout est proposé', () => {
    expect(matchesServiceSearch(nettoyage, '')).toBe(true)
    expect(matchesServiceSearch(nettoyage, '  ')).toBe(true)
  })

  it('nom : début de mot, sans accents ni majuscules', () => {
    expect(matchesServiceSearch(nettoyage, 'net')).toBe(true)
    expect(matchesServiceSearch({ title: 'Sécurité privée' }, 'securite pri')).toBe(true)
    expect(matchesServiceSearch(demenagement, 'DEMEN')).toBe(true)
  })

  it('mots-clés', () => {
    expect(matchesServiceSearch(nettoyage, 'menage')).toBe(true)
    expect(matchesServiceSearch(plomberie, 'chauf')).toBe(true)
    expect(matchesServiceSearch(plomberie, 'eau')).toBe(true)
    expect(matchesServiceSearch(nuisibles, 'derat')).toBe(true)
    expect(matchesServiceSearch(nuisibles, 'punaise lit')).toBe(true)
  })

  it('pas de faux positifs', () => {
    expect(matchesServiceSearch(demenagement, 'menage')).toBe(false)
    expect(matchesServiceSearch(nettoyage, 'oyage')).toBe(false)
    expect(matchesServiceSearch(nuisibles, 'rat cave')).toBe(false)
    expect(matchesServiceSearch({ title: 'Peinture', keywords: null }, 'peintre')).toBe(false)
  })
})
