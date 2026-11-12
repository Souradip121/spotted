-- ============================================================================
-- Spotted · DEMO wake-up (test data only)
-- Puts the demo friends back on the map for the next 2 hours and gives a few
-- of them a "free till ..." status. Run it right before recording a demo.
-- ============================================================================

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
