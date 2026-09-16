import { supabase } from './supabase'
import { useGame } from '../stores/gameStore'
export async function saveResults(userId: string) {
  if (!supabase) throw new Error('Supabase is not configured')
  const s = useGame.getState()
  if (s.phase !== 'completed') throw new Error('Finish your expedition before saving')
  const { error } = await supabase.rpc('save_game_result_with_mode', {
    p_session_id: s.sessionId,
    p_scope: s.scope,
    p_difficulty: s.difficulty,
    p_mode: s.mode,
    p_rounds: s.results.map((r, i) => ({
      event_slug: r.eventId,
      question_type: r.category,
      round_number: i + 1,
      score: r.breakdown.total,
      answer_data: r.answer,
      accuracy: r.breakdown.accuracy,
      time_taken_ms: r.time,
    })),
  })
  if (error) throw error
  localStorage.setItem(`gunita-saved-${s.sessionId}`, userId)
}
