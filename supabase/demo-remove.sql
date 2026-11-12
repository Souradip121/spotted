-- ============================================================================
-- Spotted · remove ALL demo data
-- Deletes the demo profiles; their posts, likes, comments, friendships, free
-- slots and live locations go with them (on delete cascade). Real users' rows
-- are never flagged is_demo, so they are untouched.
-- Afterwards, delete the demo/ folder from the repo (the demo photos are
-- served from there, not from storage).
-- ============================================================================

delete from public.sp_reports
 where target_user in (select id from public.sp_profiles where is_demo)
    or target_post in (select id from public.sp_posts where is_demo);

delete from public.sp_profiles where is_demo;
