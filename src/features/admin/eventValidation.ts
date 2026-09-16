import type { HistoricalEvent } from '../../types/history'
export function validateEvent(event: HistoricalEvent): string[] {
  const errors: string[] = []
  const required = {
    Title: event.title,
    Clue: event.clue,
    Explanation: event.description,
    Location: event.location,
    Country: event.country,
    'Person name': event.person.name,
    'Person description': event.person.bio,
    'Who question': event.role,
  }
  for (const [name, value] of Object.entries(required))
    if (!value?.trim()) errors.push(`${name} is required.`)
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(event.id))
    errors.push('The question ID must contain lowercase letters, numbers and single hyphens.')
  if (!Number.isInteger(event.year) || event.year < -10000 || event.year > 3000)
    errors.push('Enter a whole year between -10000 and 3000.')
  if (!Number.isFinite(event.coordinates[0]) || Math.abs(event.coordinates[0]) > 90)
    errors.push('Latitude must be between -90 and 90.')
  if (!Number.isFinite(event.coordinates[1]) || Math.abs(event.coordinates[1]) > 180)
    errors.push('Longitude must be between -180 and 180.')
  if (!['world', 'philippines'].includes(event.scope)) errors.push('Choose a collection.')
  if (!/^https:\/\/.+/i.test(event.source)) errors.push('Use a complete HTTPS source URL.')
  if (!/^(https:\/\/[^\s]+|\/(?!\/)[^\s]+)$/i.test(event.person.image))
    errors.push('Use an HTTPS portrait URL or a local path beginning with /.')
  for (const [name, items, min, max] of [
    ['Correct causes', event.causes, 1, 4],
    ['Incorrect causes', event.distractors ?? [], 2, 4],
    ['Sequence stages', event.sequence, 2, 8],
  ] as const) {
    if (items.length < min || items.length > max)
      errors.push(`${name} must have ${min}–${max} entries, one per line.`)
    if (
      items.some((x) => !x.trim()) ||
      new Set(items.map((x) => x.trim().toLowerCase())).size !== items.length
    )
      errors.push(`${name} must be nonempty and distinct.`)
  }
  if (event.distractors?.some((d) => event.causes.some((c) => c.toLowerCase() === d.toLowerCase())))
    errors.push('An incorrect cause cannot also be a correct cause.')
  return errors
}
