import { useQueryClient } from '@tanstack/react-query'
import { router, usePathname } from 'expo-router'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Alert, AppState } from 'react-native'

import { clearToken, loadLastActivity, loadToken, saveLastActivity, saveToken } from '@/api/session'
import {
  CHECK_EVERY_MS,
  INACTIVITY_MESSAGE,
  INACTIVITY_TITLE,
  isInactive,
  isSignedInScreen,
  SAVE_EVERY_MS,
} from '@/lib/inactivity'

// Signed-in client: the session token (verify-phone / verify-email) kept in SecureStore,
// signed out after 20 minutes without activity like on the website.

type Session = {
  token: string | null
  /** False until the stored token has been read at start-up. */
  ready: boolean
  signIn: (token: string) => Promise<void>
  signOut: () => Promise<void>
  /** Called on every touch and screen change: keeps the session alive. */
  markActive: () => void
}

const Context = createContext<Session | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const pathname = usePathname()
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const lastActivity = useRef<number | null>(null)
  const lastSaved = useRef(0)
  const pathnameRef = useRef(pathname)
  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  const signOut = useCallback(async () => {
    await clearToken()
    lastActivity.current = null
    setToken(null)
    // Nothing of the previous account stays on screen.
    queryClient.removeQueries({ predicate: (q) => q.queryKey[0] === 'me' })
  }, [queryClient])

  const expire = useCallback(async () => {
    await signOut()
    if (isSignedInScreen(pathnameRef.current)) {
      if (router.canDismiss()) router.dismissAll()
      router.replace('/')
    }
    Alert.alert(INACTIVITY_TITLE, INACTIVITY_MESSAGE)
  }, [signOut])

  const saveActivity = useCallback((time: number) => {
    lastSaved.current = time
    saveLastActivity(time).catch(() => undefined)
  }, [])

  useEffect(() => {
    Promise.all([loadToken(), loadLastActivity()])
      .then(async ([t, last]) => {
        if (!t) return
        if (isInactive(last, Date.now())) {
          await clearToken()
          Alert.alert(INACTIVITY_TITLE, INACTIVITY_MESSAGE)
          return
        }
        lastActivity.current = Date.now()
        saveActivity(lastActivity.current)
        setToken(t)
      })
      .finally(() => setReady(true))
  }, [saveActivity])

  const signIn = useCallback(async (t: string) => {
    await saveToken(t)
    lastActivity.current = Date.now()
    saveActivity(lastActivity.current)
    setToken(t)
  }, [saveActivity])

  const markActive = useCallback(() => {
    if (!token) return
    const now = Date.now()
    lastActivity.current = now
    if (now - lastSaved.current >= SAVE_EVERY_MS) saveActivity(now)
  }, [token, saveActivity])

  // Checked while the app is open, and when it comes back after being left.
  useEffect(() => {
    if (!token) return
    const check = () => {
      if (isInactive(lastActivity.current, Date.now())) expire()
    }
    const timer = setInterval(check, CHECK_EVERY_MS)
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') check()
      else if (lastActivity.current) saveActivity(lastActivity.current)
    })
    return () => {
      clearInterval(timer)
      sub.remove()
    }
  }, [token, expire, saveActivity])

  // A screen change counts as activity.
  useEffect(() => {
    markActive()
  }, [pathname, markActive])

  const value = useMemo(() => ({ token, ready, signIn, signOut, markActive }), [token, ready, signIn, signOut, markActive])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useSession() {
  const value = useContext(Context)
  if (!value) throw new Error('useSession outside SessionProvider')
  return value
}
