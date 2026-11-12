// Core plumbing: Supabase client, a tiny store, hash routing, formatting.
import { useEffect, useReducer, useRef, useState } from 'preact-htm';

// ---------------------------------------------------------------- supabase
const cfg = window.SPOTTED_CONFIG || {};
export const configured = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);

export const sb = configured
  ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: {
        // Implicit flow: the magic link works even when it opens in a
        // different browser (Gmail / Instagram in-app browsers).
        flowType: 'implicit',
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        // Own key, so other apps on the same github.io origin don't share it.
        storageKey: 'spotted-auth',
      },
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null;

// ---------------------------------------------------------------- store
let state = {
  booted: false,
  session: null,
  me: null,            // my sp_profiles row
  friendships: [],     // rows from sp_my_friendships()
  slots: {},           // user_id -> sp_free_slots row (mine + friends')
  presence: {},        // user_id -> sp_presence row (mine + friends', unexpired)
  posts: [],           // map posts, newest first
  likes: new Set(),    // post ids I liked
  sharing: null,       // { startedAt, expiresAt } while my live location is on
  filter: 'friends',   // map filter: friends | photos | free
  postsLoaded: false,
};
const listeners = new Set();

export const getState = () => state;
export function setState(patch) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) };
  listeners.forEach((fn) => fn(state));
}
export function useStore(select) {
  const sel = useRef(select);
  sel.current = select;
  const [, force] = useReducer((n) => n + 1, 0);
  const last = useRef();
  last.current = sel.current(state);
  useEffect(() => {
    const fn = (s) => { if (sel.current(s) !== last.current) force(); };
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);
  return last.current;
}

// ---------------------------------------------------------------- routing
function parse() {
  const raw = location.hash.replace(/^#/, '');
  if (!raw.startsWith('/')) return { path: '/', parts: [], query: new URLSearchParams() };
  const [p, q] = raw.split('?');
  return { path: p, parts: p.split('/').filter(Boolean), query: new URLSearchParams(q || '') };
}
// Mark history entries the app created, so "back" never leaves the site.
if (!history.state?.spotted) history.replaceState({ ...(history.state || {}), spotted: 'root' }, '');
addEventListener('hashchange', () => {
  if (!history.state?.spotted) history.replaceState({ ...(history.state || {}), spotted: 'entry' }, '');
});
export function useRoute() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const onHash = () => setRoute(parse());
    addEventListener('hashchange', onHash);
    return () => removeEventListener('hashchange', onHash);
  }, []);
  return route;
}
export function go(path, { replace = false } = {}) {
  const target = '#' + path;
  if (location.hash === target) return;
  if (replace) {
    history.replaceState(history.state, '', target);
    dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    location.hash = path;
  }
}
export function back(fallback = '/') {
  if (history.state?.spotted === 'entry') history.back();
  else go(fallback, { replace: true });
}

// ---------------------------------------------------------------- toasts
let toastId = 0;
const toastListeners = new Set();
let toasts = [];
export function toast(text, kind = 'ok', ms = 3600) {
  const id = ++toastId;
  toasts = [...toasts, { id, text, kind }];
  toastListeners.forEach((fn) => fn(toasts));
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    toastListeners.forEach((fn) => fn(toasts));
  }, ms);
}
export function useToasts() {
  const [list, setList] = useState(toasts);
  useEffect(() => { toastListeners.add(setList); return () => toastListeners.delete(setList); }, []);
  return list;
}
export function fail(err, fallback = 'Something went wrong. Try again.') {
  console.error(err);
  const msg = typeof err === 'string' ? err : err?.message || '';
  if (/Failed to fetch|NetworkError|network/i.test(msg)) return toast('No connection. Check your data and try again.', 'error');
  toast(fallback, 'error');
}

// ---------------------------------------------------------------- formatting
export function fmtHour(d) {
  const h = d.getHours();
  const m = d.getMinutes();
  const ap = h < 12 ? 'am' : 'pm';
  const hh = h % 12 || 12;
  return m ? `${hh}:${String(m).padStart(2, '0')} ${ap}` : `${hh} ${ap}`;
}
export function ago(ts) {
  const s = (Date.now() - new Date(ts).getTime()) / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)}d ago`;
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}
export const pad2 = (n) => String(n).padStart(2, '0');
export const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
export const initials = (name = '?') => name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();

// ---------------------------------------------------------------- geo
export function snapArea(lat, lng) {
  // Same ~500 m grid as the database trigger, so the exact spot never
  // leaves the phone when "area only" is picked.
  const s = 0.0045;
  const la = Math.floor(lat / s) * s + s / 2;
  const ls = s / Math.max(Math.cos((la * Math.PI) / 180), 0.2);
  return [la, Math.floor(lng / ls) * ls + ls / 2];
}
export const round3 = (x) => Math.round(x * 1000) / 1000;
export function distM(a, b) {
  const R = 6371000;
  const toR = (x) => (x * Math.PI) / 180;
  const dLat = toR(b[0] - a[0]);
  const dLng = toR(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a[0])) * Math.cos(toR(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ---------------------------------------------------------------- free slots
export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const HOURS = Array.from({ length: 12 }, (_, i) => 8 + i); // 8..19
export const EMPTY_GRID = '0'.repeat(72);

export function slotIndex(d = new Date()) {
  const day = (d.getDay() + 6) % 7; // Mon=0
  const h = d.getHours();
  if (day > 5 || h < 8 || h >= 20) return -1;
  return day * 12 + (h - 8);
}
// Is this person free right now, and until when?
export function freeState(row, now = new Date()) {
  if (!row) return { free: false };
  if (row.free_until && new Date(row.free_until) > now) {
    return { free: true, until: new Date(row.free_until), source: 'status' };
  }
  const i = slotIndex(now);
  const grid = row.grid || EMPTY_GRID;
  if (i < 0 || grid[i] !== '1') return { free: false };
  const dayStart = Math.floor(i / 12) * 12;
  let j = i;
  while (j < dayStart + 12 && grid[j] === '1') j++;
  const until = new Date(now);
  until.setHours(8 + (j - dayStart), 0, 0, 0);
  return { free: true, until, source: 'grid' };
}
export function freeLabel(st) {
  if (!st?.free) return null;
  const u = st.until;
  if (!u || u.getHours() >= 20 || u.getDate() !== new Date().getDate()) return 'free now';
  return `free till ${fmtHour(u)}`;
}
export function weekDates(now = new Date()) {
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return DAYS.map((_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
}
// Contiguous free blocks of one day: [{start, end}] in hour indexes 0..12
export function dayBlocks(grid, day) {
  const out = [];
  let s = -1;
  for (let h = 0; h <= 12; h++) {
    const on = h < 12 && grid[day * 12 + h] === '1';
    if (on && s < 0) s = h;
    if (!on && s >= 0) { out.push({ start: s, end: h }); s = -1; }
  }
  return out;
}
