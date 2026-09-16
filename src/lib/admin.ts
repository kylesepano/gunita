import { supabase } from './supabase'
import type { HistoricalEvent } from '../types/history'
import { validateEvent } from '../features/admin/eventValidation'
export async function saveAdminEvent(
  event: HistoricalEvent,
  published: boolean,
  expectedUpdatedAt: string | null,
) {
  if (!supabase) throw new Error('Connect Supabase to manage questions.')
  const errors = validateEvent(event)
  if (errors.length) throw new Error(errors.join(' '))
  const { error } = await supabase.rpc('admin_save_event', {
    p_event: event,
    p_published: published,
    p_expected_updated_at: expectedUpdatedAt,
  })
  if (error) throw new Error(error.message)
}
export async function removeAdminEvent(slug: string, expectedUpdatedAt: string) {
  if (!supabase) throw new Error('Connect Supabase to manage questions.')
  const { error } = await supabase.rpc('admin_remove_event', {
    p_slug: slug,
    p_expected_updated_at: expectedUpdatedAt,
  })
  if (error) throw new Error(error.message)
}
