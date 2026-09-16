import { useGame } from '../../stores/gameStore'
import { WhoChallenge } from '../who/WhoChallenge'
import { WhereChallenge } from '../where/WhereChallenge'
import { WhenChallenge } from '../when/WhenChallenge'
import { WhatChallenge } from '../what/WhatChallenge'
import { WhyChallenge } from '../why/WhyChallenge'
import { HowChallenge } from '../how/HowChallenge'
import type { HistoricalEvent } from '../../types/history'
export function ChallengeArea({ event }: { event: HistoricalEvent }) {
  const s = useGame()
  if (!s.challenge) return null
  const disabled = s.phase !== 'answering'
  const change = s.setAnswer
  switch (s.category) {
    case 'who':
      return (
        <WhoChallenge
          people={s.challenge.people}
          difficulty={s.difficulty}
          value={s.answer as string | null}
          onChange={change}
          disabled={disabled}
        />
      )
    case 'where':
      return (
        <WhereChallenge
          value={s.answer as [number, number] | null}
          correct={event.coordinates}
          scope={event.scope}
          onChange={change}
          disabled={disabled}
        />
      )
    case 'when':
      return (
        <WhenChallenge
          challenge={s.challenge}
          value={s.answer as number | null}
          onChange={change}
          disabled={disabled}
          easy={s.difficulty === 'easy'}
        />
      )
    case 'what':
      return (
        <WhatChallenge
          event={event}
          options={s.challenge.eventOptions}
          value={s.answer as string | null}
          onChange={change}
          disabled={disabled}
        />
      )
    case 'why':
      return (
        <WhyChallenge
          causes={s.challenge.causes}
          title={event.title}
          value={(s.answer as string[] | null) ?? []}
          onChange={change}
          disabled={disabled}
        />
      )
    case 'how':
      return (
        <HowChallenge
          items={(s.answer as string[] | null) ?? s.challenge.sequence}
          onChange={change}
          disabled={disabled}
        />
      )
    default:
      return null
  }
}
