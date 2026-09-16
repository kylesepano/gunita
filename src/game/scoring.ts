import type { Difficulty } from '../types/history'
export const MAX_ROUND_SCORE = 12000
export const whereAccuracy = (km: number) => Math.exp(-Math.max(0, km) / 650)
export const whenAccuracy = (guess: number, correct: number, range: number) =>
  Math.exp(-Math.abs(guess - correct) / (range * 0.12))
export function sequenceAccuracy(answer: string[], correct: string[]) {
  if (
    !correct.length ||
    answer.length !== correct.length ||
    new Set(answer).size !== correct.length ||
    answer.some((x) => !correct.includes(x))
  )
    return 0
  let ordered = 0
  let pairs = 0
  for (let i = 0; i < answer.length; i++)
    for (let j = i + 1; j < answer.length; j++) {
      pairs++
      if (correct.indexOf(answer[i]) < correct.indexOf(answer[j])) ordered++
    }
  return (
    (0.5 * answer.filter((x, i) => x === correct[i]).length) / correct.length +
    0.5 * (pairs ? ordered / pairs : 1)
  )
}
export function scoreRound(
  accuracy: number,
  difficulty: Difficulty,
  elapsed: number,
  streak: number,
  hinted: boolean,
) {
  const a = Number.isFinite(accuracy) ? Math.max(0, Math.min(1, accuracy)) : 0
  const base = Math.round(a * 10000)
  const bonuses = {
    difficulty: Math.round(a * { easy: 0, medium: 350, hard: 700 }[difficulty]),
    time: Math.round(a * Math.max(0, 500 * (1 - Math.max(0, elapsed) / 60000))),
    streak: Math.round(a * Math.min(500, Math.max(0, streak) * 100)),
    noHint: hinted ? 0 : Math.round(a * 300),
  }
  return {
    accuracy: a,
    base,
    ...bonuses,
    total: Math.min(MAX_ROUND_SCORE, base + Object.values(bonuses).reduce((a, b) => a + b, 0)),
  }
}
