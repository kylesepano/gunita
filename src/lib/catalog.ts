import { supabase } from './supabase'
import { events } from '../data/events'
import { causeDistractors } from '../data/causeDistractors'
import type { HistoricalEvent } from '../types/history'

export interface CatalogEntry {
  event: HistoricalEvent
  published: boolean
  updatedAt: string
}
export interface CatalogRow {
  slug: string
  title: string
  summary: string
  description: string
  year: number
  location_name: string
  latitude: number
  longitude: number
  history_scope: 'philippines' | 'world'
  country: string
  editorial_note: string | null
  where_prompt: string | null
  source_summary: string | null
  cause_distractors: string[] | null
  is_published: boolean
  updated_at: string
  event_people: {
    role: string
    is_primary: boolean
    historical_people: {
      slug: string
      name: string
      short_bio: string
      image_url: string | null
      image_position: string | null
    }
  }[]
  event_causes: { description: string; sort_order: number }[]
  event_sequence: { description: string; sort_order: number }[]
}
export function mapCatalogRow(row: CatalogRow): CatalogEntry {
  const association = row.event_people.find((p) => p.is_primary) ?? row.event_people[0]
  if (!association) throw new Error(`The question “${row.title}” is missing its primary person.`)
  const p = association.historical_people
  const ordered = (items: { description: string; sort_order: number }[]) =>
    [...items].sort((a, b) => a.sort_order - b.sort_order).map((i) => i.description)
  return {
    published: row.is_published,
    updatedAt: row.updated_at,
    event: {
      id: row.slug,
      title: row.title,
      clue: row.summary,
      description: row.description,
      year: row.year,
      location: row.location_name,
      coordinates: [row.latitude, row.longitude],
      scope: row.history_scope,
      country: row.country,
      note: row.editorial_note ?? undefined,
      wherePrompt: row.where_prompt ?? undefined,
      source: row.source_summary ?? '',
      causes: ordered(row.event_causes),
      sequence: ordered(row.event_sequence),
      distractors: row.cause_distractors ?? causeDistractors[row.slug] ?? [],
      role: association.role,
      person: {
        id: p.slug,
        name: p.name,
        bio: p.short_bio,
        image: p.image_url ?? '',
        imagePosition: p.image_position ?? undefined,
      },
    },
  }
}
export async function fetchCatalog(admin = false): Promise<CatalogEntry[]> {
  if (!supabase)
    return events.map((event) => ({
      event: { ...event, distractors: causeDistractors[event.id] },
      published: true,
      updatedAt: '',
    }))
  const all: CatalogEntry[] = []
  const pageSize = 200
  for (let offset = 0; ; offset += pageSize) {
    let query = supabase
      .from('historical_events')
      .select(
        '*, event_people(role,is_primary,historical_people(slug,name,short_bio,image_url,image_position)), event_causes(description,sort_order), event_sequence(description,sort_order)',
      )
      .eq('is_deleted', false)
      .order('slug')
      .range(offset, offset + pageSize - 1)
    if (!admin) query = query.eq('is_published', true)
    const { data, error } = await query
    if (error) throw new Error(`Could not load the question library. ${error.message}`)
    const rows = data as unknown as CatalogRow[]
    all.push(...rows.map(mapCatalogRow))
    if (rows.length < pageSize) return all
  }
}
