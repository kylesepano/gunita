import type { Difficulty, QuestionType, Scope, GameMode } from './history'

export interface GameSessionRecord {
  id: string
  user_id: string | null
  history_scope: Scope
  difficulty: Difficulty
  game_mode: GameMode
  round_count: 10
  total_score: number
  started_at: string
  completed_at: string | null
}

export interface GameRoundRecord {
  id: string
  game_session_id: string
  historical_event_id: string
  question_type: QuestionType
  round_number: number
  score: number
  answer_data: string | string[] | number | [number, number] | null
  accuracy: number
  is_correct: boolean
  time_taken_ms: number
  created_at: string
}

export interface Achievement {
  id: string
  slug: string
  title: string
  description: string
  criteria: Record<string, unknown>
  icon_url: string | null
  created_at: string
}
