-- ============================================================================
-- Spotted · RLS tests
-- Acts as several different signed-in users (by setting the JWT claims that
-- auth.uid() reads) and checks what each one can see and change. Everything
-- runs inside one transaction that is rolled back, so the database is left
-- exactly as it was. Run it in the Supabase SQL editor, or with
--   supabase db query --remote=<ref> -f supabase/rls-tests.sql
-- Every row of the result should say pass = true.
-- ============================================================================

begin;

create temp table rls_results (
  n serial primary key, test text, expected text, actual text, pass boolean
) on commit drop;
grant all on rls_results to authenticated, anon;
grant usage on sequence rls_results_n_seq to authenticated, anon;

do $$
declare
  -- Throwaway fixture people (rolled back at the end).
  a uuid := gen_random_uuid();   -- Asha: shares location, has a free grid
  b uuid := gen_random_uuid();   -- Bikram: Asha's accepted friend
  c uuid := gen_random_uuid();   -- Chandni: a stranger to Asha
  d uuid := gen_random_uuid();   -- Dev: sends Asha a request that stays pending
  v int; t text; r record; e text;

  -- small helpers as nested blocks below; this one records a result
begin
  insert into public.sp_profiles (id, name, adult_confirmed_at, is_demo) values
    (a, 'Asha (rls test)', now(), true), (b, 'Bikram (rls test)', now(), true),
    (c, 'Chandni (rls test)', now(), true), (d, 'Dev (rls test)', now(), true);
  insert into public.sp_friendships (requester, addressee, status) values (a, b, 'accepted');
  insert into public.sp_friendships (requester, addressee, status) values (d, a, 'pending');
  insert into public.sp_presence (user_id, lat, lng, expires_at) values (a, 22.97, 88.44, now() + interval '1 hour');
  insert into public.sp_free_slots (user_id, grid, free_until) values (a, repeat('01', 36), now() + interval '2 hours');
  insert into public.sp_posts (author_id, photo_path, thumb_path, lat, lng, is_demo)
    values (a, 'test/a.webp', 'test/a_t.webp', 22.97, 88.44, true);

  -- ---------------------------------------------------------------- as Bikram (friend)
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);

  select count(*) into v from public.sp_presence where user_id = a;
  insert into rls_results (test, expected, actual, pass) values ('friend can read live location', '1', v, v = 1);
  select count(*) into v from public.sp_free_slots where user_id = a and free_until is not null;
  insert into rls_results (test, expected, actual, pass) values ('friend can read free slots + free-till', '1', v, v = 1);

  -- ---------------------------------------------------------------- as Chandni (stranger)
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);

  select count(*) into v from public.sp_presence where user_id = a;
  insert into rls_results (test, expected, actual, pass) values ('non-friend cannot read live location', '0', v, v = 0);
  select count(*) into v from public.sp_free_slots where user_id = a;
  insert into rls_results (test, expected, actual, pass) values ('non-friend cannot read free slots', '0', v, v = 0);
  select count(*) into v from public.sp_presence;
  insert into rls_results (test, expected, actual, pass) values ('non-friend sees no presence rows at all', '0', v, v = 0);

  update public.sp_free_slots set grid = repeat('1', 72) where user_id = a;
  get diagnostics v = row_count;
  insert into rls_results (test, expected, actual, pass) values ('non-friend cannot change someone''s free slots', '0 rows', v || ' rows', v = 0);

  begin
    insert into public.sp_presence (user_id, lat, lng, expires_at) values (a, 0, 0, now() + interval '1 hour');
    e := 'inserted';
  exception when others then e := 'denied';
  end;
  insert into rls_results (test, expected, actual, pass) values ('cannot write a location as someone else', 'denied', e, e = 'denied');

  select count(*) into v from public.sp_friendships;
  insert into rls_results (test, expected, actual, pass) values ('stranger cannot see other people''s friendships', '0', v, v = 0);

  select count(*) into v from public.sp_posts where author_id = a;
  insert into rls_results (test, expected, actual, pass) values ('posts are visible to members (before any block)', '1', v, v = 1);

  -- ---------------------------------------------------------------- as Dev (pending request only)
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  select count(*) into v from public.sp_presence where user_id = a;
  insert into rls_results (test, expected, actual, pass) values ('pending request does not unlock location', '0', v, v = 0);
  select count(*) into v from public.sp_free_slots where user_id = a;
  insert into rls_results (test, expected, actual, pass) values ('pending request does not unlock free slots', '0', v, v = 0);

  -- Asha ignores Dev; Dev must not be able to tell.
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  perform public.sp_respond_friend((select id from public.sp_friendships where requester = d and addressee = a), false);
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  select state into t from public.sp_my_friendships() where other_id = a;
  insert into rls_results (test, expected, actual, pass) values ('ignored request still reads "outgoing" to the sender', 'outgoing', coalesce(t, 'none'), t = 'outgoing');
  select count(*) into v from public.sp_friendships where status = 'ignored';
  insert into rls_results (test, expected, actual, pass) values ('sender cannot see the ignored status', '0', v, v = 0);

  -- ---------------------------------------------------------------- privacy rounding
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  insert into public.sp_presence (user_id, lat, lng, expires_at)
    values (b, 22.973456, 88.446789, now() + interval '9 hours');
  select lat || ',' || lng || case when expires_at <= now() + interval '2 hours 1 second' then ' (<=2h)' else ' (too long)' end
    into t from public.sp_presence where user_id = b;
  insert into rls_results (test, expected, actual, pass) values ('live location rounded to ~100 m and capped at 2 h', '22.973,88.447 (<=2h)', t, t = '22.973,88.447 (<=2h)');

  insert into public.sp_posts (author_id, photo_path, thumb_path, lat, lng, pin_precision)
    values (b, b || '/x.webp', b || '/x_t.webp', 22.973456, 88.446789, 'area') returning lat || ',' || round(lng::numeric, 5) into t;
  insert into rls_results (test, expected, actual, pass) values ('"area only" pin never stores the exact spot', 'snapped (not 22.973456)', t, t not like '22.973456%');

  begin
    insert into public.sp_posts (author_id, photo_path, thumb_path, lat, lng)
      values (b, a || '/x.webp', a || '/x_t.webp', 22.97, 88.44);
    e := 'inserted';
  exception when others then e := 'denied';
  end;
  insert into rls_results (test, expected, actual, pass) values ('cannot post a photo path outside your own folder', 'denied', e, e = 'denied');

  -- Expired rows disappear for friends.
  perform set_config('role', 'none', true);
  update public.sp_presence set expires_at = now() - interval '1 minute' where user_id = a;
  perform set_config('role', 'authenticated', true);
  select count(*) into v from public.sp_presence where user_id = a;
  insert into rls_results (test, expected, actual, pass) values ('expired live location is hidden even from friends', '0', v, v = 0);
  perform set_config('role', 'none', true);
  update public.sp_presence set expires_at = now() + interval '1 hour' where user_id = a;
  perform set_config('role', 'authenticated', true);

  -- ---------------------------------------------------------------- blocks
  -- Chandni blocks Asha.
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  perform public.sp_block(a);
  select count(*) into v from public.sp_profiles where id = a;
  insert into rls_results (test, expected, actual, pass) values ('blocker no longer sees the blocked profile', '0', v, v = 0);
  select count(*) into v from public.sp_posts where author_id = a;
  insert into rls_results (test, expected, actual, pass) values ('blocker no longer sees their posts', '0', v, v = 0);

  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  select count(*) into v from public.sp_profiles where id = c;
  insert into rls_results (test, expected, actual, pass) values ('blocked person no longer sees the blocker (both ways)', '0', v, v = 0);
  select count(*) into v from public.sp_blocks;
  insert into rls_results (test, expected, actual, pass) values ('blocked person cannot see the block row', '0', v, v = 0);
  begin
    perform public.sp_request_friend(c);
    e := 'sent';
  exception when others then e := 'refused';
  end;
  insert into rls_results (test, expected, actual, pass) values ('blocked person cannot send a friend request', 'refused', e, e = 'refused');

  -- Bikram blocks his friend Asha: friendship ends, location and slots vanish both ways.
  perform set_config('request.jwt.claims', json_build_object('sub', b, 'role', 'authenticated')::text, true);
  perform public.sp_block(a);
  select count(*) into v from public.sp_presence where user_id = a;
  insert into rls_results (test, expected, actual, pass) values ('blocking a friend hides their location', '0', v, v = 0);
  select count(*) into v from public.sp_free_slots where user_id = a;
  insert into rls_results (test, expected, actual, pass) values ('blocking a friend hides their free slots', '0', v, v = 0);
  perform set_config('request.jwt.claims', json_build_object('sub', a, 'role', 'authenticated')::text, true);
  select count(*) into v from public.sp_presence where user_id = b;
  insert into rls_results (test, expected, actual, pass) values ('...and hides the blocker''s location from them', '0', v, v = 0);
  select count(*) into v from public.sp_friendships where b in (requester, addressee);
  insert into rls_results (test, expected, actual, pass) values ('block deletes the friendship', '0', v, v = 0);

  -- ---------------------------------------------------------------- reports
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  insert into public.sp_reports (target_user, reason) values (a, 'spam');
  begin
    select count(*) into v from public.sp_reports;
    e := 'readable';
  exception when others then e := 'denied';
  end;
  insert into rls_results (test, expected, actual, pass) values ('members can file but not read reports', 'denied', e, e = 'denied');

  -- ---------------------------------------------------------------- storage (sp-photos)
  perform set_config('request.jwt.claims', json_build_object('sub', d, 'role', 'authenticated')::text, true);
  begin
    insert into storage.objects (bucket_id, name, owner_id) values ('sp-photos', d || '/rls-test.webp', d::text);
    e := 'allowed';
  exception when others then e := 'denied';
  end;
  insert into rls_results (test, expected, actual, pass) values ('storage: can upload into your own folder', 'allowed', e, e = 'allowed');
  begin
    insert into storage.objects (bucket_id, name, owner_id) values ('sp-photos', a || '/rls-test.webp', d::text);
    e := 'allowed';
  exception when others then e := 'denied';
  end;
  insert into rls_results (test, expected, actual, pass) values ('storage: cannot upload into someone else''s folder', 'denied', e, e = 'denied');
  perform set_config('request.jwt.claims', json_build_object('sub', c, 'role', 'authenticated')::text, true);
  select count(*) into v from storage.objects where bucket_id = 'sp-photos' and name = d || '/rls-test.webp';
  insert into rls_results (test, expected, actual, pass) values ('storage: signed-in members can read photos', '1', v, v = 1);
  update storage.objects set name = c || '/stolen.webp' where bucket_id = 'sp-photos' and name = d || '/rls-test.webp';
  get diagnostics v = row_count;
  insert into rls_results (test, expected, actual, pass) values ('storage: cannot rename or overwrite someone else''s photo', '0 rows', v || ' rows', v = 0);

  -- ---------------------------------------------------------------- anon
  perform set_config('role', 'anon', true);
  perform set_config('request.jwt.claims', '{"role":"anon"}', true);
  begin
    select count(*) into v from public.sp_posts;
    e := 'readable';
  exception when others then e := 'denied';
  end;
  insert into rls_results (test, expected, actual, pass) values ('signed-out visitors can read nothing', 'denied', e, e = 'denied');
  select count(*) into v from storage.objects where bucket_id = 'sp-photos';
  insert into rls_results (test, expected, actual, pass) values ('storage: signed-out visitors see no photos', '0', v, v = 0);

  perform set_config('role', 'none', true);
end $$;

select n, test, expected, actual, pass from rls_results order by n;

rollback;
