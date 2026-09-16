import { events } from '../data/events'
import type { HistoricalEvent, Difficulty } from '../types/history'
import { shuffle, randomIndex } from './random'
import { causeDistractors } from '../data/causeDistractors'
export function generateChallenge(
  event: HistoricalEvent,
  difficulty: Difficulty,
  catalog: HistoricalEvent[] = events,
) {
  const others = shuffle(catalog.filter((e) => e.id !== event.id))
  const anchorBirthYear = event.person.birthYear ?? event.year - 35
  const eraOthers = others.filter((e) => {
    const birthYear = e.person.birthYear
    return birthYear != null && Math.abs(birthYear - anchorBirthYear) <= 100
  })
  const range = { easy: 100, medium: 200, hard: 500 }[difficulty]
  const minYear = Math.floor((event.year - range * (0.25 + randomIndex(5) / 10)) / 10) * 10
  return {
    people: shuffle([
      event.person,
      ...eraOthers
        .filter(
          (e, i, all) =>
            e.person.name !== event.person.name &&
            all.findIndex((other) => other.person.name === e.person.name) === i,
        )
        .slice(0, 3)
        .map((e) => e.person),
    ]),
    eventOptions: shuffle([event, ...others.slice(0, 3)]).map((e) => ({
      id: e.id,
      title: e.title,
      scope: e.scope,
    })),
    causes: shuffle([
      ...event.causes.map((text) => ({ text, correct: true })),
      ...(event.distractors ?? causeDistractors[event.id] ?? []).map((text) => ({
        text,
        correct: false,
      })),
    ]),
    sequence: shuffle(event.sequence),
    minYear,
    maxYear: minYear + range,
    years: shuffle([
      event.year,
      ...[0.2, 0.5, 0.8].map((n) => {
        const y = Math.round(minYear + range * n)
        return y === event.year ? y + 1 : y
      }),
    ]).sort((a, b) => a - b),
  }
}
export type Challenge = ReturnType<typeof generateChallenge>
