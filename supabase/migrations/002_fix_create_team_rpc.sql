-- Chạy file này trong Supabase SQL Editor để sửa lỗi:
-- "new row violates row-level security policy for table teams"
-- RPC này tạo đội + owner membership trong một transaction bảo mật.

alter table public.teams
  add column if not exists created_by uuid references auth.users(id) on delete restrict;

create table if not exists public.team_memberships (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (team_id, user_id)
);

create or replace function public.create_team(team_name text)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  new_team public.teams;
begin
  if auth.uid() is null then
    raise exception 'Bạn cần đăng nhập trước khi tạo đội';
  end if;
  if char_length(trim(team_name)) < 2 then
    raise exception 'Tên đội phải có ít nhất 2 ký tự';
  end if;

  insert into public.teams (name, created_by)
  values (trim(team_name), auth.uid())
  returning * into new_team;

  insert into public.team_memberships (team_id, user_id, role)
  values (new_team.id, auth.uid(), 'owner');

  return new_team;
end;
$$;

revoke all on function public.create_team(text) from public;
grant execute on function public.create_team(text) to authenticated;
