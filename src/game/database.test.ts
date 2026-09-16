import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { it, expect } from 'vitest'
it('applies schema and seed, saves atomically, and isolates private data with RLS', async () => {
  const db = new PGlite()
  try {
    await db.exec(
      `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); create table storage.objects(id uuid primary key,bucket_id text); alter table storage.objects enable row level security;`,
    )
    const migration = await readFile('supabase/migrations/202609150001_initial_schema.sql', 'utf8')
    // gen_random_uuid is built into modern PostgreSQL; PGlite does not bundle pgcrypto.
    await db.exec(migration.replace('create extension if not exists pgcrypto;', ''))
    const seed = await readFile('supabase/seed.sql', 'utf8')
    await db.exec(seed)
    await db.exec(seed)
    expect(
      (await db.query<{ count: number }>('select count(*)::int as count from historical_events'))
        .rows[0].count,
    ).toBeGreaterThanOrEqual(100)
    expect(
      (await db.query<{ count: number }>('select count(*)::int as count from event_sequence'))
        .rows[0].count,
    ).toBeGreaterThanOrEqual(400)
    await db.exec(
      `insert into auth.users values('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002'); set role anon;`,
    )
    expect((await db.query('select * from historical_events')).rows.length).toBeGreaterThanOrEqual(
      100,
    )
    expect((await db.query('select * from historical_people')).rows.length).toBeGreaterThanOrEqual(
      100,
    )
    await expect(db.query(`update historical_events set title='tampered'`)).rejects.toThrow()
    await db.exec(
      `reset role; set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);`,
    )
    const rounds = Array.from({ length: 10 }, (_, i) => ({
      event_slug: 'mactan',
      question_type: 'who',
      round_number: i + 1,
      score: 10000,
      answer_data: 'lapulapu',
      accuracy: 1,
      time_taken_ms: 5000,
    }))
    const args = ['10000000-0000-0000-0000-000000000001', 'mixed', 'medium', JSON.stringify(rounds)]
    await db.query('select save_game_result($1,$2,$3,$4)', args)
    await db.query('select save_game_result($1,$2,$3,$4)', args)
    expect((await db.query('select * from game_sessions')).rows).toHaveLength(1)
    expect((await db.query('select * from game_rounds')).rows).toHaveLength(10)
    const badRounds = [...rounds]
    badRounds[9] = { ...badRounds[9], score: 99999 }
    await expect(
      db.query('select save_game_result($1,$2,$3,$4)', [
        '10000000-0000-0000-0000-000000000003',
        'mixed',
        'medium',
        JSON.stringify(badRounds),
      ]),
    ).rejects.toThrow()
    expect((await db.query('select * from game_sessions')).rows).toHaveLength(1)
    await db.exec(
      `select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);`,
    )
    expect((await db.query('select * from game_sessions')).rows).toHaveLength(0)
    expect((await db.query('select * from game_rounds')).rows).toHaveLength(0)
    await expect(db.query('select save_game_result($1,$2,$3,$4)', args)).rejects.toThrow()
    await expect(
      db.query(
        `insert into game_sessions(user_id,history_scope,difficulty) values('00000000-0000-0000-0000-000000000001','mixed','easy')`,
      ),
    ).rejects.toThrow()
    await db.exec(
      `insert into profiles(id,display_name) values('00000000-0000-0000-0000-000000000002','Explorer');`,
    )
    expect((await db.query('select * from profiles')).rows).toHaveLength(1)
    await db.exec(
      `reset role; update historical_events set is_published=false where slug='mactan'; set role anon;`,
    )
    expect((await db.query('select * from historical_events')).rows).toHaveLength(123)
    expect((await db.query('select * from historical_people')).rows).toHaveLength(123)
  } finally {
    await db.close()
  }
}, 30000)
