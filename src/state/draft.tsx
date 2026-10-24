import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

import type { Draft } from '@/lib/types'

// The request being filled in, shared by the screens of the flow (nothing is kept once sent).

export const EMPTY_DRAFT: Draft = {
  service: null,
  clientType: null,
  location: null,
  answers: {},
  contact: { firstName: '', lastName: '', phone: '', email: '', notes: '' },
}

type DraftContext = {
  draft: Draft
  update: (patch: Partial<Draft>) => void
  reset: () => void
}

const Context = createContext<DraftContext | null>(null)

export function DraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const value = useMemo<DraftContext>(() => ({
    draft,
    update: (patch) => setDraft((d) => ({ ...d, ...patch })),
    reset: () => setDraft(EMPTY_DRAFT),
  }), [draft])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useDraft() {
  const value = useContext(Context)
  if (!value) throw new Error('useDraft outside DraftProvider')
  return value
}
