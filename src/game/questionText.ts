import type { HistoricalEvent, QuestionType } from '../types/history'

function eraFor(year: number) {
  if (year < 500) return 'ancient-world'
  if (year < 1500) return 'medieval'
  if (year < 1800) return 'early-modern'
  if (year < 1915) return 'industrial-era'
  if (year < 1946) return 'early twentieth-century'
  return 'modern'
}

export function clueForQuestion(event: HistoricalEvent, questionType: QuestionType) {
  if (questionType !== 'where') return event.clue

  return `Use the historical context of this ${eraFor(event.year)} event to identify its setting. The answer is a precise point on the map.`
}
