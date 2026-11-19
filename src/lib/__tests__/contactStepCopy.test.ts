import { CONTACT_STEP, showNotesField } from '../requestCopy'

describe('contact step texts (same as the website)', () => {
  it('says what the client gets, free, and that the details are never sold', () => {
    expect(CONTACT_STEP.title).toBe('Dernière étape : où recevoir vos devis ?')
    expect(CONTACT_STEP.note).toBe('Gratuit et sans engagement')
    expect(CONTACT_STEP.reassurance).toBe(
      'Vos coordonnées vont uniquement aux professionnels qui répondent à votre demande, 3 au maximum. Elles ne sont jamais revendues.',
    )
    expect(CONTACT_STEP.button).toBe('Voir le récapitulatif')
    expect(CONTACT_STEP.addNotes).toBe('+ Ajouter une précision (facultatif)')
  })
})

describe('showNotesField', () => {
  it('folded until the client asks for it', () => {
    expect(showNotesField(false, '')).toBe(false)
    expect(showNotesField(false, '   ')).toBe(false)
    expect(showNotesField(true, '')).toBe(true)
  })

  it('open at once when there is already a text', () => {
    expect(showNotesField(false, 'étage sans ascenseur')).toBe(true)
    expect(showNotesField(false, undefined)).toBe(false)
  })
})
