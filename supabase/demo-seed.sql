-- ============================================================================
-- Spotted · DEMO seed (test data only)
-- Seven fictional profiles (AI-made portraits) and nine AI-made placeholder
-- photos around Kalyani, so the app has something to show before real club
-- photos arrive. Every row is flagged is_demo = true; the photo files live in
-- the site's demo/ folder, not in storage. Re-running this file is safe.
-- Remove it all with supabase/demo-remove.sql.
-- ============================================================================

insert into public.sp_profiles (id, user_id, name, college, avatar_path, adult_confirmed_at, is_demo) values
  ('de300000-0000-4000-a000-000000000001', null, 'Ayan', 'JIS College of Engineering', 'avatars/ayan.webp', now(), true),
  ('de300000-0000-4000-a000-000000000002', null, 'Moumita', 'University of Kalyani', 'avatars/moumita.webp', now(), true),
  ('de300000-0000-4000-a000-000000000003', null, 'Riya', 'JIS College of Engineering', 'avatars/riya.webp', now(), true),
  ('de300000-0000-4000-a000-000000000004', null, 'Arijit', 'Kalyani Government Engineering College', 'avatars/arijit.webp', now(), true),
  ('de300000-0000-4000-a000-000000000005', null, 'Soham', 'JIS College of Engineering', 'avatars/soham.webp', now(), true),
  ('de300000-0000-4000-a000-000000000006', null, 'Tisha', 'AIIMS Kalyani', 'avatars/tisha.webp', now(), true),
  ('de300000-0000-4000-a000-000000000007', null, 'Ishita', 'University of Kalyani', 'avatars/ishita.webp', now(), true)
on conflict (id) do update set name = excluded.name, college = excluded.college, avatar_path = excluded.avatar_path;

insert into public.sp_posts (id, author_id, photo_path, thumb_path, width, height, caption, place_name, lat, lng, pin_precision, is_demo, created_at) values
  ('de3a0000-0000-4000-a000-000000000001', 'de300000-0000-4000-a000-000000000001', 'photos/lake-golden-hour.webp', 'photos/lake-golden-hour_t.webp', 1600, 1067, 'Golden hour after labs', 'Lake Park', 22.97093, 88.44449, 'exact', true, now() - interval '2 hours'),
  ('de3a0000-0000-4000-a000-000000000002', 'de300000-0000-4000-a000-000000000004', 'photos/college-dusk.webp', 'photos/college-dusk_t.webp', 1600, 1067, 'Last class done. The sky did the rest.', 'JIS College, Phase III', 22.9597, 88.452, 'exact', true, now() - interval '5 hours'),
  ('de3a0000-0000-4000-a000-000000000003', 'de300000-0000-4000-a000-000000000005', 'photos/local-train.webp', 'photos/local-train_t.webp', 1600, 1067, '6:12 local, on time for once', 'Kalyani station', 22.96916, 88.46742, 'exact', true, now() - interval '1 day 2 hours'),
  ('de3a0000-0000-4000-a000-000000000004', 'de300000-0000-4000-a000-000000000002', 'photos/chai-stall.webp', 'photos/chai-stall_t.webp', 1280, 1600, 'Bhaar cha. Ten rupees, ten out of ten.', 'Near Central Park', 22.9745, 88.4353, 'area', true, now() - interval '3 hours'),
  ('de3a0000-0000-4000-a000-000000000005', 'de300000-0000-4000-a000-000000000003', 'photos/park-morning.webp', 'photos/park-morning_t.webp', 1280, 1600, 'Fog walk before the 9 am class', 'Central Park', 22.97545, 88.43386, 'exact', true, now() - interval '1 day 5 hours'),
  ('de3a0000-0000-4000-a000-000000000006', 'de300000-0000-4000-a000-000000000006', 'photos/ghat-sunrise.webp', 'photos/ghat-sunrise_t.webp', 1600, 1067, 'Woke up at 5 for this. Worth it.', 'Hooghly riverside', 22.979, 88.415, 'area', true, now() - interval '2 days'),
  ('de3a0000-0000-4000-a000-000000000007', 'de300000-0000-4000-a000-000000000002', 'photos/puja-lights.webp', 'photos/puja-lights_t.webp', 1280, 1600, 'Pandal hopping, round three', 'B-Block lanes', 22.977, 88.442, 'area', true, now() - interval '4 days'),
  ('de3a0000-0000-4000-a000-000000000008', 'de300000-0000-4000-a000-000000000001', 'photos/toto-street.webp', 'photos/toto-street_t.webp', 1600, 1067, 'Toto hour', 'Near University of Kalyani', 22.98486, 88.44604, 'exact', true, now() - interval '6 hours'),
  ('de3a0000-0000-4000-a000-000000000009', 'de300000-0000-4000-a000-000000000007', 'photos/egg-roll.webp', 'photos/egg-roll_t.webp', 1280, 1600, 'Egg roll beats canteen lunch', 'Near Kalyani Mahavidyalaya', 22.9774, 88.4504, 'area', true, now() - interval '8 hours')
on conflict (id) do nothing;

insert into public.sp_likes (post_id, user_id) values
  ('de3a0000-0000-4000-a000-000000000001', 'de300000-0000-4000-a000-000000000002'),
  ('de3a0000-0000-4000-a000-000000000001', 'de300000-0000-4000-a000-000000000003'),
  ('de3a0000-0000-4000-a000-000000000001', 'de300000-0000-4000-a000-000000000004'),
  ('de3a0000-0000-4000-a000-000000000001', 'de300000-0000-4000-a000-000000000005'),
  ('de3a0000-0000-4000-a000-000000000001', 'de300000-0000-4000-a000-000000000006'),
  ('de3a0000-0000-4000-a000-000000000002', 'de300000-0000-4000-a000-000000000001'),
  ('de3a0000-0000-4000-a000-000000000002', 'de300000-0000-4000-a000-000000000005'),
  ('de3a0000-0000-4000-a000-000000000003', 'de300000-0000-4000-a000-000000000004'),
  ('de3a0000-0000-4000-a000-000000000003', 'de300000-0000-4000-a000-000000000001'),
  ('de3a0000-0000-4000-a000-000000000003', 'de300000-0000-4000-a000-000000000002'),
  ('de3a0000-0000-4000-a000-000000000004', 'de300000-0000-4000-a000-000000000001'),
  ('de3a0000-0000-4000-a000-000000000004', 'de300000-0000-4000-a000-000000000003'),
  ('de3a0000-0000-4000-a000-000000000004', 'de300000-0000-4000-a000-000000000006'),
  ('de3a0000-0000-4000-a000-000000000004', 'de300000-0000-4000-a000-000000000007'),
  ('de3a0000-0000-4000-a000-000000000005', 'de300000-0000-4000-a000-000000000001'),
  ('de3a0000-0000-4000-a000-000000000005', 'de300000-0000-4000-a000-000000000002'),
  ('de3a0000-0000-4000-a000-000000000006', 'de300000-0000-4000-a000-000000000002'),
  ('de3a0000-0000-4000-a000-000000000006', 'de300000-0000-4000-a000-000000000003'),
  ('de3a0000-0000-4000-a000-000000000006', 'de300000-0000-4000-a000-000000000001'),
  ('de3a0000-0000-4000-a000-000000000007', 'de300000-0000-4000-a000-000000000003'),
  ('de3a0000-0000-4000-a000-000000000007', 'de300000-0000-4000-a000-000000000006'),
  ('de3a0000-0000-4000-a000-000000000008', 'de300000-0000-4000-a000-000000000002'),
  ('de3a0000-0000-4000-a000-000000000008', 'de300000-0000-4000-a000-000000000004'),
  ('de3a0000-0000-4000-a000-000000000009', 'de300000-0000-4000-a000-000000000002'),
  ('de3a0000-0000-4000-a000-000000000009', 'de300000-0000-4000-a000-000000000006'),
  ('de3a0000-0000-4000-a000-000000000009', 'de300000-0000-4000-a000-000000000003')
on conflict do nothing;

insert into public.sp_comments (id, post_id, author_id, body, created_at) values
  ('de3c0000-0000-4000-a000-000000000001', 'de3a0000-0000-4000-a000-000000000001', 'de300000-0000-4000-a000-000000000002', 'Looks so peaceful!', now() - interval '1 hour 50 minutes'),
  ('de3c0000-0000-4000-a000-000000000002', 'de3a0000-0000-4000-a000-000000000001', 'de300000-0000-4000-a000-000000000004', 'Wish I was there', now() - interval '1 hour 10 minutes'),
  ('de3c0000-0000-4000-a000-000000000003', 'de3a0000-0000-4000-a000-000000000004', 'de300000-0000-4000-a000-000000000001', 'Which stall is this?', now() - interval '2 hours 30 minutes'),
  ('de3c0000-0000-4000-a000-000000000004', 'de3a0000-0000-4000-a000-000000000004', 'de300000-0000-4000-a000-000000000002', 'The one with the blue bench. Ask for extra elaichi.', now() - interval '2 hours 20 minutes'),
  ('de3c0000-0000-4000-a000-000000000005', 'de3a0000-0000-4000-a000-000000000003', 'de300000-0000-4000-a000-000000000004', 'You actually caught it moving', now() - interval '1 day'),
  ('de3c0000-0000-4000-a000-000000000006', 'de3a0000-0000-4000-a000-000000000006', 'de300000-0000-4000-a000-000000000003', '5 am??? respect', now() - interval '1 day 20 hours'),
  ('de3c0000-0000-4000-a000-000000000007', 'de3a0000-0000-4000-a000-000000000009', 'de300000-0000-4000-a000-000000000006', 'Okay now I''m hungry', now() - interval '7 hours')
on conflict (id) do nothing;

insert into public.sp_friendships (requester, addressee, status, responded_at) values
  ('de300000-0000-4000-a000-000000000001', 'de300000-0000-4000-a000-000000000002', 'accepted', now()),
  ('de300000-0000-4000-a000-000000000001', 'de300000-0000-4000-a000-000000000003', 'accepted', now()),
  ('de300000-0000-4000-a000-000000000002', 'de300000-0000-4000-a000-000000000003', 'accepted', now()),
  ('de300000-0000-4000-a000-000000000004', 'de300000-0000-4000-a000-000000000005', 'accepted', now()),
  ('de300000-0000-4000-a000-000000000001', 'de300000-0000-4000-a000-000000000004', 'accepted', now()),
  ('de300000-0000-4000-a000-000000000006', 'de300000-0000-4000-a000-000000000002', 'accepted', now()),
  ('de300000-0000-4000-a000-000000000005', 'de300000-0000-4000-a000-000000000001', 'accepted', now())
on conflict do nothing;

insert into public.sp_free_slots (user_id, grid) values
  ('de300000-0000-4000-a000-000000000001', '000000111000110000111000011000000000001100000000000000001100000001111110'),
  ('de300000-0000-4000-a000-000000000002', '110000000000000001110000000000011000000000011000000000000111111000001111'),
  ('de300000-0000-4000-a000-000000000003', '000000000111110000011100110000000000001110000000011001110000000000001111'),
  ('de300000-0000-4000-a000-000000000004', '011100000000011000000000001110011000000000000110000000110000011100000111'),
  ('de300000-0000-4000-a000-000000000005', '000001100000000000001100000000011000000001100000000000110000011101111000'),
  ('de300000-0000-4000-a000-000000000006', '111100000000111100000000110000000000000000001100000000110110000000001111'),
  ('de300000-0000-4000-a000-000000000007', '000001100000000000111000110000000000000000001100110000001110001111111100')
on conflict (user_id) do update set grid = excluded.grid;

-- Live locations and "free till" for the demo friends. These expire after
-- 2 hours like everyone else's; run supabase/demo-wake.sql to refresh them
-- right before recording.
-- (demo-wake.sql content follows)
insert into public.sp_presence (user_id, lat, lng, expires_at) values
  ('de300000-0000-4000-a000-000000000001', 22.9726, 88.4460, now() + interval '2 hours'),  -- Ayan, by Lake Park
  ('de300000-0000-4000-a000-000000000002', 22.9858, 88.4426, now() + interval '2 hours'),  -- Moumita, university side
  ('de300000-0000-4000-a000-000000000003', 22.9733, 88.4366, now() + interval '2 hours'),  -- Riya, Central Park
  ('de300000-0000-4000-a000-000000000004', 22.9678, 88.4640, now() + interval '2 hours'),  -- Arijit, near the station
  ('de300000-0000-4000-a000-000000000005', 22.9612, 88.4532, now() + interval '2 hours')   -- Soham, Phase III
on conflict (user_id) do update set lat = excluded.lat, lng = excluded.lng, expires_at = excluded.expires_at;

update public.sp_free_slots set free_until = case user_id
    when 'de300000-0000-4000-a000-000000000001' then (date_trunc('hour', now() at time zone 'Asia/Kolkata') + interval '2 hours') at time zone 'Asia/Kolkata'
    when 'de300000-0000-4000-a000-000000000003' then (date_trunc('hour', now() at time zone 'Asia/Kolkata') + interval '3 hours') at time zone 'Asia/Kolkata'
    when 'de300000-0000-4000-a000-000000000002' then now() + interval '15 hours'
    when 'de300000-0000-4000-a000-000000000004' then now() + interval '15 hours'
    else null end
  where user_id in (select id from public.sp_profiles where is_demo);
