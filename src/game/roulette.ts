import type { QuestionType } from '../types/history'
import { randomIndex } from './random'
export const categories: {
  type: QuestionType
  label: string
  english: string
  description: string
  color: string
}[] = [
  {
    type: 'who',
    label: 'WHO',
    english: 'Who',
    description: 'Meet the people who made history.',
    color: '#77806a',
  },
  {
    type: 'where',
    label: 'WHERE',
    english: 'Where',
    description: 'Put history on the map.',
    color: '#83969b',
  },
  {
    type: 'when',
    label: 'WHEN',
    english: 'When',
    description: 'Find your moment in time.',
    color: '#b99659',
  },
  {
    type: 'what',
    label: 'WHAT',
    english: 'What',
    description: 'Connect clues. Uncover the event.',
    color: '#b87862',
  },
  {
    type: 'why',
    label: 'WHY',
    english: 'Why',
    description: 'Discover what set it all in motion.',
    color: '#898095',
  },
  {
    type: 'how',
    label: 'HOW',
    english: 'How',
    description: 'Piece the story back together.',
    color: '#729183',
  },
]
export const selectCategory = () => categories[randomIndex(categories.length)].type
export function wheelRotation(type: QuestionType, previous = 0) {
  const target = (360 - (categories.findIndex((c) => c.type === type) * 60 + 30)) % 360
  return previous + 360 * 5 + ((target - (previous % 360) + 360) % 360)
}
