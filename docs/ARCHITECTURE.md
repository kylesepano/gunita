# Architecture

React 19, strict TypeScript, Vite, Tailwind CSS 4, React Router, Zustand, React Leaflet, Lucide and Supabase JS. Tailwind is integrated through the Vite plugin; the visual system uses semantic CSS classes and responsive breakpoints.

## Responsibilities

- `src/data/`: curated starter facts, incorrect cause options and portrait framing. The bundled catalog is used when Supabase is unconfigured; it is also exported to the normalized SQL seed.
- `src/lib/catalog.ts` and `src/stores/catalogStore.ts`: a paginated Supabase repository and observable public catalog. Configured installations load published, nonremoved events from the database. Loading errors are surfaced with a retry rather than silently substituting stale content.
- `src/types/`: event, person, scope, difficulty and question type contracts.
- `src/game/`: centralized cryptographic randomness, challenge generation, deck creation, roulette geometry, Haversine distance, answer evaluation, bounded score calculation and state-transition helpers.
- `src/stores/gameStore.ts`: session lifecycle and versioned local persistence, including game mode and a content snapshot. Selected categories, generated options, answers and results survive a reload. Admin edits/removals cannot alter an active game's local answer key.
- `src/features/`: independently rendered game mechanics. Map dependencies are loaded with the game route, not the landing page.
- `src/features/admin/`: question validation, full event editor, answer-key preview and searchable management workspace. Server-checked admin membership gates `/admin` and every mutation RPC.
- `src/pages/`: route composition and navigation.
- `src/lib/`: optional Supabase client and transactional result saving.
- `supabase/`: normalized content, RLS, storage bucket and result RPC.
- `scripts/`: reproducible SQL seed generation and image attribution.

## State lifecycle

`clue → spinning → answering → revealed → clue`, ending at `completed` after round ten. A spin preselects its result before animation. Repeated spins and duplicate submission calls are ignored. Leaving the page retains progress. Beginning another game explicitly replaces the current local expedition.

Where-only and when-only games use `answering → revealed → answering`, with no roulette state. Every new round remounts the challenge area, clearing map view, temporary coordinate inputs and other per-round UI state.

All score calculations use pure functions. The sequence mechanic accepts drag-and-drop and button reordering. Map input accepts clicks and coordinate entry. Every category has a distinct interaction surface.

## Scaling

The normalized event schema is the source model, not a table of fixed questions. The repository maps joined Supabase records into `HistoricalEvent` in pages of 200. The current game snapshots the catalog used to generate its options. For very large libraries, select a bounded event and distractor pool before snapshotting to keep browser storage small. The founding collection and editor use one shared clue per difficulty; author separate difficulty-specific clues before expanding content.

Client answers and scoring are inspectable. Saved games are private, self-reported practice statistics. Competitive anti-cheat and public leaderboards require a server-authoritative evaluator.
