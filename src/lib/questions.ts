import { matchesSearch } from './search'
import type { Answer, Question, QuestionOption } from './types'

/**
 * Questions grouped by their `step` (admin field), steps in order and questions by `order`
 * inside a step. The app shows one step per screen, like the website.
 */
export function questionSteps(questions: Question[]): Question[][] {
  const byStep = new Map<number, Question[]>()
  for (const q of questions) {
    const step = Number(q.step ?? 0)
    byStep.set(step, [...(byStep.get(step) ?? []), q])
  }
  return [...byStep.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, list]) => list.sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)))
}

export const isMultiple = (q: Question) => Boolean(q.is_multiple) || q.type === 'checkbox'

/** Single choice shown as big buttons: touching one goes to the next screen. */
export const isSingleChoice = (q: Question) =>
  !isMultiple(q) && (q.type === 'dropdown' || q.type === 'radio') && (q.options?.length ?? 0) > 0

/** Answers of a choice question whose label contains what was typed (accents and case ignored). */
export const matchingOptions = (options: QuestionOption[], query: string) =>
  options.filter((o) => matchesSearch(o.label, query))

export function isAnswered(answer: Answer | undefined): boolean {
  if (answer === undefined) return false
  return Array.isArray(answer) ? answer.length > 0 : answer.trim() !== ''
}

/** Required questions of the step that have no answer yet. */
export function missingAnswers(step: Question[], answers: Record<string, Answer>): Question[] {
  return step.filter((q) => q.is_required && !isAnswered(answers[q.key]))
}

/** dynamic_answers of the request, same format as the website (several values joined by ", "). */
export function dynamicAnswers(questions: Question[], answers: Record<string, Answer>) {
  return questions
    .filter((q) => isAnswered(answers[q.key]))
    .map((q) => {
      const value = answers[q.key]
      return {
        question_id: q._id,
        key: q.key,
        label: q.label,
        type: q.type,
        value: Array.isArray(value) ? value.join(', ') : value,
      }
    })
}
