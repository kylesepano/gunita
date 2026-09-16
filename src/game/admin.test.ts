import { readFile } from 'node:fs/promises'
import { PGlite } from '@electric-sql/pglite'
import { it, expect } from 'vitest'
import { events } from '../data/events'
import { causeDistractors } from '../data/causeDistractors'
import { validateEvent } from '../features/admin/eventValidation'

const question = {
  ...events[0],
  id: 'mactan-admin-test',
  country: 'Philippines',
  distractors: causeDistractors.mactan,
}
it('validates required fields, answer choices, images and coordinates', () => {
  expect(validateEvent(question)).toEqual([])
  expect(validateEvent({ ...question, coordinates: [100, 0] })).toContain(
    'Latitude must be between -90 and 90.',
  )
  expect(
    validateEvent({ ...question, person: { ...question.person, image: 'javascript:alert(1)' } })
      .length,
  ).toBeGreaterThan(0)
  expect(validateEvent({ ...question, distractors: [question.causes[0], 'Other'] })).toContain(
    'An incorrect cause cannot also be a correct cause.',
  )
  expect(validateEvent({ ...question, sequence: ['A', 'A'] })).toContain(
    'Sequence stages must be nonempty and distinct.',
  )
})
it('enforces admin-only CRUD, draft visibility, atomic edits and stale edit protection', async () => {
  const db = new PGlite()
  try {
    await db.exec(
      `create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated; create schema storage; create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]); create table storage.objects(id uuid primary key,bucket_id text); alter table storage.objects enable row level security;`,
    )
    await db.exec(
      (await readFile('supabase/migrations/202609150001_initial_schema.sql', 'utf8')).replace(
        'create extension if not exists pgcrypto;',
        '',
      ),
    )
    await db.exec(await readFile('supabase/migrations/202609150002_admin_and_catalog.sql', 'utf8'))
    await db.exec(
      await readFile(
        'supabase/migrations/202609160001_expand_game_modes_and_person_dates.sql',
        'utf8',
      ),
    )
    await db.exec(await readFile('supabase/seed.sql', 'utf8'))
    await db.exec(
      `insert into auth.users values('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002'); insert into public.admin_users(user_id) values('00000000-0000-0000-0000-000000000001'); set role authenticated; select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',false);`,
    )
    expect((await db.query<{ is_admin: boolean }>('select is_admin()')).rows[0].is_admin).toBe(
      false,
    )
    await expect(
      db.query('select admin_save_event($1,false,null)', [JSON.stringify(question)]),
    ).rejects.toThrow('Admin access required')
    await expect(
      db.query(`insert into admin_users(user_id) values('00000000-0000-0000-0000-000000000002')`),
    ).rejects.toThrow()
    await expect(db.query('select admin_remove_event($1,now())', ['mactan'])).rejects.toThrow(
      'Admin access required',
    )
    await db.exec(
      `select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',false);`,
    )
    expect((await db.query<{ is_admin: boolean }>('select is_admin()')).rows[0].is_admin).toBe(true)
    await db.query('select admin_save_event($1,false,null)', [JSON.stringify(question)])
    const stamp = async () =>
      (
        await db.query<{ stamp: string }>(
          'select updated_at::text as stamp from historical_events where slug=$1',
          [question.id],
        )
      ).rows[0].stamp
    const firstStamp = await stamp()
    expect((await db.query('select * from historical_events')).rows).toHaveLength(events.length + 1)
    await db.exec('reset role; set role anon;')
    expect((await db.query('select * from historical_events')).rows).toHaveLength(events.length)
    expect(
      (
        await db.query(
          `select * from historical_people where slug='question-mactan-admin-test-primary'`,
        )
      ).rows,
    ).toHaveLength(0)
    await db.exec('reset role; set role authenticated;')
    await expect(
      db.query('select admin_save_event($1,true,$2)', [
        JSON.stringify({ ...question, coordinates: [91, 0] }),
        firstStamp,
      ]),
    ).rejects.toThrow()
    expect(await stamp()).toBe(firstStamp)
    const edited = {
      ...question,
      title: 'Battle of Mactan — reviewed',
      sequence: question.sequence.slice(0, 3),
    }
    await db.query('select admin_save_event($1,true,$2)', [JSON.stringify(edited), firstStamp])
    const secondStamp = await stamp()
    await expect(
      db.query('select admin_save_event($1,true,$2)', [JSON.stringify(question), firstStamp]),
    ).rejects.toThrow('changed since you opened')
    expect(
      (
        await db.query(
          'select * from event_sequence where event_id=(select id from historical_events where slug=$1)',
          [question.id],
        )
      ).rows,
    ).toHaveLength(3)
    await db.exec('reset role; set role anon;')
    expect((await db.query('select * from historical_events')).rows).toHaveLength(events.length + 1)
    await db.exec('reset role; set role authenticated;')
    await expect(
      db.query('select admin_remove_event($1,$2)', [question.id, firstStamp]),
    ).rejects.toThrow('changed or was already removed')
    await db.query('select admin_remove_event($1,$2)', [question.id, secondStamp])
    await db.exec('reset role; set role anon;')
    expect((await db.query('select * from historical_events')).rows).toHaveLength(events.length)
    expect(
      (
        await db.query(
          `select * from historical_people where slug='question-mactan-admin-test-primary'`,
        )
      ).rows,
    ).toHaveLength(0)
    await db.exec('reset role; set role authenticated;')
    const rounds = Array.from({ length: 10 }, (_, i) => ({
      event_slug: 'mactan',
      question_type: 'where',
      round_number: i + 1,
      score: 10000,
      answer_data: [10, 124],
      accuracy: 1,
      time_taken_ms: 1000,
    }))
    await db.query('select save_game_result_with_mode($1,$2,$3,$4,$5)', [
      '10000000-0000-0000-0000-000000000001',
      'mixed',
      'easy',
      JSON.stringify(rounds),
      'where',
    ])
    expect(
      (await db.query<{ game_mode: string }>('select game_mode from game_sessions')).rows[0]
        .game_mode,
    ).toBe('where')
    await expect(
      db.query('select save_game_result_with_mode($1,$2,$3,$4,$5)', [
        '10000000-0000-0000-0000-000000000002',
        'mixed',
        'easy',
        JSON.stringify(rounds),
        'when',
      ]),
    ).rejects.toThrow('do not match')
  } finally {
    await db.close()
  }
}, 30000)
