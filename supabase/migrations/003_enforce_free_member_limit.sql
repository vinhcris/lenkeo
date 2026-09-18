-- Trà Đá được tối đa 12 thành viên. Chạy file này sau các migration trước.
create or replace function public.enforce_member_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  current_tier text;
  current_count integer;
begin
  select tier into current_tier from public.teams where id = new.team_id;
  if current_tier = 'tra_da' then
    select count(*) into current_count from public.members where team_id = new.team_id;
    if current_count >= 12 then
      raise exception 'Gói Trà Đá chỉ hỗ trợ tối đa 12 thành viên. Hãy nâng cấp để thêm thành viên.';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists enforce_member_limit_before_insert on public.members;
create trigger enforce_member_limit_before_insert
before insert on public.members for each row execute function public.enforce_member_limit();
