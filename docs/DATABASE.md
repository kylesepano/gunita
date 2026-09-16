# Database and Supabase setup

1. Create a Supabase project.
2. Execute both files in `supabase/migrations/` in filename order in its SQL editor. Existing installations only need the new `202609150002_admin_and_catalog.sql` migration.
3. Execute `supabase/seed.sql`. It is repeatable and contains all ten events, ten people, relations, causes, sequences, clues and source URLs.
4. Enable the Email provider in Authentication. Configure your site URL and allow `/auth` as a redirect on localhost and your deployed domain. Keep email confirmation enabled for production.
5. Copy `.env.example` to `.env.local`. Add the project URL and public anon/publishable key. Restart Vite. Never use a service-role key in a `VITE_` variable.
6. Sign up, confirm your email, sign in, finish an expedition, and choose **Save to my account** on the results page.

With Supabase CLI, link the project and run `supabase db push`; then apply the seed using the SQL editor. The SQL files assume Supabase's `auth` and `storage` schemas.

## Tables

`historical_events` holds normalized event facts and publication state. `historical_people` joins events through `event_people`. `event_causes`, `event_sequence`, `event_clues` and `event_sources` store ordered or difficulty-specific child facts. Years are signed integers. Dates may omit month/day. Coordinates represent explicit map targets rather than a claim of pinpoint certainty.

`profiles` references `auth.users`. Users can create, read and update only their own profile. Profile UI and automatic profile provisioning are future enhancements; authentication does not require a profile row.

`game_sessions` and `game_rounds` store personal practice statistics. Guests remain local. `achievements` prepares a future achievement catalog.

## Security

- Every application table enables RLS.
- `admin_users` grants content-management access only through a trusted SQL administrator. See [admin setup](ADMIN.md). It has no client write policy.
- Published events and only their related facts and portraits are publicly queryable.
- There are no public content insert/update/delete policies.
- Admin mutation RPCs verify membership, validate fields, enforce optimistic locking and update parent/child records atomically. Removal marks the event deleted and unpublished, preserving historical game relations.
- Profiles and game sessions are restricted by `auth.uid()`.
- Round operations check ownership of the parent session.
- The `save_game_result` RPC uses **security invoker**, preserving RLS. A ten-round save is atomic and repeatable. The same session ID cannot be reused by another account.
- The `save_game_result_with_mode` wrapper also validates/persists roulette, where-only or when-only mode.
- Scores and accuracy have database bounds. They remain client-reported, unsuitable for competitive rankings.
- `historical-portraits` is a public-read storage bucket with image MIME and size restrictions. No client upload policy is granted. Only trusted administrative tooling should curate assets.

Image URLs initially point to files in `public/portraits`; replace them with controlled Storage object URLs when moving assets to Supabase, retaining attribution.

## Verification

The database unit test executes the schema and seed against an in-memory PostgreSQL engine (PGlite), using minimal `auth`/`storage` stubs. It checks seed idempotence, public visibility, ownership isolation, write rejection and transaction rollback. Only the optional `pgcrypto` extension statement is removed in this test; UUID generation is built into the engine. This does not replace a hosted Supabase integration test of Auth, email delivery or Storage.
