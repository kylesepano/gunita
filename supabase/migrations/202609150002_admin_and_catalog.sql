-- Secure question management. Apply after 202609150001_initial_schema.sql.
create table public.admin_users (
 user_id uuid primary key references auth.users(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table public.admin_users enable row level security;
grant select on public.admin_users to authenticated;
create policy own_admin_membership on public.admin_users for select to authenticated using(user_id=(select auth.uid()));
-- Only a trusted SQL administrator may grant/revoke membership. No client write grants or policies.
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.admin_users where user_id=(select auth.uid()));
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon,authenticated;

alter table public.historical_events add column is_deleted boolean not null default false;
alter table public.historical_events add column cause_distractors jsonb;
alter table public.historical_people add column image_position text default '50% 25%';
alter table public.game_sessions add column game_mode text not null default 'roulette' check(game_mode in ('roulette','where','when'));
create index events_live_idx on public.historical_events(is_deleted,is_published,slug);
drop policy published_events on public.historical_events;
create policy published_events on public.historical_events for select to anon,authenticated using(is_published and not is_deleted);
create policy admin_event_read on public.historical_events for select to authenticated using((select public.is_admin()));
create policy admin_people_read on public.historical_people for select to authenticated using((select public.is_admin()));
create policy admin_event_people_read on public.event_people for select to authenticated using((select public.is_admin()));
create policy admin_causes_read on public.event_causes for select to authenticated using((select public.is_admin()));
create policy admin_sequence_read on public.event_sequence for select to authenticated using((select public.is_admin()));
create policy admin_clues_read on public.event_clues for select to authenticated using((select public.is_admin()));
create policy admin_sources_read on public.event_sources for select to authenticated using((select public.is_admin()));

create function public.admin_save_event(p_event jsonb,p_published boolean,p_expected_updated_at timestamptz default null)
returns text language plpgsql security definer set search_path='' as $$
declare v_id uuid; v_person uuid; v_slug text; v_updated timestamptz; v_deleted boolean;
 v_key text; v_items jsonb; v_min integer; v_max integer;
begin
 if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 if jsonb_typeof(p_event) is distinct from 'object' or p_published is null then raise exception 'Invalid question data'; end if;
 v_slug := p_event->>'id';
 if v_slug is null or v_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$' or length(v_slug)>200 then raise exception 'Invalid question ID'; end if;
 foreach v_key in array array['title','clue','description','location','country','role','source'] loop
   if jsonb_typeof(p_event->v_key) is distinct from 'string' or length(btrim(p_event->>v_key))=0 then raise exception '% is required',v_key; end if;
 end loop;
 if (p_event->>'year') is null or (p_event->>'year')::integer not between -10000 and 3000 then raise exception 'Invalid year'; end if;
 if jsonb_typeof(p_event->'coordinates') is distinct from 'array' or jsonb_array_length(p_event->'coordinates')<>2 then raise exception 'Two coordinates are required'; end if;
 if jsonb_typeof(p_event->'coordinates'->0) is distinct from 'number' or jsonb_typeof(p_event->'coordinates'->1) is distinct from 'number' then raise exception 'Coordinates must be numbers'; end if;
 if (p_event->'coordinates'->>0)::double precision not between -90 and 90 or (p_event->'coordinates'->>1)::double precision not between -180 and 180 then raise exception 'Coordinates are out of range'; end if;
 if coalesce(p_event->>'scope','') not in ('world','philippines') then raise exception 'Invalid collection'; end if;
 if (p_event->>'source') !~ '^https://[^[:space:]]+$' then raise exception 'An HTTPS source is required'; end if;
 foreach v_key in array array['name','bio','image'] loop
   if jsonb_typeof(p_event->'person'->v_key) is distinct from 'string' or length(btrim(p_event->'person'->>v_key))=0 then raise exception 'Person % is required',v_key; end if;
 end loop;
 if (p_event->'person'->>'image') !~ '^(https://[^[:space:]]+|/[^/[:space:]][^[:space:]]*)$' then raise exception 'Use a local portrait path or an HTTPS image'; end if;
 if coalesce(p_event->'person'->>'imagePosition','50% 25%') not in ('50% 0%','50% 25%','50% 50%') then raise exception 'Invalid portrait focus'; end if;
 foreach v_key in array array['causes','distractors','sequence'] loop
   v_items := p_event->v_key;
   v_min := case v_key when 'causes' then 1 else 2 end;
   v_max := case v_key when 'sequence' then 8 else 4 end;
   if jsonb_typeof(v_items) is distinct from 'array' then raise exception '% must be an array',v_key; end if;
   if jsonb_array_length(v_items) not between v_min and v_max then raise exception '% has an invalid number of entries',v_key; end if;
   if exists(select 1 from jsonb_array_elements(v_items) item where jsonb_typeof(item)<>'string' or length(btrim(item#>>'{}'))=0) then raise exception '% contains an empty or invalid entry',v_key; end if;
   if (select count(distinct lower(btrim(item))) from jsonb_array_elements_text(v_items) item)<>jsonb_array_length(v_items) then raise exception '% contains duplicates',v_key; end if;
 end loop;
 if exists(select 1 from jsonb_array_elements_text(p_event->'causes') c join jsonb_array_elements_text(p_event->'distractors') d on lower(btrim(c))=lower(btrim(d))) then raise exception 'Correct and incorrect causes must not overlap'; end if;
 select id,updated_at,is_deleted into v_id,v_updated,v_deleted from public.historical_events where slug=v_slug for update;
 if found then
   if v_deleted then raise exception 'This question was removed. Create a new question with a different title.'; end if;
   if p_expected_updated_at is null or v_updated<>p_expected_updated_at then raise exception 'This question changed since you opened it. Return to the library and reload before editing.'; end if;
   update public.historical_events set title=btrim(p_event->>'title'),summary=btrim(p_event->>'clue'),description=btrim(p_event->>'description'),year=(p_event->>'year')::integer,
     location_name=btrim(p_event->>'location'),latitude=(p_event->'coordinates'->>0)::double precision,longitude=(p_event->'coordinates'->>1)::double precision,
     country=btrim(p_event->>'country'),history_scope=p_event->>'scope',source_summary=p_event->>'source',editorial_note=nullif(btrim(p_event->>'note'),''),where_prompt=nullif(btrim(p_event->>'wherePrompt'),''),
     cause_distractors=p_event->'distractors',is_published=p_published where id=v_id;
 else
   if p_expected_updated_at is not null then raise exception 'This question no longer exists'; end if;
   insert into public.historical_events(slug,title,summary,description,year,location_name,latitude,longitude,country,history_scope,source_summary,editorial_note,where_prompt,cause_distractors,is_published)
   values(v_slug,btrim(p_event->>'title'),btrim(p_event->>'clue'),btrim(p_event->>'description'),(p_event->>'year')::integer,btrim(p_event->>'location'),(p_event->'coordinates'->>0)::double precision,(p_event->'coordinates'->>1)::double precision,btrim(p_event->>'country'),p_event->>'scope',p_event->>'source',nullif(btrim(p_event->>'note'),''),nullif(btrim(p_event->>'wherePrompt'),''),p_event->'distractors',p_published) returning id into v_id;
 end if;
 -- Isolate this event's editable person so another event's answer is never silently changed.
 insert into public.historical_people(slug,name,short_bio,image_url,image_position)
 values('question-'||v_slug||'-primary',btrim(p_event->'person'->>'name'),btrim(p_event->'person'->>'bio'),p_event->'person'->>'image',coalesce(p_event->'person'->>'imagePosition','50% 25%'))
 on conflict(slug) do update set name=excluded.name,short_bio=excluded.short_bio,image_url=excluded.image_url,image_position=excluded.image_position returning id into v_person;
 delete from public.event_people where event_id=v_id;
 insert into public.event_people(event_id,person_id,role,is_primary) values(v_id,v_person,btrim(p_event->>'role'),true);
 delete from public.event_causes where event_id=v_id;
 insert into public.event_causes(event_id,description,sort_order) select v_id,btrim(value),ordinality::integer-1 from jsonb_array_elements_text(p_event->'causes') with ordinality;
 delete from public.event_sequence where event_id=v_id;
 insert into public.event_sequence(event_id,description,sort_order) select v_id,btrim(value),ordinality::integer-1 from jsonb_array_elements_text(p_event->'sequence') with ordinality;
 delete from public.event_clues where event_id=v_id;
 insert into public.event_clues(event_id,difficulty,clue_text) select v_id,d,btrim(p_event->>'clue') from unnest(array['easy','medium','hard']) d;
 delete from public.event_sources where event_id=v_id;
 insert into public.event_sources(event_id,url,title,editorial_status) values(v_id,p_event->>'source',p_event->>'title','admin_reviewed');
 return v_slug;
end $$;
revoke all on function public.admin_save_event(jsonb,boolean,timestamptz) from public,anon;
grant execute on function public.admin_save_event(jsonb,boolean,timestamptz) to authenticated;

create function public.admin_remove_event(p_slug text,p_expected_updated_at timestamptz)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not public.is_admin() then raise exception 'Admin access required' using errcode='42501'; end if;
 update public.historical_events set is_deleted=true,is_published=false where slug=p_slug and not is_deleted and updated_at=p_expected_updated_at;
 if not found then raise exception 'This question changed or was already removed. Reload the library.'; end if;
end $$;
revoke all on function public.admin_remove_event(text,timestamptz) from public,anon;
grant execute on function public.admin_remove_event(text,timestamptz) to authenticated;

-- Persist the selected game mode while keeping the original result function compatible.
create function public.save_game_result_with_mode(p_session_id uuid,p_scope text,p_difficulty text,p_rounds jsonb,p_mode text)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if p_mode not in ('roulette','where','when') or p_mode is null then raise exception 'Invalid game mode'; end if;
 if p_mode<>'roulette' and exists(select 1 from jsonb_array_elements(p_rounds) r where r->>'question_type' is distinct from p_mode) then raise exception 'Round types do not match the selected mode'; end if;
 perform public.save_game_result(p_session_id,p_scope,p_difficulty,p_rounds);
 update public.game_sessions set game_mode=p_mode where id=p_session_id and user_id=(select auth.uid());
end $$;
revoke all on function public.save_game_result_with_mode(uuid,text,text,jsonb,text) from public,anon;
grant execute on function public.save_game_result_with_mode(uuid,text,text,jsonb,text) to authenticated;
