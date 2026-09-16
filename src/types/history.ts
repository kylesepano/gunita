export type Difficulty = 'easy' | 'medium' | 'hard'
export type Scope = 'mixed' | 'philippines' | 'world'
export type QuestionType = 'who' | 'where' | 'when' | 'what' | 'why' | 'how'
export type GameMode = 'roulette' | 'where' | 'when'
export interface Person {
  id: string
  name: string
  bio: string
  image: string
  imagePosition?: string
}
export interface HistoricalEvent {
  id: string
  title: string
  year: number
  location: string
  coordinates: [number, number]
  scope: Exclude<Scope, 'mixed'>
  clue: string
  description: string
  person: Person
  role: string
  causes: string[]
  sequence: string[]
  source: string
  note?: string
  wherePrompt?: string
  distractors?: string[]
  country?: string
}
