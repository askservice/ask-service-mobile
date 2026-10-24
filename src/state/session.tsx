import { useQueryClient } from '@tanstack/react-query'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

import { clearToken, loadToken, saveToken } from '@/api/session'

// Signed-in client: the session token (verify-phone / verify-email) kept in SecureStore.

type Session = {
  token: string | null
  /** False until the stored token has been read at start-up. */
  ready: boolean
  signIn: (token: string) => Promise<void>
  signOut: () => Promise<void>
}

const Context = createContext<Session | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    loadToken().then((t) => setToken(t)).finally(() => setReady(true))
  }, [])

  const signIn = useCallback(async (t: string) => {
    await saveToken(t)
    setToken(t)
  }, [])

  const signOut = useCallback(async () => {
    await clearToken()
    setToken(null)
    // Nothing of the previous account stays on screen.
    queryClient.removeQueries({ predicate: (q) => q.queryKey[0] === 'me' })
  }, [queryClient])

  const value = useMemo(() => ({ token, ready, signIn, signOut }), [token, ready, signIn, signOut])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useSession() {
  const value = useContext(Context)
  if (!value) throw new Error('useSession outside SessionProvider')
  return value
}
