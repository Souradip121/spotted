# Spotted

**A photo-club map for one college town.** Post a photo and pin it where you took it, so the town fills up with everyone's frames. Like and comment, add friends, see which friends are free this week, and, only if they switch it on, where they are right now.

Built for Kalyani, West Bengal. Live at **https://souradip121.github.io/spotted/**.

![Spotted: the map, a frame, and Free now](docs/screens.png)

- **Map:** MapLibre GL on free [OpenFreeMap](https://openfreemap.org) vector tiles, with a dark "darkroom" style. Photo pins are round thumbnails; friends who share their location show up with "free till 5 pm". Filters: Friends, Photos, Free now.
- **Frames:** photos are resized on the phone to about 1,600 px WebP and stripped of EXIF (GPS included) before upload. Each gets a caption, a place name and a pin that is either **exact** or **area only** (about 500 m).
- **Social:** likes, comments, friend requests (accept, ignore, unfriend), and report + block on every profile and photo.
- **Free now:** a weekly grid (Mon to Sat, 8 am to 8 pm, hourly) plus a "free till …" status. Friends only.
- **Live location:** off by default, mutual friends only, rounded to about 100 m, switches itself off after 2 hours, and ghost mode deletes it in one tap.

No build step: plain HTML, CSS and ES modules with vendored [Preact](https://preactjs.com) + [htm](https://github.com/developit/htm), [supabase-js](https://github.com/supabase/supabase-js) and [MapLibre GL JS](https://maplibre.org). The backend is [Supabase](https://supabase.com) (Auth, Postgres with row-level security, Storage, Realtime).

---

## Safety design

Location is the most sensitive thing in this app, so every rule below is enforced **in the database** (row-level security, triggers and security-definer functions in [`supabase/schema.sql`](supabase/schema.sql)), not only in the app.

| Rule | How it's enforced |
|---|---|
| Live location is off by default | No row exists until you switch it on. |
| Only accepted friends see it | `sp_presence` is readable only by you and people with an **accepted** friendship. Pending or ignored requests unlock nothing. |
| It's approximate | Rounded to 3 decimal places (about 100 m) on the phone, and again by a trigger. |
| It switches itself off | `expires_at` is capped at 2 hours by a trigger, expired rows are invisible to everyone, and a `pg_cron` job deletes them every 5 minutes. |
| No history | One row per person, overwritten in place. Ghost mode deletes it. |
| Ghost mode leaks nothing | Realtime broadcasts the primary key of deleted rows to every subscriber, so presence rows use a random id rather than the user id. |
| "Area only" pins | Snapped to a ~500 m grid on the phone, so the exact spot is never sent, and the database snaps again. |
| Photos carry no GPS | Re-encoded in the browser; only pixels are uploaded. |
| Free time is private | `sp_free_slots` is readable only by you and accepted friends. |
| Blocks work both ways | A block hides profiles, photos, comments, likes, free time and location in both directions, ends any friendship, and stops new requests. |
| Ignoring is silent | Someone you ignore still sees "Requested"; they can't read the ignored status. |
| Reports are private | Anyone signed in can file one; nobody can read them through the API. Review them in the Supabase dashboard (`sp_reports`). |
| Signed-out visitors see nothing | Every table and the `sp-photos` bucket require a signed-in user. |
| 18+ | Confirmed during profile setup and stored (`adult_confirmed_at`). |

**Tested:** [`supabase/rls-tests.sql`](supabase/rls-tests.sql) acts as several different users in SQL (stranger, friend, pending requester, blocked person, signed-out visitor) and checks 33 rules, including storage. It runs in a transaction that is rolled back. The last run's results are in [`supabase/rls-test-results.csv`](supabase/rls-test-results.csv): 33/33 pass.

---

## Run it for your own town

You need a free [Supabase](https://supabase.com) project and a GitHub account. Nothing to install.

1. **Fork this repo.**
2. **Create the database.** In your Supabase project, open *SQL Editor*, paste [`supabase/schema.sql`](supabase/schema.sql) and run it. It creates only objects prefixed `sp_` and the private storage bucket `sp-photos`, so it's safe in a project you already use. It's idempotent, so run it again after updates.
3. **Turn on Google sign-in.** *Authentication → Sign In / Providers → Google* (you need a Google Cloud OAuth client; Supabase's guide walks through it). Then in *Authentication → URL Configuration*, add your site URL (for example `https://<you>.github.io/spotted/`) to **Redirect URLs**.
   Prefer another provider? Change `provider: 'google'` in [`src/views/auth.js`](src/views/auth.js).
4. **Point the app at your project.** Edit [`config.js`](config.js): your project URL and its **anon / publishable** key (*Project Settings → API*). Never put the `service_role` key in the app.
5. **Set your town.** In [`src/map/style.js`](src/map/style.js), change `TOWN`: name, centre, bounds, and the place and college suggestions. Update the `og:image` URL in `index.html`.
6. **Publish.** *Settings → Pages → Deploy from a branch → `main` / root.* Any static host works (Netlify, Vercel, Cloudflare Pages); there's no build step.
7. **Check the rules** (optional): run [`supabase/rls-tests.sql`](supabase/rls-tests.sql) in the SQL editor. Every row should say `true`.

To try it locally, serve the folder with any static server (`python -m http.server`) and open it on `localhost`. Add that URL to Redirect URLs too.

### Free-tier limits (Supabase Free plan at the time of writing; check [supabase.com/pricing](https://supabase.com/pricing))

- **Storage: 1 GB.** A frame is about 150–350 KB plus a ~25 KB thumbnail, so roughly 3,000–5,000 frames. Fine for one town's photography club.
- **Database: 500 MB.** Text rows are tiny; this won't be the limit.
- **Egress: 5 GB a month.** Thumbnails keep the map light; full photos load only when opened.
- **Realtime: 200 concurrent connections.**
- **Pausing:** free projects pause after a week with no activity. Open the project in the Supabase dashboard and press *Restore* to wake it.

### Moderation

Reports land in the `sp_reports` table. Read them in *Table Editor*. To remove a post, delete its row in `sp_posts` (likes and comments go with it) and its two files in the `sp-photos` bucket. To remove a person entirely, delete their row in `sp_profiles`.

---

## Demo data

The hosted copy ships with **demo content** so there's something to see before real club photos arrive: 7 fictional people with AI-generated portraits and 9 AI-generated placeholder photos of Kalyani-style scenes. Every demo row has `is_demo = true`; demo frames say **DEMO 400** on their film edge and demo profiles carry a *Demo* tag. The files live in [`demo/`](demo/) (prompts in [`demo/PROMPTS.md`](demo/PROMPTS.md)), not in storage.

- Add it: [`supabase/demo-seed.sql`](supabase/demo-seed.sql).
- Put the demo friends back on the map for 2 hours (before a recording): [`supabase/demo-wake.sql`](supabase/demo-wake.sql).
- Make the demo people your friends: sign in once, then run [`supabase/demo-connect.sql`](supabase/demo-connect.sql) with your email filled in.
- **Remove all of it:** run [`supabase/demo-remove.sql`](supabase/demo-remove.sql), then delete the `demo/` folder.

---

## Project layout

```
index.html            app shell
config.js             Supabase URL + anon key (the only config)
styles/app.css        the darkroom design system
src/main.js           boot, auth, routing, film-strip nav
src/lib/              Supabase client + store, data access, photos, live location
src/map/style.js      map style + town settings
src/views/            sign-in, map, frame, friends / free now, profile, compose
supabase/             schema, RLS tests, demo seed / wake / connect / remove
vendor/               pinned copies of Preact+htm 3.1.1, supabase-js 2.49.4, MapLibre GL 4.7.1
demo/                 demo photos and avatars (AI-generated, safe to delete)
```

Map data © [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors, tiles by [OpenFreeMap](https://openfreemap.org) / [OpenMapTiles](https://openmaptiles.org). MIT licensed (see [LICENSE](LICENSE)).
