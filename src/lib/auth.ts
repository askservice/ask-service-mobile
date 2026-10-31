/** Client account? Provider accounts use the website (the app is for clients only). */
export function loginRefusal(role: unknown): string | null {
  const name = typeof role === 'string' ? role : (role as { name?: string } | null)?.name
  return name === 'User' ? null : 'Ce compte est un compte prestataire : connectez-vous sur askservice.fr.'
}

export const VENDOR_ACCOUNT = 'Cette adresse est celle d’un compte prestataire : connectez-vous sur le site, dans l’espace prestataire.'
export const NO_ACCOUNT = 'Aucun compte client n’existe avec cette adresse.'

/** Why a login code was not sent (null when it was): vendor account, no account, other error. */
export function loginCodeFailure(res: { status: number; body: { message?: string; data?: unknown } }): string | null {
  const flow = (res.body.data as { flow?: string } | undefined)?.flow
  if (flow === 'VENDOR_ACCOUNT') return VENDOR_ACCOUNT
  if (flow === 'NO_ACCOUNT') return NO_ACCOUNT
  return res.status >= 400 ? res.body.message || 'Le code n’a pas pu être envoyé.' : null
}
