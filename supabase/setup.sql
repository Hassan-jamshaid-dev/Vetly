-- Prod-grade evaluations table. Identity is auth.uid() (anonymous sign-in).
-- The publishable key cannot read another user's rows.

drop trigger if exists evaluations_set_user_id on public.evaluations;
drop function if exists public.evaluations_set_user_id();
drop table if exists public.evaluations;

create table public.evaluations (
  user_id uuid not null references auth.users (id) on delete cascade,
  id uuid not null,
  title text not null check (char_length(title) <= 500),
  score smallint not null check (score between 1 and 10),
  -- Cap matches MAX_PAYLOAD_CHARS in src/services/evaluationCloud.ts
  payload jsonb not null default '{}'::jsonb
    check (octet_length(payload::text) <= 32000),
  created_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index evaluations_user_created_idx
  on public.evaluations (user_id, created_at desc);

create or replace function public.evaluations_set_user_id()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  new.user_id := auth.uid();
  return new;
end;
$$;

create trigger evaluations_set_user_id
before insert or update on public.evaluations
for each row
execute function public.evaluations_set_user_id();

alter table public.evaluations enable row level security;
alter table public.evaluations force row level security;

revoke all on table public.evaluations from public, anon;
grant select, insert, update, delete on table public.evaluations to authenticated;

create policy evaluations_select_own
  on public.evaluations
  for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy evaluations_insert_own
  on public.evaluations
  for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy evaluations_update_own
  on public.evaluations
  for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy evaluations_delete_own
  on public.evaluations
  for delete
  to authenticated
  using (user_id = (select auth.uid()));
