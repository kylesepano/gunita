import { describe, it, expect, beforeEach, vi } from 'vitest'
import { randomIndex, shuffle } from './random'
import { categories, selectCategory, wheelRotation } from './roulette'
import { haversine } from './distance'
import {
  whereAccuracy,
  whenAccuracy,
  sequenceAccuracy,
  scoreRound,
  MAX_ROUND_SCORE,
} from './scoring'
import { createDeck, nextStreak, nextPhase } from './gameEngine'
import { generateChallenge } from './questionGenerator'
import { evaluate } from './evaluate'
import { events } from '../data/events'
const memory = new Map<string, string>()
vi.stubGlobal('localStorage', {
  getItem: (k: string) => memory.get(k) ?? null,
  setItem: (k: string, v: string) => memory.set(k, v),
  removeItem: (k: string) => memory.delete(k),
})
const { useGame } = await import('../stores/gameStore')
describe('randomness and roulette', () => {
  it('rejects empty pools', () => expect(() => randomIndex(0)).toThrow())
  it('preserves all items when shuffling without mutating input', () => {
    const original = [1, 2, 3, 4]
    expect(shuffle(original).sort()).toEqual(original)
    expect(original).toEqual([1, 2, 3, 4])
  })
  it('selects only valid categories', () => {
    for (let i = 0; i < 100; i++) expect(categories.map((c) => c.type)).toContain(selectCategory())
  })
  it('places each chosen segment center under the top pointer', () => {
    for (const [i, c] of categories.entries()) {
      const rotation = wheelRotation(c.type, 2190)
      expect(rotation).toBeGreaterThanOrEqual(2190 + 1800)
      expect((rotation + i * 60 + 30) % 360).toBe(0)
    }
  })
})
describe('geography and time', () => {
  it('returns zero for the same point', () => expect(haversine([10, 20], [10, 20])).toBe(0))
  it('matches one equatorial degree and antipodal distance', () => {
    expect(haversine([0, 0], [0, 1])).toBeCloseTo(111.195, 2)
    expect(haversine([0, 0], [0, 180])).toBeCloseTo(20015.087, 2)
  })
  it('is symmetric across the antimeridian', () => {
    expect(haversine([0, 179], [0, -179])).toBeCloseTo(222.39, 1)
    expect(haversine([40, 20], [10, -30])).toBeCloseTo(haversine([10, -30], [40, 20]))
  })
  it('scores geography continuously and decreases with distance', () => {
    expect(whereAccuracy(0)).toBe(1)
    expect(whereAccuracy(50)).toBeGreaterThan(whereAccuracy(51))
    expect(whereAccuracy(20000)).toBeGreaterThanOrEqual(0)
  })
  it('scales time scoring to the displayed range including negative years', () => {
    expect(whenAccuracy(1521, 1521, 200)).toBe(1)
    expect(whenAccuracy(1511, 1521, 200)).toBeCloseTo(whenAccuracy(-120, -100, 400))
    expect(whenAccuracy(1400, 1521, 200)).toBeLessThan(whenAccuracy(1500, 1521, 200))
  })
})
describe('sequence and bounded scores', () => {
  it('awards perfect, partial and reverse order appropriately', () => {
    expect(sequenceAccuracy(['a', 'b', 'c'], ['a', 'b', 'c'])).toBe(1)
    expect(sequenceAccuracy(['b', 'a', 'c'], ['a', 'b', 'c'])).toBeGreaterThan(0)
    expect(sequenceAccuracy(['d', 'c', 'b', 'a'], ['a', 'b', 'c', 'd'])).toBe(0)
  })
  it('rejects duplicate and unknown sequence items', () => {
    expect(sequenceAccuracy(['a', 'a'], ['a', 'b'])).toBe(0)
    expect(sequenceAccuracy(['a', 'x'], ['a', 'b'])).toBe(0)
  })
  it('never exceeds the round cap or awards bonuses for zero accuracy', () => {
    for (const accuracy of [-1, 0, 0.1, 0.8, 1, 2, NaN])
      for (const difficulty of ['easy', 'medium', 'hard'] as const) {
        const r = scoreRound(accuracy, difficulty, -500, 10000, false)
        expect(r.total).toBeGreaterThanOrEqual(0)
        expect(r.total).toBeLessThanOrEqual(MAX_ROUND_SCORE)
      }
    expect(scoreRound(0, 'hard', 0, 100, false).total).toBe(0)
  })
  it('applies time, hint and streak bonuses within bounds', () => {
    const fast = scoreRound(1, 'hard', 0, 30, false)
    const slow = scoreRound(1, 'hard', 60000, 0, true)
    expect(fast.total).toBe(12000)
    expect(slow.time).toBe(0)
    expect(slow.noHint).toBe(0)
    expect(fast.streak).toBe(500)
  })
  it('increments or resets streaks at 80% accuracy', () => {
    expect(nextStreak(3, 0.8)).toBe(4)
    expect(nextStreak(3, 0.79)).toBe(0)
  })
})
describe('content and generated challenges', () => {
  it('contains ten unique events and ten-round scope-correct decks', () => {
    expect(new Set(events.map((e) => e.id)).size).toBe(10)
    for (const scope of ['mixed', 'philippines', 'world'] as const) {
      const deck = createDeck(scope)
      expect(deck).toHaveLength(10)
      expect(
        deck.every((id) =>
          events.some((e) => e.id === id && (scope === 'mixed' || e.scope === scope)),
        ),
      ).toBe(true)
      if (scope === 'mixed') expect(new Set(deck).size).toBe(10)
    }
  })
  it('generates all six challenges with correct answers and timeline coverage', () => {
    for (const event of events)
      for (const difficulty of ['easy', 'medium', 'hard'] as const) {
        const q = generateChallenge(event, difficulty)
        expect(q.people).toHaveLength(4)
        expect(q.minYear).toBeLessThanOrEqual(event.year)
        expect(q.maxYear).toBeGreaterThanOrEqual(event.year)
        expect(q.years).toContain(event.year)
        expect(evaluate('who', event.person.id, event, q)).toBe(1)
        expect(evaluate('what', event.id, event, q)).toBe(1)
        expect(evaluate('where', event.coordinates, event, q)).toBe(1)
        expect(evaluate('when', event.year, event, q)).toBe(1)
        expect(evaluate('why', event.causes, event, q)).toBe(1)
        expect(evaluate('how', event.sequence, event, q)).toBe(1)
        expect(
          evaluate(
            'why',
            q.causes.map((c) => c.text),
            event,
            q,
          ),
        ).toBe(0)
      }
  })
})
describe('game state transitions', () => {
  it('plays fixed modes immediately and keeps the mode for all ten rounds', () => {
    for (const mode of ['where', 'when'] as const) {
      useGame.getState().start('mixed', 'easy', mode)
      for (let i = 0; i < 10; i++) {
        const s = useGame.getState()
        expect(s.phase).toBe('answering')
        expect(s.category).toBe(mode)
        s.spin()
        expect(useGame.getState().category).toBe(mode)
        s.submit(1)
        s.next()
      }
      expect(useGame.getState().phase).toBe('completed')
      expect(useGame.getState().results.every((r) => r.category === mode)).toBe(true)
    }
  })
  it('rejects an empty collection and snapshots content for active games', () => {
    expect(() => createDeck('world', [])).toThrow('No published questions')
    const catalog = structuredClone(events)
    useGame.getState().start('mixed', 'medium', 'when', catalog)
    catalog[0].title = 'Edited after the game started'
    expect(useGame.getState().catalog[0].title).toBe(events[0].title)
  })
  beforeEach(() => useGame.getState().start('mixed', 'medium'))
  it('prevents respinning and duplicate submissions', () => {
    const s = useGame.getState()
    s.spin()
    const category = useGame.getState().category
    s.spin()
    expect(useGame.getState().category).toBe(category)
    s.submit(1)
    expect(useGame.getState().results).toHaveLength(0)
    s.finishSpin()
    s.submit(1)
    s.submit(1)
    expect(useGame.getState().results).toHaveLength(1)
    expect(useGame.getState().streak).toBe(1)
  })
  it('completes exactly ten rounds, preserving longest streak and results', () => {
    for (let i = 0; i < 10; i++) {
      const s = useGame.getState()
      expect(s.round).toBe(i)
      s.spin()
      s.finishSpin()
      s.submit(i === 3 ? 0 : 1)
      s.next()
    }
    const final = useGame.getState()
    expect(final.phase).toBe('completed')
    expect(final.results).toHaveLength(10)
    expect(final.longestStreak).toBe(6)
    final.spin()
    expect(useGame.getState().phase).toBe('completed')
    expect(nextPhase(8)).toBe('clue')
    expect(nextPhase(9)).toBe('completed')
  })
})
