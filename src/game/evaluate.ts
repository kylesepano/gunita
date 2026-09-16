import type { Answer } from '../stores/gameStore'
import type { HistoricalEvent, QuestionType } from '../types/history'
import type { Challenge } from './questionGenerator'
import { haversine } from './distance'
import { sequenceAccuracy, whenAccuracy, whereAccuracy } from './scoring'
export function evaluate(
  type: QuestionType,
  answer: Answer,
  event: HistoricalEvent,
  challenge: Challenge,
) {
  switch (type) {
    case 'who':
      return answer === event.person.id ? 1 : 0
    case 'what':
      return answer === event.id ? 1 : 0
    case 'when':
      return typeof answer === 'number'
        ? whenAccuracy(answer, event.year, challenge.maxYear - challenge.minYear)
        : 0
    case 'where':
      return Array.isArray(answer) && typeof answer[0] === 'number'
        ? whereAccuracy(haversine(answer as [number, number], event.coordinates))
        : 0
    case 'why': {
      const selected = (answer ?? []) as string[]
      const hits = selected.filter((x) => event.causes.includes(x)).length
      const misses = selected.filter((x) => !event.causes.includes(x)).length
      return Math.max(0, (hits - misses) / event.causes.length)
    }
    case 'how':
      return sequenceAccuracy((answer ?? challenge.sequence) as string[], event.sequence)
  }
}
