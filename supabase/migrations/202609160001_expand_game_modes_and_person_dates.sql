-- Expand the fixed-mode catalog and preserve the birth-date metadata used by
-- the Who distractor filter. Apply after 202609150002_admin_and_catalog.sql.
alter table public.game_sessions drop constraint if exists game_sessions_game_mode_check;
alter table public.game_sessions add constraint game_sessions_game_mode_check
  check (game_mode in ('roulette','who','where','when','what','why','how'));

alter table public.historical_people add column if not exists birth_year integer;
alter table public.historical_people add column if not exists death_year integer;

create or replace function public.save_game_result_with_mode(
  p_session_id uuid,
  p_scope text,
  p_difficulty text,
  p_rounds jsonb,
  p_mode text
)
returns void language plpgsql security invoker set search_path='' as $$
begin
  if p_mode not in ('roulette','who','where','when','what','why','how') or p_mode is null then
    raise exception 'Invalid game mode';
  end if;
  if p_mode <> 'roulette' and exists (
    select 1 from jsonb_array_elements(p_rounds) r
    where r->>'question_type' is distinct from p_mode
  ) then
    raise exception 'Round types do not match the selected mode';
  end if;
  perform public.save_game_result(p_session_id,p_scope,p_difficulty,p_rounds);
  update public.game_sessions
    set game_mode=p_mode
    where id=p_session_id and user_id=(select auth.uid());
end $$;
