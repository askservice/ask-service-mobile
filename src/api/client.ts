import { API_URL } from '@/config'

/** Envelope of every backend answer (utils/http-response.js). */
export type ApiBody<T = unknown> = { success?: boolean; message?: string; data?: T }

export type ApiResult<T = unknown> = { status: number; body: ApiBody<T> }

/**
 * Calls the backend and returns status + body without throwing on an HTTP error: the request
 * flow reads 403 answers (verification required) like the website does.
 */
export async function api<T = unknown>(
  path: string,
  { method = 'GET', body, token }: { method?: string; body?: unknown; token?: string | null } = {},
): Promise<ApiResult<T>> {
  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'fr',
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  let parsed: ApiBody<T> = {}
  try {
    parsed = (await res.json()) as ApiBody<T>
  } catch {
    // Not JSON (proxy error page): only the status is meaningful.
  }
  return { status: res.status, body: parsed }
}

/** GET that throws on an HTTP error, for React Query. */
export async function apiGet<T>(path: string): Promise<T> {
  const { status, body } = await api<T>(path)
  if (status >= 400 || body.data === undefined) throw new Error(body.message || `Erreur ${status}`)
  return body.data
}
