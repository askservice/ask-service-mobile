/** Client account? Provider accounts use the website (the app is for clients only). */
export function loginRefusal(role: unknown): string | null {
  const name = typeof role === 'string' ? role : (role as { name?: string } | null)?.name
  return name === 'User' ? null : 'Ce compte est un compte prestataire : connectez-vous sur askservice.fr.'
}
