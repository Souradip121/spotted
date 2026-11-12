// The town map: photo pins, friends who chose to share, filter chips, ghost.
import { html, useEffect, useRef, useState } from 'preact-htm';
import { useStore, setState, getState, go, toast, fail, freeState, freeLabel, fmtHour, initials, distM } from '../lib/core.js';
import { resolveUrl } from '../lib/media.js';
import { startSharing, stopSharing, locateOnce } from '../lib/live.js';
import { createMap, TOWN } from '../map/style.js';
import { Icon, Switch, openSheet, closeSheet, Spinner } from '../ui/kit.js';

// ---------------------------------------------------------------- DOM pins
function avatarEl(person) {
  const a = document.createElement('span');
  a.className = 'avatar';
  const mono = document.createElement('span');
  mono.className = 'mono';
  mono.textContent = initials(person?.name);
  a.append(mono);
  if (person?.avatar_path) {
    resolveUrl(person.avatar_path, person.is_demo).then((u) => {
      if (!u) return;
      const img = new Image();
      img.alt = '';
      img.decoding = 'async';
      img.onload = () => mono.remove();
      img.src = u;
      a.append(img);
    });
  }
  return a;
}

function photoPin(post) {
  const el = document.createElement('a');
  el.className = 'pin pin-photo' + (post.pin_precision === 'area' ? ' area' : '');
  el.href = '#/p/' + post.id;
  const where = post.place_name || 'Kalyani';
  el.setAttribute('aria-label', `Photo by ${post.author?.name || 'a member'} at ${where}${post.pin_precision === 'area' ? ' (approximate)' : ''}`);
  const disc = document.createElement('span');
  disc.className = 'disc';
  const img = new Image();
  img.alt = '';
  img.decoding = 'async';
  resolveUrl(post.thumb_path, post.is_demo).then((u) => { if (u) img.src = u; });
  disc.append(img);
  const tail = document.createElement('span');
  tail.className = 'tail';
  el.append(disc, tail);
  return el;
}

function friendPin(person, label, kind, href) {
  const el = document.createElement('a');
  el.className = 'pin pin-friend' + (kind === 'me' ? ' me' : '');
  el.href = href;
  el.setAttribute('aria-label', `${person.name}${label ? ', ' + label : ''}`);
  el.append(avatarEl(person));
  const tag = document.createElement('span');
  tag.className = 'pin-label';
  const dot = document.createElement('span');
  dot.className = 'dot' + (kind === 'me' ? ' live' : label ? '' : ' busy');
  const text = document.createElement('span');
  text.textContent = label ? `${person.name} · ${label}` : person.name;
  tag.append(dot, text);
  if (person.is_demo) {
    const demo = document.createElement('span');
    demo.className = 'edge demo-mark';
    demo.textContent = 'DEMO';
    tag.append(demo);
  }
  el.append(tag);
  return el;
}

// Pins are HTML, so the map's own label collision doesn't see them. After
// every move, nudge overlapping pins apart on screen (a few px, never more
// than ~70), so a busy corner of town still reads pin by pin.
function relax(map, markers) {
  const W = map.getContainer().clientWidth;
  const H = map.getContainer().clientHeight;
  const items = [];
  markers.forEach((m) => {
    const p = map.project(m.getLngLat());
    const base = m._base || [0, 0];
    if (p.x < -120 || p.y < -120 || p.x > W + 120 || p.y > H + 120) { m.setOffset(base); return; }
    const el = m.getElement();
    const w = el.offsetWidth || 56;
    const h = el.offsetHeight || 66;
    // Marker anchors: photo pins sit on their tail (bottom), friend pins on
    // the avatar centre (top + base offset).
    const cy = m._anchor === 'bottom' ? p.y + base[1] - h / 2 : p.y + base[1] + h / 2;
    items.push({ m, base, x: p.x + base[0], y: cy, w: w + 6, h: h + 4, dx: 0, dy: 0 });
  });
  for (let it = 0; it < 14; it++) {
    let moved = false;
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i];
        const b = items[j];
        const ox = (a.w + b.w) / 2 - Math.abs(b.x + b.dx - (a.x + a.dx));
        const oy = (a.h + b.h) / 2 - Math.abs(b.y + b.dy - (a.y + a.dy));
        if (ox <= 0 || oy <= 0) continue;
        moved = true;
        if (ox < oy) {
          const sgn = b.x + b.dx >= a.x + a.dx ? 1 : -1;
          a.dx -= (sgn * ox) / 2; b.dx += (sgn * ox) / 2;
        } else {
          const sgn = b.y + b.dy >= a.y + a.dy ? 1 : -1;
          a.dy -= (sgn * oy) / 2; b.dy += (sgn * oy) / 2;
        }
      }
    }
    // Keep pins (and their labels) inside the panel as a hard constraint,
    // so the next pass separates anything the edge pushed together.
    items.forEach((o) => {
      const left = o.x + o.dx - o.w / 2;
      const right = o.x + o.dx + o.w / 2;
      if (left < 4 && o.x > -o.w / 2) { o.dx += 4 - left; moved = true; }
      else if (right > W - 4 && o.x < W + o.w / 2) { o.dx -= right - (W - 4); moved = true; }
    });
    if (!moved) break;
  }
  const cap = (v, n) => Math.max(-n, Math.min(n, v));
  items.forEach((o) => o.m.setOffset([o.base[0] + cap(o.dx, 170), o.base[1] + cap(o.dy, 80)]));
}

// ---------------------------------------------------------------- sheets
export function shareSheet() {
  openSheet(() => html`<${ShareConsent} />`);
}
function ShareConsent() {
  const [busy, setBusy] = useState(false);
  const points = [
    ['users', 'Only friends you have accepted can see it.'],
    ['pin', 'Rounded to about 100 m, never your exact spot.'],
    ['clock', 'Switches itself off after 2 hours. Ghost mode turns it off now.'],
    ['shield', 'No history. There is only ever one row, and ghost mode deletes it.'],
  ];
  return html`<div class="stack" style="--gap:16px">
    <h2 class="h2">Share your live location?</h2>
    <ul class="stack" style="--gap:12px;list-style:none;margin:0;padding:0">
      ${points.map(([i, t]) => html`<li class="row" style="--gap:12px;align-items:flex-start"><${Icon} name=${i} cls="sm" /><span class="ui">${t}</span></li>`)}
    </ul>
    <div class="row" style="--gap:10px">
      <button class="btn quiet grow" onClick=${closeSheet}>Not now</button>
      <button class="btn grow" disabled=${busy} onClick=${async () => {
        setBusy(true);
        try {
          await startSharing();
          closeSheet();
          toast('Friends can see you for the next 2 hours.');
        } catch (e) {
          setBusy(false);
          if (e?.code === 1) toast('Location is blocked for this site. Allow it in your browser settings.', 'error', 5200);
          else fail(e, 'Couldn’t get your location. Try again outside or with GPS on.');
        }
      }}>${busy ? html`<${Spinner} />` : 'Share for 2 hours'}</button>
    </div>
  </div>`;
}
export async function goGhost() {
  try {
    await stopSharing('ghost');
    toast('You’re a ghost. Your location is deleted.');
  } catch (e) { fail(e); }
}

// ---------------------------------------------------------------- screen
export function MapScreen({ active }) {
  const el = useRef();
  const mapRef = useRef();
  const markers = useRef(new Map());
  const hereMarker = useRef();
  const posts = useStore((s) => s.posts);
  const presence = useStore((s) => s.presence);
  const friendships = useStore((s) => s.friendships);
  const slots = useStore((s) => s.slots);
  const filter = useStore((s) => s.filter);
  const sharing = useStore((s) => s.sharing);
  const me = useStore((s) => s.me);
  const postsLoaded = useStore((s) => s.postsLoaded);
  const [tick, setTick] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 60_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const map = createMap(el.current);
    mapRef.current = map;
    const far = () => el.current?.classList.toggle('zoom-far', map.getZoom() < 13.2);
    map.on('zoom', far);
    map.on('load', () => {
      far();
      setReady(true);
    });
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => { if (active) requestAnimationFrame(() => mapRef.current?.resize()); }, [active]);

  // Fly to a post when asked (#/?at=<post id>).
  useEffect(() => {
    const onFly = (e) => {
      const m = mapRef.current;
      if (m) m.flyTo({ center: [e.detail.lng, e.detail.lat], zoom: Math.max(m.getZoom(), 15.2), speed: 1.3 });
    };
    addEventListener('spotted:fly', onFly);
    return () => removeEventListener('spotted:fly', onFly);
  }, []);

  // First time there's something to show, frame all of it.
  const framed = useRef(false);
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready || framed.current || !postsLoaded) return;
    const [[w, so], [e, n]] = TOWN.bounds;
    const pts = [...posts.map((p) => [p.lng, p.lat]), ...Object.values(presence).map((r) => [r.lng, r.lat])]
      .filter(([x, y]) => x > w && x < e && y > so && y < n);
    framed.current = true;
    if (pts.length < 2) return;
    // A phone shows ~2 km of town at a readable zoom, so frame the busiest
    // part: everything within 1.8 km of the median pin.
    const med = (a) => [...a].sort((x, y) => x - y)[Math.floor(a.length / 2)];
    const mid = [med(pts.map((q) => q[1])), med(pts.map((q) => q[0]))];
    const core = pts.filter(([x, y]) => distM(mid, [y, x]) < 1800);
    if (core.length < 2) return;
    map.resize(); // the container may have changed size before the first frame
    const b = core.reduce((bb, c) => bb.extend(c), new window.maplibregl.LngLatBounds(core[0], core[0]));
    map.fitBounds(b, { padding: { top: 60, bottom: 70, left: 64, right: 64 }, maxZoom: 15, duration: 0 });
  }, [ready, postsLoaded, posts, presence]);

  // Keep DOM markers in sync with the store.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const want = [];
    const friendIds = new Set(friendships.filter((f) => f.state === 'friends').map((f) => f.other_id));
    const byId = Object.fromEntries(friendships.map((f) => [f.other_id, f]));

    if (filter !== 'free') {
      posts.forEach((p) => want.push({ key: 'p:' + p.id, sig: p.thumb_path + p.pin_precision, lat: p.lat, lng: p.lng, z: 1, make: () => photoPin(p), anchor: 'bottom' }));
    }
    if (filter !== 'photos') {
      Object.values(presence).forEach((row) => {
        if (new Date(row.expires_at) <= new Date()) return;
        const isMe = row.user_id === me?.id;
        if (!isMe && !friendIds.has(row.user_id)) return;
        const st = freeState(slots[row.user_id]);
        if (filter === 'free' && !isMe && !st.free) return;
        const person = isMe ? me : { id: row.user_id, name: byId[row.user_id]?.name || 'Friend', avatar_path: byId[row.user_id]?.avatar_path, is_demo: byId[row.user_id]?.is_demo };
        const label = isMe ? 'you · live' : freeLabel(st);
        want.push({
          key: 'f:' + row.user_id, sig: label + person.avatar_path + person.name, lat: row.lat, lng: row.lng, z: 2, anchor: 'top', yOff: -23,
          make: () => friendPin(person, label, isMe ? 'me' : 'friend', isMe ? '#/me' : '#/u/' + row.user_id),
        });
      });
    }
    const keep = new Set();
    want.forEach((w) => {
      keep.add(w.key);
      const off = [0, w.yOff || 0];
      let m = markers.current.get(w.key);
      if (m && m._sig !== w.sig) { m.remove(); m = null; }
      if (!m) {
        const node = w.make();
        node.style.zIndex = String(w.z);
        m = new window.maplibregl.Marker({ element: node, anchor: w.anchor, offset: off }).setLngLat([w.lng, w.lat]).addTo(map);
        m._sig = w.sig;
        m._anchor = w.anchor;
        markers.current.set(w.key, m);
      } else {
        m.setLngLat([w.lng, w.lat]);
      }
      m._base = off;
    });
    markers.current.forEach((m, k) => { if (!keep.has(k)) { m.remove(); markers.current.delete(k); } });
    requestAnimationFrame(() => relax(map, markers.current));
  }, [posts, presence, friendships, slots, filter, me, tick]);

  // Re-separate pins whenever the view settles.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const onEnd = () => relax(map, markers.current);
    map.on('moveend', onEnd);
    return () => map.off('moveend', onEnd);
  }, [ready]);

  const freeCount = friendships.filter((f) => f.state === 'friends' && freeState(slots[f.other_id]).free).length;
  const friendsLive = Object.values(presence).filter((r) => r.user_id !== me?.id && friendships.some((f) => f.state === 'friends' && f.other_id === r.user_id)).length;
  const setFilter = (f) => setState({ filter: f });

  let empty = null;
  if (ready && postsLoaded) {
    if (filter === 'free' && !Object.values(presence).some((r) => r.user_id !== me?.id && freeState(slots[r.user_id]).free)) {
      empty = freeCount ? `${freeCount} free, none sharing location` : 'No friends free right now';
    } else if (filter === 'photos' && !posts.length) empty = 'No frames yet. Post the first one.';
    else if (filter === 'friends' && !posts.length && !friendsLive) empty = 'Quiet here. Post a frame or add friends.';
  }

  const locate = async () => {
    try {
      const [lat, lng] = await locateOnce();
      const map = mapRef.current;
      const [[w, s], [e, n]] = TOWN.bounds;
      if (lng < w || lng > e || lat < s || lat > n) { toast('You’re outside Kalyani. The map stays on the town.'); return; }
      hereMarker.current?.remove();
      const dot = document.createElement('span');
      dot.className = 'here-dot';
      dot.setAttribute('aria-label', 'You are here (only you can see this)');
      hereMarker.current = new window.maplibregl.Marker({ element: dot }).setLngLat([lng, lat]).addTo(map);
      map.flyTo({ center: [lng, lat], zoom: 15.4, speed: 1.4 });
    } catch (e) {
      if (e?.code === 1) toast('Location is blocked for this site. Allow it in your browser settings.', 'error', 5200);
      else toast('Couldn’t find you. Try again with GPS on.', 'error');
    }
  };

  return html`<section class=${`mapscreen ${active ? '' : 'off'}`} aria-hidden=${active ? undefined : 'true'}>
    <header class="topbar">
      <h1 class="wordmark">Spotted</h1>
      <span class="spacer"></span>
      <button class="chip is-ghost" role="switch" aria-checked=${!sharing} aria-label="Ghost mode"
        onClick=${() => (sharing ? goGhost() : shareSheet())}>
        <${Icon} name="ghost" cls="sm" />Ghost <${Switch} on=${!sharing} cls="sm ghost" />
      </button>
      <a class="icon-btn" href="#/settings" aria-label="Settings"><${Icon} name="gear" /></a>
    </header>
    <div class="chips" role="toolbar" aria-label="Map filters">
      <button class="chip" aria-pressed=${filter === 'friends'} onClick=${() => setFilter('friends')}><${Icon} name="users" cls="sm" />Friends</button>
      <button class="chip" aria-pressed=${filter === 'photos'} onClick=${() => setFilter('photos')}><${Icon} name="image" cls="sm" />Photos</button>
      <button class="chip" aria-pressed=${filter === 'free'} onClick=${() => setFilter('free')}><span class="dot"></span>Free now${freeCount ? html` <span class="num">${freeCount}</span>` : ''}</button>
      <a class="chip" href="#/search" aria-label="Find people"><${Icon} name="userPlus" cls="sm" /></a>
    </div>
    <div class="mapwrap">
      <div class="map" ref=${el} role="region" aria-label="Map of Kalyani"></div>
      ${sharing ? html`<div class="map-banner">
        <span class="live" aria-hidden="true"></span>
        <span class="grow">Friends can see you · off at ${fmtHour(new Date(sharing.expiresAt))}</span>
        <button class="btn sm quiet" onClick=${goGhost}><${Icon} name="ghost" cls="sm" />Ghost</button>
      </div>` : null}
      ${empty ? html`<div class="map-empty">${empty}</div>` : null}
      <button class="map-fab locate" onClick=${locate} aria-label="Show where I am (only to me)"><${Icon} name="locate" /></button>
    </div>
  </section>`;
}
