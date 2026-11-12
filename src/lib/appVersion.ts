// Label shown at the bottom of the Account screen: the app version, plus the date of the remote
// update (EAS Update) when the app runs one instead of the code embedded in the store build.
// It tells at a glance which update a phone actually runs.
export function versionLabel(version: string | null | undefined, update: { isEmbeddedLaunch: boolean; createdAt: Date | null }): string {
  const base = `Version ${version || '?'}`
  if (update.isEmbeddedLaunch || !update.createdAt) return base
  const d = update.createdAt
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${base} · mise à jour du ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`
}
