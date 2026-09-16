import { UserRound, MapPin, Hourglass, Landmark, Lightbulb, Route } from 'lucide-react'
import type { QuestionType } from '../types/history'
const icons = {
  who: UserRound,
  where: MapPin,
  when: Hourglass,
  what: Landmark,
  why: Lightbulb,
  how: Route,
}
export function CategoryIcon({ type, size = 22 }: { type: QuestionType; size?: number }) {
  const Icon = icons[type]
  return <Icon size={size} strokeWidth={1.5} aria-hidden="true" />
}
