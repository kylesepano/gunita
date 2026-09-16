# Register an administrator profile

This guide creates a normal Supabase Authentication account first, then grants that account permission to manage Gunita questions. Creating an account alone does **not** make it an administrator.

## Before you begin

1. In Supabase, run these migrations in order:
   - `supabase/migrations/202609150001_initial_schema.sql`
   - `supabase/migrations/202609150002_admin_and_catalog.sql`
2. Add your Supabase project details to `.env.local`:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_publishable_or_legacy_anon_key
```

3. Restart the local site with `npm run dev`.

## Create the profile

1. Open `http://localhost:5173/admin`.
2. Select **New to Gunita? Create an account**.
3. Enter an email address and a password with at least eight characters.
4. Confirm the email if your Supabase Authentication settings require email confirmation.

You can also create the user in **Supabase Dashboard → Authentication → Users**. Use the exact email address in the query below.

## Grant the admin role

Open **Supabase Dashboard → SQL Editor → New query**. Replace the email address, then run this query:

```sql
-- Grant one existing Auth user permission to use /admin.
insert into public.admin_users (user_id)
select id
from auth.users
where lower(email) = lower('your-email@example.com')
on conflict (user_id) do nothing;

-- Confirm the role was granted.
select u.id, u.email
from public.admin_users as a
join auth.users as u on u.id = a.user_id
where lower(u.email) = lower('your-email@example.com');
```

The confirmation query should return exactly one row. If it returns no rows, create or confirm the account first, then run the query again with its exact email address.

Return to `/admin`, sign in with that account, and reload the page if it was already open.

## Remove admin access

```sql
delete from public.admin_users
where user_id = (
  select id
  from auth.users
  where lower(email) = lower('your-email@example.com')
);
```

Do not place a Supabase secret or service-role key in `.env.local` for this Vite browser app. The publishable/anon key is the only key it should use.
