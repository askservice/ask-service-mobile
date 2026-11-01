import type { Service, ServiceGroup } from './types'

// Same tiles, texts and counter as the website's request form (askservice.fr/request-a-service).

/** Popular services shown as tiles, in the owner's order (admin service ids, same list as the
 *  website's src/data/servicePages.ts; the last two come from the backend catalogue of 2026-11). */
export const POPULAR_SERVICE_IDS = [
  '6a8984db0da7e0b8cef4d63c', // Nettoyage & Ménage
  '6a897ce91750c974fffdb85a', // Sécurité privée & Gardiennage
  '6a8985230da7e0b8cef4d64b', // Jardinage & Aménagement paysager
  '6a8990fc4bc5d9a73268df6b', // Plomberie & Chauffage
  '6ae73580a8547c669d33980c', // Électricité
  '6ae73580a8547c669d33980b', // Désinsectisation & Dératisation
]

/** The popular services still in the catalogue, in the tiles' order. */
export function popularServices(groups: ServiceGroup[] | undefined): Service[] {
  const all = (groups ?? []).flatMap((g) => g.child_categories)
  return POPULAR_SERVICE_IDS.map((id) => all.find((s) => s._id === id)).filter((s): s is Service => Boolean(s))
}

/** « Comment ça marche », the texts validated for the website's service pages. */
export const HOW_IT_WORKS = [
  { title: 'Décrivez votre besoin.', text: "Quelques questions sur votre projet, en 2 minutes. C'est gratuit et sans engagement." },
  {
    title: "Des professionnels vérifiés vous contactent.",
    text: 'Nous transmettons votre demande à des professionnels du secteur, près de chez vous. Ils échangent avec vous pour préciser votre besoin, puis vous envoient leur devis.',
  },
  {
    title: 'Choisissez librement.',
    text: "Comparez les devis reçus, posez vos dernières questions par la messagerie, puis acceptez l'offre qui vous convient, ou aucune.",
  },
]

/** « Et ensuite ? » on the summary: sent to pros, then the last two steps above. */
export const NEXT_STEPS = [
  'Votre demande part chez des professionnels vérifiés, près de chez vous.',
  ...HOW_IT_WORKS.slice(1).map((step) => step.title),
]

export const TRUST_POINTS = ['100% gratuit', 'Pros vérifiés', 'Plusieurs devis gratuits']

/** What is left at question step `index` of `stepCount`, rather than « step 4 of 7 ». */
export function questionsLeftNote(index: number, stepCount: number) {
  const left = stepCount - index
  return left > 1 ? `Encore ${left} questions, moins d'une minute` : 'Dernière question'
}
