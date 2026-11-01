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

/**
 * Sign-in screen after asking for a code. Code sent: the code step. No client account: stay on
 * the e-mail with only the "Créer un compte" notice (no error, no code boxes). Other refusal:
 * stay on the e-mail with the error.
 */
export function afterCodeRequest(failure: string | null): { step: 'email' | 'code'; noAccount: boolean; error: string | null } {
  if (!failure) return { step: 'code', noAccount: false, error: null }
  if (failure === NO_ACCOUNT) return { step: 'email', noAccount: true, error: null }
  return { step: 'email', noAccount: false, error: failure }
}
