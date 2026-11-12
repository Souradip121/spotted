-- ============================================================================
-- Spotted · database schema (Supabase / Postgres 15+)
--
-- Every object here is prefixed sp_ (and the storage bucket is sp-photos), so
-- Spotted can share a Supabase project with other apps. The file is
-- idempotent: run it again after any change and it converges.
--
-- Safety design, enforced here rather than in the client:
--   * RLS on every table. anon gets nothing; the app needs a signed-in user.
--   * Blocks hide two people from each other in both directions.
--   * Live location: one row per user, rounded to ~100 m by a trigger,
--     expires after at most 2 hours, readable only by accepted friends,
--     no history (the row is overwritten, ghost mode deletes it, and a cron
--     job sweeps expired rows).
--   * "Area only" photo pins are snapped to a ~500 m grid by a trigger, so the
--     exact spot is never stored.
--   * Free-slot grids and "free till" status are friends-only.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.sp_profiles (
  id                 uuid primary key,
  -- Real people: user_id = id = auth.users.id. Demo profiles have no auth user.
  user_id            uuid unique references auth.users (id) on delete cascade,
  name               text not null check (char_length(btrim(name)) between 1 and 40),
  college            text check (char_length(college) <= 80),
  avatar_path        text check (char_length(avatar_path) <= 200),
  adult_confirmed_at timestamptz not null,
  is_demo            boolean not null default false,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint sp_profiles_identity check (
    (is_demo and user_id is null) or (not is_demo and user_id is not null and user_id = id)
  )
);

create table if not exists public.sp_friendships (
  -- Random primary key on purpose: Realtime broadcasts the primary key of
  -- deleted rows to every subscriber, so it must not identify anyone.
  id           uuid primary key default gen_random_uuid(),
  requester    uuid not null references public.sp_profiles (id) on delete cascade,
  addressee    uuid not null references public.sp_profiles (id) on delete cascade,
  status       text not null default 'pending'
               check (status in ('pending', 'accepted', 'ignored')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  constraint sp_friendships_not_self check (requester <> addressee)
);
create unique index if not exists sp_friendships_pair_key
  on public.sp_friendships (least(requester, addressee), greatest(requester, addressee));
create index if not exists sp_friendships_addressee_idx on public.sp_friendships (addressee);
create index if not exists sp_friendships_requester_idx on public.sp_friendships (requester);

create table if not exists public.sp_blocks (
  blocker    uuid not null references public.sp_profiles (id) on delete cascade,
  blocked    uuid not null references public.sp_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  constraint sp_blocks_not_self check (blocker <> blocked)
);
create index if not exists sp_blocks_blocked_idx on public.sp_blocks (blocked);

create table if not exists public.sp_posts (
  id            uuid primary key default gen_random_uuid(),
  author_id     uuid not null references public.sp_profiles (id) on delete cascade,
  -- Storage path in the sp-photos bucket ("<uid>/<post>.webp"). Demo posts
  -- point at files shipped with the site instead ("photos/<name>.webp").
  photo_path    text not null check (char_length(photo_path) <= 200),
  thumb_path    text not null check (char_length(thumb_path) <= 200),
  width         int check (width between 1 and 4000),
  height        int check (height between 1 and 4000),
  caption       text check (char_length(caption) <= 500),
  place_name    text check (char_length(place_name) <= 80),
  lat           double precision not null check (lat between -90 and 90),
  lng           double precision not null check (lng between -180 and 180),
  pin_precision text not null default 'exact' check (pin_precision in ('exact', 'area')),
  frame_no      int not null default 1,
  like_count    int not null default 0,
  comment_count int not null default 0,
  is_demo       boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists sp_posts_author_idx on public.sp_posts (author_id, created_at desc);
create index if not exists sp_posts_created_idx on public.sp_posts (created_at desc);

create table if not exists public.sp_likes (
  post_id    uuid not null references public.sp_posts (id) on delete cascade,
  user_id    uuid not null references public.sp_profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists sp_likes_user_idx on public.sp_likes (user_id);

create table if not exists public.sp_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.sp_posts (id) on delete cascade,
  author_id  uuid not null references public.sp_profiles (id) on delete cascade,
  body       text not null check (char_length(btrim(body)) between 1 and 500),
  created_at timestamptz not null default now()
);
create index if not exists sp_comments_post_idx on public.sp_comments (post_id, created_at);
create index if not exists sp_comments_author_idx on public.sp_comments (author_id);

create table if not exists public.sp_free_slots (
  user_id    uuid primary key references public.sp_profiles (id) on delete cascade,
  -- 72 characters, one per hour: Mon..Sat (6 days) x 08:00..19:00 (12 hours).
  -- Index = day * 12 + (hour - 8). '1' = usually free. Repeats every week.
  grid       text not null default repeat('0', 72) check (grid ~ '^[01]{72}$'),
  -- Optional "free till 5 pm" status for today.
  free_until timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.sp_presence (
  -- Random primary key, same reason as sp_friendships.
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references public.sp_profiles (id) on delete cascade,
  lat        double precision not null check (lat between -90 and 90),
  lng        double precision not null check (lng between -180 and 180),
  expires_at timestamptz not null,
  updated_at timestamptz not null default now()
);
create index if not exists sp_presence_expires_idx on public.sp_presence (expires_at);

create table if not exists public.sp_reports (
  id          uuid primary key default gen_random_uuid(),
  reporter    uuid not null default auth.uid() references public.sp_profiles (id) on delete cascade,
  target_user uuid references public.sp_profiles (id) on delete set null,
  target_post uuid references public.sp_posts (id) on delete set null,
  reason      text not null check (reason in ('spam', 'harassment', 'nudity', 'violence', 'fake', 'privacy', 'other')),
  details     text check (char_length(details) <= 1000),
  created_at  timestamptz not null default now()
);
-- "Has a target" is checked by the insert policy, not a constraint, so that
-- deleting a reported post or profile (which nulls the target) still works.
alter table public.sp_reports drop constraint if exists sp_reports_has_target;

-- ---------------------------------------------------------------------------
-- Helper functions. They only ever answer about the caller's own
-- relationships (they use auth.uid() internally), so exposing them over RPC
-- leaks nothing about other people.
-- ---------------------------------------------------------------------------

create or replace function public.sp_blocked_with(other uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.sp_blocks b
    where (b.blocker = (select auth.uid()) and b.blocked = other)
       or (b.blocker = other and b.blocked = (select auth.uid()))
  );
$$;

create or replace function public.sp_friends_with(other uuid)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.sp_friendships f
    where f.status = 'accepted'
      and ((f.requester = (select auth.uid()) and f.addressee = other)
        or (f.addressee = (select auth.uid()) and f.requester = other))
  ) and not public.sp_blocked_with(other);
$$;

-- ---------------------------------------------------------------------------
-- Triggers
-- ---------------------------------------------------------------------------

create or replace function public.sp_touch_updated_at()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists sp_profiles_touch on public.sp_profiles;
create trigger sp_profiles_touch before update on public.sp_profiles
  for each row execute function public.sp_touch_updated_at();

drop trigger if exists sp_free_slots_touch on public.sp_free_slots;
create trigger sp_free_slots_touch before update on public.sp_free_slots
  for each row execute function public.sp_touch_updated_at();

-- Posts: snap "area only" pins to a ~500 m grid before they are stored, set
-- the per-author frame number, and keep author / photo fixed after insert.
create or replace function public.sp_posts_before_write()
returns trigger language plpgsql set search_path = ''
as $$
declare
  lat_step constant double precision := 0.0045;           -- ~500 m of latitude
  lng_step double precision;
begin
  if tg_op = 'UPDATE' then
    new.author_id  := old.author_id;
    new.photo_path := old.photo_path;
    new.thumb_path := old.thumb_path;
    new.is_demo    := old.is_demo;
    new.frame_no   := old.frame_no;
    new.created_at := old.created_at;
  else
    select coalesce(max(p.frame_no), 0) + 1 into new.frame_no
      from public.sp_posts p where p.author_id = new.author_id;
  end if;

  if new.pin_precision = 'area' then
    new.lat := floor(new.lat / lat_step) * lat_step + lat_step / 2;
    lng_step := lat_step / greatest(cos(radians(new.lat)), 0.2);
    new.lng := floor(new.lng / lng_step) * lng_step + lng_step / 2;
  else
    new.lat := round(new.lat::numeric, 5)::double precision;
    new.lng := round(new.lng::numeric, 5)::double precision;
  end if;
  return new;
end;
$$;

drop trigger if exists sp_posts_before_write on public.sp_posts;
create trigger sp_posts_before_write before insert or update on public.sp_posts
  for each row execute function public.sp_posts_before_write();

-- Like / comment counters (security definer: posts have no update policy for
-- other users, but the counters must still move).
create or replace function public.sp_count_likes()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.sp_posts set like_count = like_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.sp_posts set like_count = greatest(like_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists sp_likes_count on public.sp_likes;
create trigger sp_likes_count after insert or delete on public.sp_likes
  for each row execute function public.sp_count_likes();

create or replace function public.sp_count_comments()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    update public.sp_posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.sp_posts set comment_count = greatest(comment_count - 1, 0) where id = old.post_id;
  end if;
  return null;
end;
$$;

drop trigger if exists sp_comments_count on public.sp_comments;
create trigger sp_comments_count after insert or delete on public.sp_comments
  for each row execute function public.sp_count_comments();

-- Presence: round to ~100 m (3 decimal places) and cap the lifetime at 2 h.
create or replace function public.sp_presence_before_write()
returns trigger language plpgsql set search_path = ''
as $$
begin
  new.lat := round(new.lat::numeric, 3)::double precision;
  new.lng := round(new.lng::numeric, 3)::double precision;
  new.expires_at := least(coalesce(new.expires_at, now() + interval '2 hours'),
                          now() + interval '2 hours');
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.id := old.id;
    new.user_id := old.user_id;
  end if;
  return new;
end;
$$;

drop trigger if exists sp_presence_before_write on public.sp_presence;
create trigger sp_presence_before_write before insert or update on public.sp_presence
  for each row execute function public.sp_presence_before_write();

-- "Free till" can only be set for the next 16 hours.
create or replace function public.sp_free_slots_before_write()
returns trigger language plpgsql set search_path = ''
as $$
begin
  if new.free_until is not null and new.free_until > now() + interval '16 hours' then
    new.free_until := now() + interval '16 hours';
  end if;
  return new;
end;
$$;

drop trigger if exists sp_free_slots_before_write on public.sp_free_slots;
create trigger sp_free_slots_before_write before insert or update on public.sp_free_slots
  for each row execute function public.sp_free_slots_before_write();

-- ---------------------------------------------------------------------------
-- Row-level security
-- ---------------------------------------------------------------------------

alter table public.sp_profiles    enable row level security;
alter table public.sp_friendships enable row level security;
alter table public.sp_blocks      enable row level security;
alter table public.sp_posts       enable row level security;
alter table public.sp_likes       enable row level security;
alter table public.sp_comments    enable row level security;
alter table public.sp_free_slots  enable row level security;
alter table public.sp_presence    enable row level security;
alter table public.sp_reports     enable row level security;

-- Profiles: any signed-in member, except people on either side of a block.
drop policy if exists sp_profiles_select on public.sp_profiles;
create policy sp_profiles_select on public.sp_profiles for select to authenticated
  using (id = (select auth.uid()) or not public.sp_blocked_with(id));

drop policy if exists sp_profiles_insert on public.sp_profiles;
create policy sp_profiles_insert on public.sp_profiles for insert to authenticated
  with check (id = (select auth.uid()) and user_id = (select auth.uid()) and not is_demo);

drop policy if exists sp_profiles_update on public.sp_profiles;
create policy sp_profiles_update on public.sp_profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()) and user_id = (select auth.uid()) and not is_demo);

drop policy if exists sp_profiles_delete on public.sp_profiles;
create policy sp_profiles_delete on public.sp_profiles for delete to authenticated
  using (id = (select auth.uid()));

-- Friendships: both people can see the row, except that whoever sent a
-- request never learns it was ignored. All writes go through the RPCs below.
drop policy if exists sp_friendships_select on public.sp_friendships;
create policy sp_friendships_select on public.sp_friendships for select to authenticated
  using (
    addressee = (select auth.uid())
    or (requester = (select auth.uid()) and status <> 'ignored')
  );

-- Blocks: you see and remove only your own. Creating one goes through sp_block().
drop policy if exists sp_blocks_select on public.sp_blocks;
create policy sp_blocks_select on public.sp_blocks for select to authenticated
  using (blocker = (select auth.uid()));

drop policy if exists sp_blocks_delete on public.sp_blocks;
create policy sp_blocks_delete on public.sp_blocks for delete to authenticated
  using (blocker = (select auth.uid()));

-- Posts: every member sees them (it's a club map), minus blocked people.
drop policy if exists sp_posts_select on public.sp_posts;
create policy sp_posts_select on public.sp_posts for select to authenticated
  using (author_id = (select auth.uid()) or not public.sp_blocked_with(author_id));

drop policy if exists sp_posts_insert on public.sp_posts;
create policy sp_posts_insert on public.sp_posts for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and not is_demo
    and photo_path like ((select auth.uid())::text || '/%')
    and thumb_path like ((select auth.uid())::text || '/%')
  );

drop policy if exists sp_posts_update on public.sp_posts;
create policy sp_posts_update on public.sp_posts for update to authenticated
  using (author_id = (select auth.uid()))
  with check (author_id = (select auth.uid()));

drop policy if exists sp_posts_delete on public.sp_posts;
create policy sp_posts_delete on public.sp_posts for delete to authenticated
  using (author_id = (select auth.uid()));

-- Likes
drop policy if exists sp_likes_select on public.sp_likes;
create policy sp_likes_select on public.sp_likes for select to authenticated
  using (
    exists (select 1 from public.sp_posts p where p.id = post_id)
    and (user_id = (select auth.uid()) or not public.sp_blocked_with(user_id))
  );

drop policy if exists sp_likes_insert on public.sp_likes;
create policy sp_likes_insert on public.sp_likes for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.sp_posts p where p.id = post_id)
  );

drop policy if exists sp_likes_delete on public.sp_likes;
create policy sp_likes_delete on public.sp_likes for delete to authenticated
  using (user_id = (select auth.uid()));

-- Comments
drop policy if exists sp_comments_select on public.sp_comments;
create policy sp_comments_select on public.sp_comments for select to authenticated
  using (
    exists (select 1 from public.sp_posts p where p.id = post_id)
    and (author_id = (select auth.uid()) or not public.sp_blocked_with(author_id))
  );

drop policy if exists sp_comments_insert on public.sp_comments;
create policy sp_comments_insert on public.sp_comments for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and exists (select 1 from public.sp_posts p where p.id = post_id)
  );

drop policy if exists sp_comments_delete on public.sp_comments;
create policy sp_comments_delete on public.sp_comments for delete to authenticated
  using (
    author_id = (select auth.uid())
    or exists (select 1 from public.sp_posts p
               where p.id = post_id and p.author_id = (select auth.uid()))
  );

-- Free slots: yours, and accepted friends' only.
drop policy if exists sp_free_slots_select on public.sp_free_slots;
create policy sp_free_slots_select on public.sp_free_slots for select to authenticated
  using (user_id = (select auth.uid()) or public.sp_friends_with(user_id));

drop policy if exists sp_free_slots_insert on public.sp_free_slots;
create policy sp_free_slots_insert on public.sp_free_slots for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists sp_free_slots_update on public.sp_free_slots;
create policy sp_free_slots_update on public.sp_free_slots for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists sp_free_slots_delete on public.sp_free_slots;
create policy sp_free_slots_delete on public.sp_free_slots for delete to authenticated
  using (user_id = (select auth.uid()));

-- Presence: yours, and accepted friends' rows that haven't expired.
drop policy if exists sp_presence_select on public.sp_presence;
create policy sp_presence_select on public.sp_presence for select to authenticated
  using (
    user_id = (select auth.uid())
    or (expires_at > now() and public.sp_friends_with(user_id))
  );

drop policy if exists sp_presence_insert on public.sp_presence;
create policy sp_presence_insert on public.sp_presence for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists sp_presence_update on public.sp_presence;
create policy sp_presence_update on public.sp_presence for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists sp_presence_delete on public.sp_presence;
create policy sp_presence_delete on public.sp_presence for delete to authenticated
  using (user_id = (select auth.uid()));

-- Reports: file your own; nobody reads them through the API (review them in
-- the Supabase dashboard).
drop policy if exists sp_reports_insert on public.sp_reports;
create policy sp_reports_insert on public.sp_reports for insert to authenticated
  with check (
    reporter = (select auth.uid())
    and (target_user is not null or target_post is not null)
  );

-- ---------------------------------------------------------------------------
-- RPCs (friendships, blocks, account)
-- ---------------------------------------------------------------------------

-- Send a friend request, or accept theirs if they already asked you.
-- Returns 'requested' | 'accepted' | 'friends'.
create or replace function public.sp_request_friend(target uuid)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
  f public.sp_friendships;
begin
  if me is null then raise exception 'not signed in' using errcode = '42501'; end if;
  if target is null or target = me then raise exception 'invalid target' using errcode = '22023'; end if;
  if not exists (select 1 from public.sp_profiles where id = me) then
    raise exception 'create your profile first' using errcode = '42501';
  end if;
  if public.sp_blocked_with(target) or not exists (select 1 from public.sp_profiles where id = target) then
    raise exception 'profile not available' using errcode = 'P0002';
  end if;

  select * into f from public.sp_friendships
   where least(requester, addressee) = least(me, target)
     and greatest(requester, addressee) = greatest(me, target);

  if not found then
    insert into public.sp_friendships (requester, addressee) values (me, target);
    return 'requested';
  elsif f.status = 'accepted' then
    return 'friends';
  elsif f.addressee = me then
    -- They asked first (pending or ignored by me): asking back accepts.
    update public.sp_friendships set status = 'accepted', responded_at = now() where id = f.id;
    return 'accepted';
  else
    return 'requested';   -- already asked; never reveal an "ignored"
  end if;
end;
$$;

-- Accept or ignore a request addressed to you.
create or replace function public.sp_respond_friend(request_id uuid, accept boolean)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  update public.sp_friendships
     set status = case when accept then 'accepted' else 'ignored' end,
         responded_at = now()
   where id = request_id and addressee = me and status in ('pending', 'ignored');
  if not found then raise exception 'request not found' using errcode = 'P0002'; end if;
  return case when accept then 'accepted' else 'ignored' end;
end;
$$;

-- Unfriend, or cancel a request you sent.
create or replace function public.sp_unfriend(other uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  delete from public.sp_friendships
   where (requester = me and addressee = other)
      or (addressee = me and requester = other and status = 'accepted');
end;
$$;

-- Block: hides both people from each other and ends any friendship.
create or replace function public.sp_block(target uuid)
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  me uuid := auth.uid();
begin
  if me is null or target is null or target = me then
    raise exception 'invalid target' using errcode = '22023';
  end if;
  insert into public.sp_blocks (blocker, blocked) values (me, target)
    on conflict do nothing;
  delete from public.sp_friendships
   where (requester = me and addressee = target) or (requester = target and addressee = me);
end;
$$;

-- Your friendships, with the other person's profile and mutual-friend count.
-- state: 'friends' | 'incoming' | 'outgoing'. Ignored requests you sent
-- still read 'outgoing'; ones you ignored are left out.
create or replace function public.sp_my_friendships()
returns table (
  id uuid, other_id uuid, state text, created_at timestamptz,
  name text, college text, avatar_path text, is_demo boolean, mutuals int
)
language sql stable security definer set search_path = ''
as $$
  with me as (select auth.uid() as uid),
  mine as (
    select f.*, case when f.requester = (select uid from me) then f.addressee else f.requester end as other
      from public.sp_friendships f
     where (select uid from me) in (f.requester, f.addressee)
  ),
  my_friends as (
    select other from mine where status = 'accepted'
  )
  select m.id, m.other,
         case when m.status = 'accepted' then 'friends'
              when m.requester = (select uid from me) then 'outgoing'
              else 'incoming' end,
         m.created_at, p.name, p.college, p.avatar_path, p.is_demo,
         (select count(*)::int from public.sp_friendships g
           where g.status = 'accepted'
             and ((g.requester = m.other and g.addressee in (select other from my_friends))
               or (g.addressee = m.other and g.requester in (select other from my_friends))))
    from mine m
    join public.sp_profiles p on p.id = m.other
   where not (m.status = 'ignored' and m.addressee = (select uid from me))
     and not public.sp_blocked_with(m.other);
$$;

-- People you blocked (their profiles are hidden from normal reads).
create or replace function public.sp_my_blocks()
returns table (id uuid, name text, avatar_path text, is_demo boolean, created_at timestamptz)
language sql stable security definer set search_path = ''
as $$
  select p.id, p.name, p.avatar_path, p.is_demo, b.created_at
    from public.sp_blocks b
    join public.sp_profiles p on p.id = b.blocked
   where b.blocker = (select auth.uid())
   order by b.created_at desc;
$$;

-- Delete everything Spotted holds about you. (Photos in storage are removed
-- by the app first; your auth account is shared with other apps, so it stays.)
create or replace function public.sp_delete_me()
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.sp_profiles where id = auth.uid() and not is_demo;
end;
$$;

-- Opportunistic sweep, also run by cron below.
create or replace function public.sp_purge_expired_presence()
returns void
language sql security definer set search_path = ''
as $$
  delete from public.sp_presence where expires_at <= now();
$$;

-- ---------------------------------------------------------------------------
-- Grants: nothing for anon, table access for signed-in users (RLS decides).
-- ---------------------------------------------------------------------------

revoke all on public.sp_profiles, public.sp_friendships, public.sp_blocks, public.sp_posts,
              public.sp_likes, public.sp_comments, public.sp_free_slots, public.sp_presence,
              public.sp_reports
  from anon, authenticated;
grant select, insert, update, delete on public.sp_profiles, public.sp_posts, public.sp_likes,
      public.sp_comments, public.sp_free_slots, public.sp_presence to authenticated;
grant select on public.sp_friendships to authenticated;
grant select, delete on public.sp_blocks to authenticated;
grant insert on public.sp_reports to authenticated;

do $$
declare fn text;
begin
  foreach fn in array array[
    'sp_blocked_with(uuid)', 'sp_friends_with(uuid)', 'sp_request_friend(uuid)',
    'sp_respond_friend(uuid, boolean)', 'sp_unfriend(uuid)', 'sp_block(uuid)',
    'sp_my_friendships()', 'sp_my_blocks()', 'sp_delete_me()', 'sp_purge_expired_presence()'
  ] loop
    execute format('revoke all on function public.%s from public, anon', fn);
    execute format('grant execute on function public.%s to authenticated', fn);
  end loop;
  -- Trigger functions are never called directly.
  foreach fn in array array[
    'sp_touch_updated_at()', 'sp_posts_before_write()', 'sp_count_likes()',
    'sp_count_comments()', 'sp_presence_before_write()', 'sp_free_slots_before_write()'
  ] loop
    execute format('revoke all on function public.%s from public, anon, authenticated', fn);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Storage: private bucket sp-photos. Signed-in users can read; each user
-- writes only inside their own "<uid>/" folder.
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('sp-photos', 'sp-photos', false, 4194304, array['image/webp', 'image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists sp_photos_read on storage.objects;
create policy sp_photos_read on storage.objects for select to authenticated
  using (bucket_id = 'sp-photos');

drop policy if exists sp_photos_insert on storage.objects;
create policy sp_photos_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'sp-photos'
              and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists sp_photos_update on storage.objects;
create policy sp_photos_update on storage.objects for update to authenticated
  using (bucket_id = 'sp-photos'
         and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'sp-photos'
              and (storage.foldername(name))[1] = (select auth.uid())::text);

drop policy if exists sp_photos_delete on storage.objects;
create policy sp_photos_delete on storage.objects for delete to authenticated
  using (bucket_id = 'sp-photos'
         and (storage.foldername(name))[1] = (select auth.uid())::text);

-- ---------------------------------------------------------------------------
-- Realtime: friends' presence and friendship changes (RLS-filtered).
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sp_presence') then
      alter publication supabase_realtime add table public.sp_presence;
    end if;
    if not exists (select 1 from pg_publication_tables
                   where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sp_friendships') then
      alter publication supabase_realtime add table public.sp_friendships;
    end if;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Expired live locations are deleted every 5 minutes (pg_cron, if enabled).
-- ---------------------------------------------------------------------------

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.schedule('sp_purge_expired_presence', '*/5 * * * *',
                          'delete from public.sp_presence where expires_at <= now()');
  end if;
end $$;
