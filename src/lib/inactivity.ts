// Same rule as the website (InactivityLogout): a client is signed out after 20 minutes without
// using the app. The last activity is kept on the phone, so this also holds across app restarts.
export const INACTIVITY_MS = 20 * 60 * 1000

/** How often the last activity is written to the phone's store (touches are frequent). */
export const SAVE_EVERY_MS = 30 * 1000

/** How often the open app checks the delay. */
export const CHECK_EVERY_MS = 30 * 1000

export const INACTIVITY_TITLE = 'Session expirée'
export const INACTIVITY_MESSAGE = "Vous avez été déconnecté après 20 minutes d'inactivité. Reconnectez-vous pour continuer."

/** True when the session has been unused for the whole delay (no stored activity counts as unused). */
export const isInactive = (lastActivity: number | null, now: number) =>
  lastActivity === null || now - lastActivity >= INACTIVITY_MS

/** Screens of a signed-in client, left for the home screen when the session expires. */
export const isSignedInScreen = (pathname: string) => /^\/(demandes|messages|compte)(\/|$)/.test(pathname)
