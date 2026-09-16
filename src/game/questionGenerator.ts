import { events } from '../data/events'
import type { HistoricalEvent, Difficulty } from '../types/history'
import { shuffle, randomIndex } from './random'
import { causeDistractors } from '../data/causeDistractors'

const coreCountries: Record<string, string> = {
  mactan: 'Philippines',
  independence: 'Philippines',
  cry: 'Philippines',
  tirad: 'Philippines',
  edsa: 'Philippines',
  waterloo: 'Belgium',
  apollo: 'United States',
  berlin: 'Germany',
  dday: 'France',
  constantinople: 'Türkiye',
}

const continents: Record<string, string> = {
  Austria: 'Europe',
  Belgium: 'Europe',
  France: 'Europe',
  Germany: 'Europe',
  Greece: 'Europe',
  Italy: 'Europe',
  Poland: 'Europe',
  Russia: 'Europe',
  Spain: 'Europe',
  Switzerland: 'Europe',
  Ukraine: 'Europe',
  'United Kingdom': 'Europe',
  Bangladesh: 'Asia',
  China: 'Asia',
  India: 'Asia',
  Iran: 'Asia',
  Iraq: 'Asia',
  Israel: 'Asia',
  Japan: 'Asia',
  Kazakhstan: 'Asia',
  Korea: 'Asia',
  Nepal: 'Asia',
  Pakistan: 'Asia',
  Philippines: 'Asia',
  'Saudi Arabia': 'Asia',
  Türkiye: 'Asia',
  Vietnam: 'Asia',
  Egypt: 'Africa',
  Rwanda: 'Africa',
  'South Africa': 'Africa',
  Bahamas: 'North America',
  Cuba: 'North America',
  Haiti: 'North America',
  Panama: 'North America',
  'United States': 'North America',
  'New Zealand': 'Oceania',
}

function countryFor(event: HistoricalEvent) {
  return event.country ?? coreCountries[event.id]
}

function continentFor(event: HistoricalEvent) {
  const country = countryFor(event)
  return country ? continents[country] : undefined
}

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
  const uniquePeople = (candidates: HistoricalEvent[], usedNames = new Set([event.person.name])) =>
    candidates.filter((candidate) => {
      if (usedNames.has(candidate.person.name)) return false
      usedNames.add(candidate.person.name)
      return true
    })
  const nearbyPeople = uniquePeople(eraOthers)
  const selectedNames = new Set([
    event.person.name,
    ...nearbyPeople.slice(0, 7).map((e) => e.person.name),
  ])
  const fallbackPeople = uniquePeople(others, selectedNames)
  const people = [
    event.person,
    ...nearbyPeople.slice(0, 7).map((e) => e.person),
    ...fallbackPeople.slice(0, Math.max(0, 7 - nearbyPeople.length)).map((e) => e.person),
  ]
  const range = { easy: 100, medium: 200, hard: 500 }[difficulty]
  const minYear = Math.floor((event.year - range * (0.25 + randomIndex(5) / 10)) / 10) * 10
  const maxYear = Math.min(minYear + range, new Date().getFullYear())
  const displayedRange = maxYear - minYear
  const country = countryFor(event)
  const continent = continentFor(event)
  const sameCountry = others.filter((candidate) => countryFor(candidate) === country)
  const sameContinent = others.filter(
    (candidate) => countryFor(candidate) !== country && continentFor(candidate) === continent,
  )
  const otherContinents = others.filter(
    (candidate) => countryFor(candidate) !== country && continentFor(candidate) !== continent,
  )
  const nearbyEvents = [...sameCountry, ...sameContinent, ...otherContinents]
  return {
    people: shuffle(people),
    eventOptions: shuffle([event, ...nearbyEvents.slice(0, 3)]).map((e) => ({
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
    maxYear,
    years: shuffle([
      event.year,
      ...[0.2, 0.5, 0.8].map((n) => {
        const y = Math.round(minYear + displayedRange * n)
        return y === event.year ? y + 1 : y
      }),
    ]).sort((a, b) => a - b),
  }
}
export type Challenge = ReturnType<typeof generateChallenge>
