# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Static HTML, CSS and ES modules with no build step (the user chose this on 12 Nov 2026). Libraries are vendored into `vendor/`: Preact + htm (standalone), supabase-js (UMD) and MapLibre GL. Backend: Supabase (Auth magic link, Postgres with RLS, Storage, Realtime). Hosted on GitHub Pages from the repo root; self-hosters edit `config.js` and turn on Pages.

## Users

Engineering and university students in Kalyani, West Bengal (JIS College of Engineering, University of Kalyani, AIIMS Kalyani and others) who belong to a photography club or shoot on their phones. They open it on a phone between classes, on the train, or out shooting in the evening.

## Product Purpose

Spotted is a photo-club social map for one college town. People post photos pinned where they were taken, so the town shows up through everyone's photos. Friends can see who is free this week and, if a friend chooses to, where they are right now. Success is a club that actually uses it to meet up and shoot together.

## Positioning

A map of one town made from its own students' photos, with friend presence that is opt-in, approximate and short-lived by design. A general map can't tell you which friend is free right now, and a general social feed doesn't put photos where they were taken.

## Operating Context

- Phone browsers first (Android Chrome, often opened from an Instagram DM link or Gmail's in-app browser). Desktop works but is secondary.
- Sign-in is an email magic link (college email encouraged) plus an "I'm 18+" confirmation.
- Launched from an "I BUILT IT" Instagram reel by @souradip.sh. Viewers comment SPOTTED and get the link by DM.
- First tested with one photography club before the reel.

## Capabilities and Constraints

- Map: MapLibre GL on OpenFreeMap vector tiles (no key). Never tile.openstreetmap.org. Centred on Kalyani.
- Posts: one photo each, resized in the browser to about 1600 px WebP with EXIF stripped, plus a caption, a place name and a pin. The pin precision is "exact" or "area only" (snapped to about 500 m).
- Social: likes, comments, friend requests (request, accept, ignore, unfriend), report and block on every profile and post.
- Free now: a weekly free-slot grid (Mon to Sat, 8 am to 8 pm, hourly) plus a "free till …" status. Accepted friends only.
- Live location: off by default, mutual friends only, rounded to about 100 m, a single row per user that expires after 2 hours, no history. Ghost mode is one tap and deletes the row.
- Supabase free tier: 1 GB storage. The project is shared with other apps, so every database object is prefixed `sp_`.
- Terminology: "Spotted" (the app), "frame" (a photo post), "Free now", "Ghost mode", "area only".

## Brand Commitments

- The visual world is pinned: the "film darkroom" concept (`../ui-concepts/spotted/spotted_a_darkroom.png`), which the user picked. Black UI, film-strip frames with sprocket holes, a red safelight accent, grain, condensed type, exposure-number edge labels. The edge print must not use real film-brand trademarks.
- Voice: short, plain, a bit playful, student-to-student. No hype.

## Evidence on Hand

- No real club photos yet. Demo posts use AI-generated placeholder photos and fictional demo profiles (AI portraits), stored as `is_demo` rows and labelled DEMO in the film edge print. All of it is to be replaced by real club photos posted with the members' OK.
- No user counts, testimonials or press. Don't invent any.

## Product Principles

1. Location is the most sensitive thing here: opt-in, approximate, expiring and friends-only, every time.
2. Photos first: the map is made of people's frames, not of UI.
3. One town, done well, beats a generic everywhere map.
4. Every safety control (ghost, block, report) is one tap away, never buried.

## Accessibility & Inclusion

- Readable on cheap Android phones outdoors: high-contrast text on black, touch targets of at least 44 px, respect for reduced motion.
- Works on slow mobile data: small vendored bundles and lazily loaded photos.
