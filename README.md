# GUNITA

## Explore history your way

Six ways to discover. A complete ten-round historical game built in the existing React template at `C:\laragon\www\gunita`, with English-only branding and larger, readable text.

### Run locally

Requires Node.js 22.12+ (verified with Node 24).

```sh
npm install
npm run dev
```

Open the Vite URL, normally http://localhost:5173. This is a Vite application inside Laragon's workspace, not a PHP/Laravel application. Use Vite during development; opening the source directory through Apache does not compile React.

### What's included

- Atlas-inspired responsive landing page and circular six-category roulette.
- Philippine, world and mixed history; easy, medium and hard; ten rounds.
- **Where only** and **When only** game modes that skip the roulette entirely.
- Six working mechanics: portraits, map pins, timeline slider, event evidence cards, multiple causes and sequence ordering.
- Bounded scoring, hints, streaks, answer explanations, source references and final statistics.
- Full guest play, persisted progress, safe reloads and a searchable archive of ten events.
- Optional Supabase email/password sign-up, sign-in, logout and private result saving.
- Secure **`/admin`** sign-in and question viewing, creation, editing, publishing and removal. Published content feeds new games and the archive.
- Normalized PostgreSQL schema, RLS policies, Storage preparation and a repeatable relational seed.
- Keyboard alternatives, visible focus, reduced-motion handling and local historical imagery with attribution.

### Stack

React 19, TypeScript (strict), Vite, Tailwind CSS 4, Zustand, React Router, Lucide, React Leaflet/OpenStreetMap, Supabase, Vitest and Playwright. Maps do not need a paid key. Map tiles and web fonts need network access; coordinate entry remains available if tiles cannot load.

### Supabase

Guest play requires no environment variables. To enable accounts:

1. Create a Supabase project.
2. Run both SQL files in `supabase/migrations/` in filename order, then `supabase/seed.sql` for initial content. Existing installations only need the new admin/catalog migration; do not reseed a library you have edited.
3. Copy `.env.example` to `.env.local` and set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the public project values.
4. Enable Email authentication and configure localhost/deployed site URLs and `/auth` redirects.
5. Restart Vite. Sign up and confirm your email, then sign in.
6. Complete a game and click **Save to my account** on the results page.

Never put a service-role secret in the browser. Saving is transactional and idempotent; sessions and rounds are private to their owner. Configured installations load published questions from Supabase. Unconfigured installations use the bundled starter catalog. Active games snapshot their content so editing the library cannot change their answers halfway through. Real Supabase credentials were not provided, so hosted Auth/email and cloud saving have not been integration-tested.

### Admin login

Open `/admin` or click **Admin** in the footer. Create a normal Supabase account, then grant it membership in `public.admin_users` using the exact instructions in [docs/ADMIN.md](docs/ADMIN.md). There is no hardcoded admin password and ordinary sign-up does not grant editing rights. The editor includes all six answer types, portrait URLs, source references, drafts and publication status. Removal preserves existing game records.

See [database setup and security](docs/DATABASE.md).

### Validation

```sh
npm run build
npm run lint
npm test
npm run test:e2e
npm run test:admin
```

Unit tests cover roulette geometry, random selection, Haversine distance, geographic/year/sequence accuracy, bonuses, score bounds, content generation, streaks and ten-round transitions. A PostgreSQL test applies the schema and seed and verifies RLS ownership, rejected writes and transactional saves. Playwright covers the guest journey, reloads, archive search and responsive layouts. It uses installed Chrome; configure a different Playwright channel if needed.

```sh
npm run format
npm run seed:generate
```

The seed generator exports the entire content graph from `src/data/events.ts`. Image credits are available in-game and at `/portraits/credits.html`.

### Deploy to Vercel

Import this folder into a Git repository and connect it to Vercel. Select the **Vite** preset, build with `npm run build`, and publish `dist`. Add the two public Supabase variables if using accounts. `vercel.json` rewrites application routes to `index.html`, preserving reloads on `/game`, `/results` and other routes. Add the deployed `/auth` URL to Supabase's allowed redirects. No live deployment was performed.

### Documentation

- [Product overview](docs/PRODUCT_OVERVIEW.md)
- [Architecture and scaling](docs/ARCHITECTURE.md)
- [Database and RLS](docs/DATABASE.md)
- [Admin login and question management](docs/ADMIN.md)
- [Game rules](docs/GAME_RULES.md)
- [Scoring](docs/SCORING.md)
- [Content and image guidelines](docs/CONTENT_GUIDELINES.md)
- [Roadmap](docs/ROADMAP.md)

Small collections repeat events to make ten rounds. Roulette categories are independently randomized; fixed modes use only Where or When. Practice scores are client-reported and are not designed for competitive anti-cheat. Historical uncertainties and representative map locations are disclosed in the game and content guidelines.
