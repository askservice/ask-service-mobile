import { useQuery } from '@tanstack/react-query'

import type { Question, ServiceGroup } from '@/lib/types'

import { api, apiGet } from './client'

export function useServiceGroups() {
  return useQuery({
    queryKey: ['service-categories'],
    queryFn: async () => {
      const groups = await apiGet<ServiceGroup[]>('/user/service-categories')
      return [...groups]
        .sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0))
        .map((g) => ({
          ...g,
          child_categories: [...(g.child_categories ?? [])].sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0)),
        }))
        .filter((g) => g.child_categories.length > 0)
    },
    staleTime: 10 * 60 * 1000,
  })
}

export function useQuestions(serviceId: string | undefined) {
  return useQuery({
    queryKey: ['service-questions', serviceId],
    queryFn: async () => (await apiGet<{ list: Question[] }>(`/user/service-questions/${serviceId}`)).list,
    enabled: Boolean(serviceId),
    staleTime: 10 * 60 * 1000,
  })
}

export const createRequest = (payload: unknown, token: string | null) =>
  api<{ flow?: string; request?: { reference_no?: string } }>('/user/service-request', { method: 'POST', body: payload, token })

type Session = { token?: string }

export const verifyPhoneCode = (phone: string, otp: string) =>
  api<Session>('/user/verify-phone', { method: 'POST', body: { phone, otp } })

export const verifyEmailCode = (email: string, otp: string) =>
  api<Session>('/user/verify-email', { method: 'POST', body: { email, otp } })

/** Client sign-up from the app (no request): a code is sent to the e-mail, then /user/verify-email. */
export const signup = (body: unknown) => api('/user/signup', { method: 'POST', body })

/** Client sign-in: code sent to the e-mail (same answer whether or not the address has an account). */
export const sendLoginCode = (email: string) => api('/user/login-code/send', { method: 'POST', body: { email } })

export const verifyLoginCode = (email: string, otp: string) =>
  api<Session>('/user/login-code/verify', { method: 'POST', body: { email, otp } })

/** Signed-in client confirming the number typed in the request. */
export const verifyAccountPhoneCode = (otp: string, token: string) =>
  api('/user/phone-verification/verify', { method: 'POST', body: { otp }, token })

export const resendPhoneCode = (phone: string) => api('/user/resend-phone-otp', { method: 'POST', body: { phone } })

export const resendEmailCode = (email: string) => api('/user/resend-email-verification', { method: 'POST', body: { email } })

export const resendAccountPhoneCode = (token: string) => api('/user/phone-verification/resend', { method: 'POST', token })
