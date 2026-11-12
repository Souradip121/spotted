// Live location + realtime.
// Off by default. When on: one sp_presence row, rounded to ~100 m on the
// phone (and again by the database), expiring 2 hours after you switched it
// on. Ghost mode deletes the row. Nothing is ever kept as history.
import { sb, getState, setState, toast, round3, distM } from './core.js';
import { loadFriendships, loadSocial } from './data.js';

const KEY = 'spotted:sharing';
const LIFETIME = 2 * 60 * 60 * 1000;
let watchId = null;
let stopTimer = null;
let last = null; // { lat, lng, at }

const uid = () => getState().session?.user?.id;

function persist(v) {
  try { v ? localStorage.setItem(KEY, JSON.stringify(v)) : localStorage.removeItem(KEY); } catch {}
}
function readPersisted() {
  try { return JSON.parse(localStorage.getItem(KEY) || 'null'); } catch { return null; }
}

function position(opts = {}) {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('unsupported'));
    navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000, ...opts });
  });
}

export async function locateOnce() {
  const p = await position();
  return [p.coords.latitude, p.coords.longitude];
}

async function write(lat, lng, expiresAt) {
  const row = { user_id: uid(), lat: round3(lat), lng: round3(lng), expires_at: new Date(expiresAt).toISOString() };
  const { data, error } = await sb.from('sp_presence').upsert(row, { onConflict: 'user_id' }).select('*').single();
  if (error) throw error;
  last = { lat: row.lat, lng: row.lng, at: Date.now() };
  setState((s) => ({ presence: { ...s.presence, [data.user_id]: data } }));
}

function arm(sharing) {
  clearTimeout(stopTimer);
  stopTimer = setTimeout(() => stopSharing('expired'), Math.max(0, sharing.expiresAt - Date.now()));
  if (watchId == null && 'geolocation' in navigator) {
    watchId = navigator.geolocation.watchPosition((p) => {
      const s = getState().sharing;
      if (!s) return;
      const lat = p.coords.latitude;
      const lng = p.coords.longitude;
      const moved = !last || distM([last.lat, last.lng], [lat, lng]) > 80;
      const stale = !last || Date.now() - last.at > 4 * 60 * 1000;
      if ((moved || stale) && (round3(lat) !== last?.lat || round3(lng) !== last?.lng || stale)) {
        write(lat, lng, s.expiresAt).catch((e) => console.warn('presence update failed', e));
      }
    }, (e) => console.warn('watch error', e), { enableHighAccuracy: false, maximumAge: 60000, timeout: 30000 });
  }
}

export async function startSharing() {
  const p = await position({ maximumAge: 0 });
  const startedAt = Date.now();
  const sharing = { startedAt, expiresAt: startedAt + LIFETIME };
  await write(p.coords.latitude, p.coords.longitude, sharing.expiresAt);
  persist(sharing);
  setState({ sharing });
  arm(sharing);
  return [p.coords.latitude, p.coords.longitude];
}

export async function stopSharing(reason = 'ghost') {
  clearTimeout(stopTimer);
  if (watchId != null) navigator.geolocation.clearWatch(watchId);
  watchId = null;
  last = null;
  persist(null);
  setState((s) => {
    const presence = { ...s.presence };
    delete presence[uid()];
    return { sharing: null, presence };
  });
  const { error } = await sb.from('sp_presence').delete().eq('user_id', uid());
  if (error) throw error;
  if (reason === 'expired') toast('Live location switched itself off after 2 hours.');
}

// After a reload: keep sharing only if the 2-hour window is still open and
// the row is still there.
export async function resumeSharing() {
  const saved = readPersisted();
  const mine = getState().presence[uid()];
  if (saved && saved.expiresAt > Date.now() && mine) {
    setState({ sharing: saved });
    arm(saved);
  } else {
    persist(null);
    if (mine && new Date(mine.expires_at) <= new Date()) await stopSharing('stale').catch(() => {});
  }
}

// ---------------------------------------------------------------- realtime
let channel = null;
let sweep = null;

export function startRealtime() {
  stopRealtime();
  const byId = () => Object.fromEntries(Object.values(getState().presence).map((r) => [r.id, r.user_id]));
  channel = sb.channel('spotted-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sp_presence' }, (msg) => {
      if (msg.eventType === 'DELETE') {
        const who = byId()[msg.old?.id];
        if (!who) return;
        setState((s) => { const presence = { ...s.presence }; delete presence[who]; return { presence }; });
      } else if (msg.new?.user_id) {
        setState((s) => ({ presence: { ...s.presence, [msg.new.user_id]: msg.new } }));
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'sp_friendships' }, async (msg) => {
      const before = getState().friendships;
      await loadFriendships();
      const after = getState().friendships;
      const me = uid();
      if (msg.eventType === 'INSERT' && msg.new?.addressee === me) {
        const f = after.find((r) => r.id === msg.new.id);
        if (f) toast(`${f.name} sent you a friend request`);
      }
      if (msg.eventType === 'UPDATE' && msg.new?.status === 'accepted' && msg.new.requester === me) {
        const f = after.find((r) => r.id === msg.new.id);
        const was = before.find((r) => r.id === msg.new.id);
        if (f && was?.state !== 'friends') toast(`${f.name} accepted your request`);
      }
      loadSocial().catch(() => {});
    })
    .subscribe();
  // Expired rows vanish from RLS reads; drop them locally too.
  sweep = setInterval(() => {
    const now = Date.now();
    const p = getState().presence;
    const keep = Object.fromEntries(Object.entries(p).filter(([, r]) => new Date(r.expires_at).getTime() > now));
    if (Object.keys(keep).length !== Object.keys(p).length) setState({ presence: keep });
  }, 30_000);
}

export function stopRealtime() {
  if (channel) sb.removeChannel(channel);
  channel = null;
  clearInterval(sweep);
}

export function teardownLive() {
  stopRealtime();
  clearTimeout(stopTimer);
  if (watchId != null) navigator.geolocation.clearWatch(watchId);
  watchId = null;
  persist(null);
}
