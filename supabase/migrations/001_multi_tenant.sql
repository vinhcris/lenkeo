-- PitchPro / Lên Kèo SaaS: chạy TOÀN BỘ file này một lần trong Supabase SQL Editor.
-- Bản này mở rộng schema yêu cầu bằng team_memberships + RLS; team_id đơn lẻ không đủ bảo mật.
create extension if not exists pgcrypto;

create table public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) >= 2),
  tier text not null default 'tra_da' check (tier in ('tra_da', 'bia_hoi', 'len_mam')),
  is_upgrade_pending boolean not null default false,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default timezone('utc', now())
);
create table public.team_memberships (
  team_id uuid not null references public.teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default timezone('utc', now()),
  primary key (team_id, user_id)
);
create table public.members (
  id uuid primary key default gen_random_uuid(), team_id uuid not null references public.teams(id) on delete cascade,
  full_name text not null, phone text, created_at timestamptz not null default timezone('utc', now())
);
create table public.treasury (
  id uuid primary key default gen_random_uuid(), team_id uuid not null references public.teams(id) on delete cascade,
  description text not null, amount numeric(12,2) not null check (amount > 0),
  type text not null check (type in ('in', 'out')), created_at timestamptz not null default timezone('utc', now())
);
create index team_memberships_user_id_idx on public.team_memberships(user_id);
create index members_team_id_idx on public.members(team_id);
create index treasury_team_id_idx on public.treasury(team_id);

-- A browser may request an upgrade but can never assign itself a paid tier.
-- Tier changes are reserved for a server-side Edge Function using service_role.
create or replace function public.prevent_client_plan_change()
returns trigger language plpgsql as $$
begin
  if new.tier is distinct from old.tier and auth.role() <> 'service_role' then
    raise exception 'Only an administrator can change a team tier';
  end if;
  if old.is_upgrade_pending = true and new.is_upgrade_pending = false and auth.role() <> 'service_role' then
    raise exception 'Only an administrator can clear an upgrade request';
  end if;
  return new;
end;
$$;
create trigger protect_team_plan_changes before update on public.teams
for each row execute function public.prevent_client_plan_change();

-- SECURITY DEFINER prevents recursive policies; fixed search_path prevents search-path abuse.
create or replace function public.is_team_member(target_team_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.team_memberships where team_id = target_team_id and user_id = auth.uid());
$$;
create or replace function public.has_team_role(target_team_id uuid, allowed_roles text[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.team_memberships where team_id = target_team_id and user_id = auth.uid() and role = any(allowed_roles));
$$;
revoke all on function public.is_team_member(uuid) from public;
revoke all on function public.has_team_role(uuid, text[]) from public;
grant execute on function public.is_team_member(uuid), public.has_team_role(uuid, text[]) to authenticated;

alter table public.teams enable row level security;
alter table public.team_memberships enable row level security;
alter table public.members enable row level security;
alter table public.treasury enable row level security;

create policy "team members can read their team" on public.teams for select to authenticated using (public.is_team_member(id));
create policy "users create their own team" on public.teams for insert to authenticated with check (created_by = (select auth.uid()));
create policy "owners manage team plan request" on public.teams for update to authenticated using (public.has_team_role(id, array['owner','admin'])) with check (public.has_team_role(id, array['owner','admin']));
create policy "members read membership" on public.team_memberships for select to authenticated using (public.is_team_member(team_id));
create policy "creator creates initial owner membership" on public.team_memberships for insert to authenticated with check (user_id = (select auth.uid()) and role = 'owner' and exists (select 1 from public.teams where id = team_id and created_by = (select auth.uid())));
create policy "owners manage membership" on public.team_memberships for all to authenticated using (public.has_team_role(team_id, array['owner','admin'])) with check (public.has_team_role(team_id, array['owner','admin']));
create policy "team reads members" on public.members for select to authenticated using (public.is_team_member(team_id));
create policy "admins manage members" on public.members for all to authenticated using (public.has_team_role(team_id, array['owner','admin'])) with check (public.has_team_role(team_id, array['owner','admin']));
create policy "team reads treasury" on public.treasury for select to authenticated using (public.is_team_member(team_id));
create policy "admins manage treasury" on public.treasury for all to authenticated using (public.has_team_role(team_id, array['owner','admin'])) with check (public.has_team_role(team_id, array['owner','admin']));

-- Client users may only set is_upgrade_pending=true; the trigger blocks tier changes.
