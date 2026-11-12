-- ============================================================================
-- Spotted · DEMO connect (test data only)
-- Makes six demo profiles your friends and has Ishita send you a request, so
-- the Friends, Free now and Requests screens have something on them.
-- 1. Sign in to Spotted once and finish your profile.
-- 2. Replace YOUR_EMAIL_HERE below and run this in the Supabase SQL editor.
-- ============================================================================

do $$
declare me uuid;
begin
  select id into me from auth.users where lower(email) = lower('YOUR_EMAIL_HERE');
  if me is null then
    raise exception 'No user with that email. Sign in to Spotted once first.';
  end if;
  if not exists (select 1 from public.sp_profiles where id = me) then
    raise exception 'Finish your Spotted profile first.';
  end if;

  insert into public.sp_friendships (requester, addressee, status, responded_at)
  select d.id, me, 'accepted', now() from public.sp_profiles d
   where d.is_demo and d.name in ('Ayan', 'Moumita', 'Riya', 'Arijit', 'Soham', 'Tisha')
  on conflict do nothing;

  insert into public.sp_friendships (requester, addressee, status)
  select d.id, me, 'pending' from public.sp_profiles d
   where d.is_demo and d.name = 'Ishita'
  on conflict do nothing;
end $$;
