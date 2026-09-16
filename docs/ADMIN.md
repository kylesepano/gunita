# Admin access and question management

Open **`/admin`** directly. Administrators can search and view the complete answer key, add events, edit every question field, publish/unpublish questions, and remove questions from future games. For the shortest registration and role-grant flow, see [ADMIN-PROFILE-SETUP.md](ADMIN-PROFILE-SETUP.md).

## Enable your account once

This installation has no Supabase credentials configured yet. Guest games work immediately, but administrator sign-in and shared editing require a Supabase project.

1. Copy `.env.example` to `.env.local`. Set the project URL and **public** anon/publishable key. Restart `npm run dev`.
2. Run these SQL files in the Supabase SQL editor, in order:
   - `supabase/migrations/202609150001_initial_schema.sql` (skip if already applied)
   - `supabase/migrations/202609150002_admin_and_catalog.sql`
   - `supabase/seed.sql` (for initial content only)
3. Create your account through `/auth` and confirm its email, or create a user in the Supabase Authentication dashboard.
4. In the trusted Supabase SQL editor, replace the example email below with your account's exact email and run:

```sql
insert into public.admin_users (user_id)
select id from auth.users
where lower(email) = lower('your-email@example.com')
on conflict (user_id) do nothing;

-- Verify that your account was found and granted access:
select u.id, u.email
from public.admin_users a
join auth.users u on u.id = a.user_id;
```

5. Open `/admin` and sign in with that account's email and password. If already signed in, reload the page after granting the role.

There is no default administrator password. Signing up does not grant admin access. Neither user-editable profile fields nor browser storage can assign the role.

To revoke access:

```sql
delete from public.admin_users
where user_id in (
  select id from auth.users where lower(email) = lower('your-email@example.com')
);
```

## Managing a question

The game generates six challenge types from each historical event. The editor includes the title, clue, explanation, source, editorial note, year, map location and coordinates, person and portrait, correct and incorrect causes, and ordered stages. The **View** action shows the answer key for all six types.

New questions start as drafts. Select **Publish this question** before saving to include one in games. A configured installation loads its catalog from Supabase; published admin changes appear in new games and the archive. Unpublished drafts remain visible to admins only.

Choose a neutral portrait without obvious occupational clothing, tools, badges or answer-revealing scenery. The image may be a controlled HTTPS URL (including Supabase Storage) or a local `/portraits/...` path. The editor does not upload image files. Keep licensing information with the asset.

Removal requires a second, explicit **Confirm removal** action. It removes the question from the library and new games while retaining a database tombstone to preserve old game-round foreign keys. Games already in progress hold their own content snapshot and can still finish locally. Saving an old completed game to the cloud can be rejected if its event was subsequently unpublished or removed.

## Data integrity and security

- `admin_users` has RLS, read access to one's own membership, and no client write policy.
- `is_admin()` checks that table server-side.
- Admin RPCs independently verify the caller, validate input, and update the event and its child records in one transaction.
- Draft content is never returned by the public catalog query.
- Admin-only read policies cover all event relations; standard users cannot modify historical content.
- Edit/remove RPCs require the original `updated_at` value. If another admin changed the event, reload the library before editing again.
- Each edited event receives its own person record so a shared person's edit cannot silently change another question.
- Deleted content is not permanently purged; existing results remain referentially intact.

Do not reapply the starter seed to a live edited catalog: the seed updates starter records by slug. Back up the database before intentionally resetting content.

## Tests

`npm test` runs real PostgreSQL-engine tests for admin-only mutations, membership isolation, draft visibility, validation, transactional edits, stale-write rejection and removal.

`npm run test:admin` starts a separate Vite test server on port 5174 with **test-only** Supabase settings and mocked HTTP responses. It tests sign-in, view/add/edit/publish/remove, public-catalog refresh, access denial and mobile layout. These are UI contract tests, not a claim that a live hosted Supabase project was configured or tested.
