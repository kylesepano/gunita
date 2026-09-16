import type { Scope, HistoricalEvent } from '../types/history'
import { events } from '../data/events'
import { shuffle } from './random'
export function createDeck(scope: Scope, catalog: HistoricalEvent[] = events) {
  const pool = catalog.filter((e) => scope === 'mixed' || e.scope === scope)
  if (!pool.length) throw new Error('No published questions are available for this collection.')
  const deck: string[] = []
  while (deck.length < 10) deck.push(...shuffle(pool).map((e) => e.id))
  return deck.slice(0, 10)
}
export const nextStreak = (streak: number, accuracy: number) => (accuracy >= 0.8 ? streak + 1 : 0)
export const nextPhase = (round: number) =>
  round >= 9 ? ('completed' as const) : ('clue' as const)
