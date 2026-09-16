import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Difficulty, Scope, QuestionType, GameMode, HistoricalEvent } from '../types/history'
import { createDeck, nextPhase, nextStreak } from '../game/gameEngine'
import { generateChallenge } from '../game/questionGenerator'
import type { Challenge } from '../game/questionGenerator'
import { events } from '../data/events'
import { selectCategory } from '../game/roulette'
import { scoreRound } from '../game/scoring'
export type Answer = string | string[] | number | [number, number] | null
export interface RoundResult {
  eventId: string
  category: QuestionType
  answer: Answer
  time: number
  breakdown: ReturnType<typeof scoreRound>
}
interface GameState {
  sessionId: string
  scope: Scope
  difficulty: Difficulty
  deck: string[]
  round: number
  category: QuestionType | null
  phase: 'clue' | 'spinning' | 'answering' | 'revealed' | 'completed'
  challenge: Challenge | null
  answer: Answer
  results: RoundResult[]
  streak: number
  longestStreak: number
  startedAt: number
  hinted: boolean
  mode: GameMode
  catalog: HistoricalEvent[]
  start: (
    scope: Scope,
    difficulty: Difficulty,
    mode?: GameMode,
    catalog?: HistoricalEvent[],
  ) => void
  spin: () => void
  finishSpin: () => void
  setAnswer: (answer: Answer) => void
  hint: () => void
  submit: (accuracy: number) => void
  next: () => void
}
export const useGame = create<GameState>()(
  persist(
    (set, get) => ({
      sessionId: '',
      scope: 'mixed',
      difficulty: 'medium',
      deck: [],
      round: 0,
      category: null,
      phase: 'clue',
      challenge: null,
      answer: null,
      results: [],
      streak: 0,
      longestStreak: 0,
      startedAt: 0,
      hinted: false,
      mode: 'roulette',
      catalog: events,
      start: (scope, difficulty, mode = 'roulette', catalog = events) => {
        const deck = createDeck(scope, catalog)
        const event = catalog.find((e) => e.id === deck[0])!
        set({
          sessionId: crypto.randomUUID(),
          mode,
          catalog: structuredClone(catalog),
          scope,
          difficulty,
          deck,
          round: 0,
          category: mode === 'roulette' ? null : mode,
          phase: mode === 'roulette' ? 'clue' : 'answering',
          challenge: mode === 'roulette' ? null : generateChallenge(event, difficulty, catalog),
          startedAt: Date.now(),
          answer: null,
          results: [],
          streak: 0,
          longestStreak: 0,
          hinted: false,
        })
      },
      spin: () => {
        const state = get()
        if (state.phase !== 'clue' || state.mode !== 'roulette') return
        const event = state.catalog.find((e) => e.id === state.deck[state.round])!
        set({
          category: selectCategory(),
          challenge: generateChallenge(event, state.difficulty, state.catalog),
          phase: 'spinning',
        })
      },
      finishSpin: () => {
        if (get().phase === 'spinning') set({ phase: 'answering', startedAt: Date.now() })
      },
      setAnswer: (answer) => {
        if (get().phase === 'answering') set({ answer })
      },
      hint: () => set({ hinted: true }),
      submit: (accuracy) => {
        const state = get()
        if (state.phase !== 'answering' || !state.category) return
        const time = Date.now() - state.startedAt
        const breakdown = scoreRound(accuracy, state.difficulty, time, state.streak, state.hinted)
        const streak = nextStreak(state.streak, breakdown.accuracy)
        const answer =
          state.category === 'how'
            ? (state.answer ?? state.challenge?.sequence ?? null)
            : state.answer
        set({
          phase: 'revealed',
          answer,
          streak,
          longestStreak: Math.max(streak, state.longestStreak),
          results: [
            ...state.results,
            { eventId: state.deck[state.round], category: state.category, answer, time, breakdown },
          ],
        })
      },
      next: () => {
        const s = get()
        if (s.phase !== 'revealed') return
        const round = Math.min(9, s.round + 1)
        const fixed = s.mode !== 'roulette' && nextPhase(s.round) !== 'completed'
        const event = s.catalog.find((e) => e.id === s.deck[round])!
        set({
          phase: fixed ? 'answering' : nextPhase(s.round),
          round,
          category: fixed && s.mode !== 'roulette' ? s.mode : null,
          answer: null,
          challenge: fixed ? generateChallenge(event, s.difficulty, s.catalog) : null,
          startedAt: Date.now(),
          hinted: false,
        })
      },
    }),
    { name: 'gunita-game-v1', version: 1 },
  ),
)
