import { create } from 'zustand'
import { events } from '../data/events'
import { fetchCatalog } from '../lib/catalog'
import { supabase } from '../lib/supabase'
import type { HistoricalEvent } from '../types/history'
interface CatalogState {
  events: HistoricalEvent[]
  loading: boolean
  loaded: boolean
  error: string | null
  refresh: () => Promise<void>
}
export const useCatalog = create<CatalogState>((set, get) => ({
  events: supabase ? [] : events,
  loading: false,
  loaded: !supabase,
  error: null,
  refresh: async () => {
    if (get().loading) return
    set({ loading: true, error: null })
    try {
      const entries = await fetchCatalog()
      set({ events: entries.map((e) => e.event), loaded: true })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Could not load the question library.',
        loaded: false,
      })
    } finally {
      set({ loading: false })
    }
  },
}))
