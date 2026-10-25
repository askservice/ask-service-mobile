import { router } from 'expo-router'
import { useCallback } from 'react'

import { createRequest, useQuestions } from '@/api/requests'
import { loadToken } from '@/api/session'
import { questionSteps } from '@/lib/questions'
import { requestPayload, submitOutcome, type SubmitOutcome } from '@/lib/request'

import { useDraft } from './draft'

/**
 * Screens of the flow: 1 service, 2 address, then one per question step, contact details and
 * the summary.
 * Returns the questions of the chosen service and the step numbers of each screen.
 */
export function useFlowSteps() {
  const { draft } = useDraft()
  const { data: questions = [], isLoading, error, refetch } = useQuestions(draft.service?._id)
  const steps = questionSteps(questions)
  return {
    questions,
    steps,
    isLoading,
    error,
    refetch,
    total: steps.length + 4,
    contactStep: steps.length + 3,
  }
}

/** Goes to the screen of question step `index`, or to the contact details after the last one. */
export function goToQuestionStep(index: number, stepCount: number, replace = false) {
  const go = replace ? router.replace : router.push
  if (index < stepCount) go({ pathname: '/demande/question/[step]', params: { step: String(index) } })
  else go('/demande/coordonnees')
}

/** Moves to the screen that follows the API's answer to the request. */
export function followOutcome(outcome: SubmitOutcome) {
  switch (outcome.kind) {
    case 'created':
      router.replace({ pathname: '/demande/envoyee', params: { ref: outcome.reference ?? '' } })
      return null
    case 'verify-phone':
      router.push({ pathname: '/demande/code', params: { mode: 'phone', ref: outcome.reference ?? '' } })
      return null
    case 'verify-email':
      router.push({ pathname: '/demande/code', params: { mode: 'email' } })
      return null
    case 'verify-account-phone':
      router.push({ pathname: '/demande/code', params: { mode: 'account' } })
      return null
    case 'login-required':
      return 'Un compte existe déjà avec ces coordonnées. Connectez-vous sur askservice.fr pour faire votre demande.'
    case 'error':
      return outcome.message
  }
}

/** Sends the request (signed in when a session token is stored) and returns the outcome. */
export function useSubmitRequest() {
  const { draft } = useDraft()
  const { questions } = useFlowSteps()
  return useCallback(async (): Promise<SubmitOutcome> => {
    try {
      const token = await loadToken()
      const { status, body } = await createRequest(requestPayload(draft, questions), token)
      return submitOutcome(status, body)
    } catch {
      return { kind: 'error', message: 'Connexion impossible. Vérifiez votre réseau et réessayez.' }
    }
  }, [draft, questions])
}
