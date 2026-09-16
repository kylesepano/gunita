-- Apply to a Supabase project. No service-role key belongs in the frontend.
create extension if not exists pgcrypto;

create table public.historical_events (
 id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null,
 summary text not null, description text not null, year integer not null, month integer check(month between 1 and 12), day integer check(day between 1 and 31), cause_distractors jsonb,
 location_name text not null, latitude double precision not null check(latitude between -90 and 90), longitude double precision not null check(longitude between -180 and 180),
 country text not null, region text, category text not null default 'history', difficulty text not null default 'medium' check(difficulty in ('easy','medium','hard')),
 history_scope text not null check(history_scope in ('philippines','world')), source_summary text, editorial_note text, where_prompt text,
 is_published boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.historical_people (
 id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique, short_bio text not null, image_url text,
 birth_year integer, death_year integer, created_at timestamptz not null default now()
);
create table public.event_people (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.historical_events on delete cascade,
 person_id uuid not null references public.historical_people, role text not null, is_primary boolean not null default false,
 created_at timestamptz not null default now(), unique(event_id,person_id)
);
create table public.event_causes (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.historical_events on delete cascade,
 description text not null, sort_order integer not null, is_primary boolean not null default true, created_at timestamptz not null default now(), unique(event_id,sort_order)
);
create table public.event_sequence (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.historical_events on delete cascade,
 description text not null, sort_order integer not null, created_at timestamptz not null default now(), unique(event_id,sort_order)
);
create table public.event_clues (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.historical_events on delete cascade,
 difficulty text not null check(difficulty in ('easy','medium','hard')), clue_text text not null, created_at timestamptz not null default now(), unique(event_id,difficulty)
);
create table public.event_sources (
 id uuid primary key default gen_random_uuid(), event_id uuid not null references public.historical_events on delete cascade,
 url text not null, title text not null, accessed_at date, editorial_status text not null default 'needs_review', unique(event_id,url)
);
create table public.profiles (
 id uuid primary key references auth.users on delete cascade, username text unique, display_name text not null default '', avatar_url text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.game_sessions (
 id uuid primary key default gen_random_uuid(), user_id uuid references auth.users on delete cascade,
 history_scope text not null check(history_scope in ('mixed','philippines','world')), difficulty text not null check(difficulty in ('easy','medium','hard')),
 round_count integer not null default 10 check(round_count = 10), total_score integer not null default 0 check(total_score between 0 and 120000),
 started_at timestamptz not null default now(), completed_at timestamptz
);
create table public.game_rounds (
 id uuid primary key default gen_random_uuid(), game_session_id uuid not null references public.game_sessions on delete cascade,
 historical_event_id uuid not null references public.historical_events, question_type text not null check(question_type in ('who','where','when','what','why','how')),
 round_number integer not null check(round_number between 1 and 10), score integer not null check(score between 0 and 12000),
 answer_data jsonb, accuracy numeric not null check(accuracy between 0 and 1), is_correct boolean not null, time_taken_ms bigint not null check(time_taken_ms >= 0),
 created_at timestamptz not null default now(), unique(game_session_id,round_number)
);
create table public.achievements (
 id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null, description text not null,
 criteria jsonb not null default '{}', icon_url text, created_at timestamptz not null default now()
);
create index events_scope_published_idx on public.historical_events(history_scope,is_published);
create index sessions_user_idx on public.game_sessions(user_id);
create index people_event_idx on public.event_people(person_id);
create index rounds_event_idx on public.game_rounds(historical_event_id);

alter table public.historical_events enable row level security;
alter table public.historical_people enable row level security;
alter table public.event_people enable row level security;
alter table public.event_causes enable row level security;
alter table public.event_sequence enable row level security;
alter table public.event_clues enable row level security;
alter table public.event_sources enable row level security;
alter table public.profiles enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_rounds enable row level security;
alter table public.achievements enable row level security;

create policy published_events on public.historical_events for select to anon, authenticated using(is_published);
create policy published_people on public.historical_people for select to anon, authenticated using(exists(select 1 from public.event_people ep join public.historical_events e on e.id=ep.event_id where ep.person_id=historical_people.id and e.is_published));
create policy published_event_people on public.event_people for select to anon, authenticated using(exists(select 1 from public.historical_events e where e.id=event_id and e.is_published));
create policy published_causes on public.event_causes for select to anon, authenticated using(exists(select 1 from public.historical_events e where e.id=event_id and e.is_published));
create policy published_sequence on public.event_sequence for select to anon, authenticated using(exists(select 1 from public.historical_events e where e.id=event_id and e.is_published));
create policy published_clues on public.event_clues for select to anon, authenticated using(exists(select 1 from public.historical_events e where e.id=event_id and e.is_published));
create policy published_sources on public.event_sources for select to anon, authenticated using(exists(select 1 from public.historical_events e where e.id=event_id and e.is_published));
create policy own_profile_read on public.profiles for select to authenticated using(id=(select auth.uid()));
create policy own_profile_insert on public.profiles for insert to authenticated with check(id=(select auth.uid()));
create policy own_profile_update on public.profiles for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy own_session_read on public.game_sessions for select to authenticated using(user_id=(select auth.uid()));
create policy own_session_insert on public.game_sessions for insert to authenticated with check(user_id=(select auth.uid()));
create policy own_session_update on public.game_sessions for update to authenticated using(user_id=(select auth.uid())) with check(user_id=(select auth.uid()));
create policy own_round_read on public.game_rounds for select to authenticated using(exists(select 1 from public.game_sessions s where s.id=game_session_id and s.user_id=(select auth.uid())));
create policy own_round_insert on public.game_rounds for insert to authenticated with check(exists(select 1 from public.game_sessions s where s.id=game_session_id and s.user_id=(select auth.uid())));
create policy own_round_update on public.game_rounds for update to authenticated using(exists(select 1 from public.game_sessions s where s.id=game_session_id and s.user_id=(select auth.uid()))) with check(exists(select 1 from public.game_sessions s where s.id=game_session_id and s.user_id=(select auth.uid())));
create policy achievement_read on public.achievements for select to anon, authenticated using(true);

grant select on public.historical_events,public.historical_people,public.event_people,public.event_causes,public.event_sequence,public.event_clues,public.event_sources,public.achievements to anon,authenticated;
grant select,insert,update on public.profiles,public.game_sessions,public.game_rounds to authenticated;

create function public.set_updated_at() returns trigger language plpgsql set search_path=public as $$ begin new.updated_at=now(); return new; end $$;
create trigger events_updated before update on public.historical_events for each row execute function public.set_updated_at();
create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();

-- Transactional and idempotent. Invoker rights retain RLS. Client scores are private,
-- self-reported statistics, not suitable for a competitive leaderboard.
create function public.save_game_result(p_session_id uuid,p_scope text,p_difficulty text,p_rounds jsonb)
returns void language plpgsql security invoker set search_path=public as $$
declare total integer; duration_ms bigint;
begin
 if auth.uid() is null then raise exception 'Authentication required'; end if;
 if jsonb_typeof(p_rounds) <> 'array' or jsonb_array_length(p_rounds) <> 10 then raise exception 'Exactly ten rounds are required'; end if;
 if (select count(distinct (r->>'round_number')::integer) from jsonb_array_elements(p_rounds) r) <> 10 then raise exception 'Round numbers must be unique'; end if;
 if exists(select 1 from jsonb_array_elements(p_rounds) r left join historical_events e on e.slug=r->>'event_slug' where e.id is null or not e.is_published) then raise exception 'Unknown or unpublished event'; end if;
 select sum((r->>'score')::integer),sum((r->>'time_taken_ms')::bigint) into total,duration_ms from jsonb_array_elements(p_rounds) r;
 insert into game_sessions(id,user_id,history_scope,difficulty,total_score,started_at,completed_at)
 values(p_session_id,auth.uid(),p_scope,p_difficulty,total,now()-duration_ms*interval '1 millisecond',now())
 on conflict(id) do update set total_score=excluded.total_score,completed_at=excluded.completed_at;
 insert into game_rounds(game_session_id,historical_event_id,question_type,round_number,score,answer_data,accuracy,is_correct,time_taken_ms)
 select p_session_id,e.id,r->>'question_type',(r->>'round_number')::integer,(r->>'score')::integer,r->'answer_data',(r->>'accuracy')::numeric,(r->>'accuracy')::numeric>=0.8,(r->>'time_taken_ms')::bigint
 from jsonb_array_elements(p_rounds) r join historical_events e on e.slug=r->>'event_slug'
 on conflict(game_session_id,round_number) do update set historical_event_id=excluded.historical_event_id,question_type=excluded.question_type,score=excluded.score,answer_data=excluded.answer_data,accuracy=excluded.accuracy,is_correct=excluded.is_correct,time_taken_ms=excluded.time_taken_ms;
end $$;
revoke all on function public.save_game_result(uuid,text,text,jsonb) from public,anon;
grant execute on function public.save_game_result(uuid,text,text,jsonb) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('historical-portraits','historical-portraits',true,5242880,array['image/jpeg','image/png','image/webp']) on conflict(id) do nothing;
create policy public_portrait_read on storage.objects for select to anon,authenticated using(bucket_id='historical-portraits');
-- No client upload/edit policies: curate portraits using trusted administrative tooling.
