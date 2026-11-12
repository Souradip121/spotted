// Friends, Free now (weekly grid + "free till"), requests, and people search.
import { html, useEffect, useRef, useState } from 'preact-htm';
import { useStore, getState, toast, fail, go, back, DAYS, HOURS, EMPTY_GRID, weekDates, dayBlocks, freeState, freeLabel, slotIndex, fmtHour, plural } from '../lib/core.js';
import { relation, requestFriend, respondFriend, unfriend, saveGrid, setFreeUntil, searchPeople } from '../lib/data.js';
import { Icon, Avatar, Switch, Sprockets, EdgePrint, openSheet, closeSheet, Confirm, Spinner, Loader } from '../ui/kit.js';
import { shareSheet, goGhost } from './map.js';

// ---------------------------------------------------------------- friend button
export function FriendButton({ id, name, small = true }) {
  const rel = useStore(() => relation(id));
  const req = useStore((s) => s.friendships.find((f) => f.other_id === id));
  const [busy, setBusy] = useState(false);
  const run = async (fn, msg) => {
    setBusy(true);
    try { await fn(); if (msg) toast(msg); } catch (e) { fail(e); }
    setBusy(false);
  };
  const cls = `btn ${small ? 'sm' : ''}`;
  if (busy) return html`<button class=${cls + ' quiet'} disabled><${Spinner} /></button>`;
  if (rel === 'friends') {
    return html`<button class=${cls + ' done'} onClick=${() => openSheet(() => html`<${Confirm} title=${`Unfriend ${name}?`}
      body="You'll stop seeing each other's free time and live location." confirm="Unfriend"
      onConfirm=${() => unfriend(id).then(() => toast(`You and ${name} are no longer friends.`))} />`)}>
      <${Icon} name="check" cls="sm" />Friends</button>`;
  }
  if (rel === 'outgoing') {
    return html`<button class=${cls + ' quiet'} onClick=${() => openSheet(() => html`<${Confirm} title="Cancel your request?" confirm="Cancel request" danger=${false}
      onConfirm=${() => unfriend(id)} />`)}>Requested</button>`;
  }
  if (rel === 'incoming') {
    return html`<button class=${cls} onClick=${() => run(() => respondFriend(req.id, true), `You and ${name} are friends now.`)}>Accept</button>`;
  }
  return html`<button class=${cls + ' outline'} onClick=${() => run(async () => {
    const r = await requestFriend(id);
    if (r === 'accepted') toast(`You and ${name} are friends now.`);
    else toast(`Request sent to ${name}.`);
  })}>Add friend</button>`;
}

// ---------------------------------------------------------------- week grid
function DayCell({ grid, day, today, nowRow, mine, onEdit }) {
  const blocks = dayBlocks(grid, day);
  return html`<div class=${`daycell ${today ? 'today' : ''} ${mine ? 'mine' : ''}`} onClick=${mine ? onEdit : undefined}
    role=${mine ? 'button' : undefined} tabindex=${mine ? 0 : undefined}
    aria-label=${`${DAYS[day]}: ${blocks.length ? blocks.map((b) => `${fmtHour(new Date(2000, 0, 1, 8 + b.start))} to ${fmtHour(new Date(2000, 0, 1, 8 + b.end))}`).join(', ') : 'busy'}`}>
    ${blocks.map((b) => html`<span class="bar" style=${`top:calc(${(b.start / 12) * 100}% + 1px);height:max(3px, calc(${((b.end - b.start) / 12) * 100}% - 2px))`}></span>`)}
    ${today && nowRow != null ? html`<span class="now" style=${`top:${nowRow}%`}></span>` : null}
  </div>`;
}

function WeekEditor({ initial }) {
  const [grid, setGrid] = useState(initial || EMPTY_GRID);
  const [busy, setBusy] = useState(false);
  const paint = useRef(null);
  const set = (i, v) => setGrid((g) => g.slice(0, i) + v + g.slice(i + 1));
  const at = (e) => {
    const t = document.elementFromPoint(e.clientX, e.clientY);
    return t?.dataset?.i != null ? Number(t.dataset.i) : null;
  };
  return html`<div class="stack" style="--gap:14px">
    <div class="stack" style="--gap:4px">
      <h2 class="h2">Your usual week</h2>
      <p class="hint" style="margin:0">Tap or drag over the hours you're usually free. It repeats every week, and only your friends see it.</p>
    </div>
    <div class="week-editor"
      onPointerDown=${(e) => { const i = at(e); if (i == null) return; paint.current = grid[i] === '1' ? '0' : '1'; set(i, paint.current); e.currentTarget.setPointerCapture?.(e.pointerId); }}
      onPointerMove=${(e) => { if (!paint.current) return; const i = at(e); if (i != null) set(i, paint.current); }}
      onPointerUp=${() => { paint.current = null; }} onPointerCancel=${() => { paint.current = null; }}>
      <span></span>${DAYS.map((d) => html`<span class="dh">${d}</span>`)}
      ${HOURS.map((h, hi) => html`
        <span class="hh">${fmtHour(new Date(2000, 0, 1, h))}</span>
        ${DAYS.map((_, d) => { const i = d * 12 + hi; return html`<button type="button" class=${`slot ${grid[i] === '1' ? 'on' : ''}`} data-i=${i}
          aria-pressed=${grid[i] === '1'} aria-label=${`${DAYS[d]} ${fmtHour(new Date(2000, 0, 1, h))}`}
          onKeyDown=${(e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); set(i, grid[i] === '1' ? '0' : '1'); } }}></button>`; })}
      `)}
    </div>
    <div class="row" style="--gap:10px">
      <button class="btn quiet grow" onClick=${closeSheet}>Cancel</button>
      <button class="btn grow" disabled=${busy} onClick=${async () => {
        setBusy(true);
        try { await saveGrid(grid); closeSheet(); toast('Your week is saved.'); } catch (e) { setBusy(false); fail(e); }
      }}>${busy ? html`<${Spinner} />` : 'Save my week'}</button>
    </div>
  </div>`;
}

function FreeTill() {
  const me = useStore((s) => s.me);
  const mine = useStore((s) => s.slots[s.me?.id]);
  const st = freeState(mine);
  const now = new Date();
  const opts = [];
  for (let h = now.getHours() + 1; h <= Math.min(now.getHours() + 6, 23) && opts.length < 4; h++) {
    const d = new Date(now); d.setHours(h, 0, 0, 0); opts.push(d);
  }
  const set = async (d) => {
    try { await setFreeUntil(d); toast(d ? `Friends see you're free till ${fmtHour(d)}.` : 'Free status cleared.'); } catch (e) { fail(e); }
  };
  const statusOn = mine?.free_until && new Date(mine.free_until) > now;
  return html`<div class="freebar" role="group" aria-label="Tell friends you're free">
    <span class="h3 freebar-label">${statusOn ? `Free till ${fmtHour(new Date(mine.free_until))}` : st.free ? `Your week: ${freeLabel(st)}` : 'Free now?'}</span>
    ${opts.slice(0, 3).map((d) => html`<button class="chip sm" aria-pressed=${statusOn && new Date(mine.free_until).getHours() === d.getHours()} onClick=${() => set(d)}>till ${fmtHour(d)}</button>`)}
    ${statusOn ? html`<button class="chip sm" onClick=${() => set(null)} aria-label="Clear free status"><${Icon} name="x" cls="sm" /></button>` : null}
  </div>`;
}

function FreeNow() {
  const friendships = useStore((s) => s.friendships);
  const slots = useStore((s) => s.slots);
  const me = useStore((s) => s.me);
  const sharing = useStore((s) => s.sharing);
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 60_000); return () => clearInterval(t); }, []);
  const friends = friendships.filter((f) => f.state === 'friends');
  const now = new Date();
  const dates = weekDates(now);
  const todayIdx = (now.getDay() + 6) % 7;
  const nowRow = now.getHours() >= 8 && now.getHours() < 20 ? ((now.getHours() - 8 + now.getMinutes() / 60) / 12) * 100 : null;
  const fmtD = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const rows = friends
    .map((f) => ({ f, st: freeState(slots[f.other_id], now) }))
    .sort((a, b) => Number(b.st.free) - Number(a.st.free) || a.f.name.localeCompare(b.f.name));
  const myGrid = slots[me?.id]?.grid || EMPTY_GRID;
  const edit = () => openSheet(() => html`<${WeekEditor} initial=${myGrid} />`);

  return html`<div class="stack" style="--gap:22px">
    <div class="free-head">
      <div class="stack" style="--gap:4px">
        <div class="free-title"><span class="dot" aria-hidden="true"></span><h2 class="h2">Free now</h2></div>
        <span class="muted ui">${rows.filter((r) => r.st.free).length ? `${plural(rows.filter((r) => r.st.free).length, 'friend')} free right now` : 'Who’s free this week'}</span>
      </div>
      <span class="week-range">${DAYS[0]} ${fmtD(dates[0]).split(' ')[0]} – ${DAYS[5]} ${fmtD(dates[5])}</span>
    </div>
    <div class="grid" role="table" aria-label="Free hours this week, 8 am to 8 pm">
      <span></span>
      ${dates.map((d, i) => html`<span class=${`dayhead ${i === todayIdx ? 'today' : ''}`}>${DAYS[i]}<b>${d.getDate()}</b></span>`)}
      <button class="who you" onClick=${edit} style="text-align:left"><${Avatar} person=${me} size=${38} /><span>You<small class="edit-week">Edit week</small></span></button>
      ${DAYS.map((_, d) => html`<${DayCell} grid=${myGrid} day=${d} today=${d === todayIdx} nowRow=${nowRow} mine onEdit=${edit} />`)}
      ${rows.map(({ f, st }) => html`
        <a class="who" href=${'#/u/' + f.other_id} title=${freeLabel(st) || ''}><${Avatar} person=${{ name: f.name, avatar_path: f.avatar_path, is_demo: f.is_demo }} size=${38} /><span>${f.name}${f.is_demo ? html`<small class="edge demo-mark">DEMO</small>` : null}</span></a>
        ${DAYS.map((_, d) => html`<${DayCell} grid=${slots[f.other_id]?.grid || EMPTY_GRID} day=${d} today=${d === todayIdx} nowRow=${nowRow} />`)}
      `)}
    </div>
    ${!friends.length ? html`<div class="empty"><${Icon} name="users" /><p>Add friends to see when they’re free. Your grid is only ever shown to friends.</p><a class="btn sm outline" href="#/search">Find people</a></div>` : null}
    <${FreeTill} />
  </div>`;
}

function RequestCard({ r }) {
  const [busy, setBusy] = useState(false);
  const act = async (accept) => {
    setBusy(true);
    try { await respondFriend(r.id, accept); toast(accept ? `You and ${r.name} are friends now.` : 'Request ignored. They won’t be told.'); } catch (e) { fail(e); setBusy(false); }
  };
  return html`<div class="request-card strip">
    <${Sprockets} />
    <div class="inner">
      <a href=${'#/u/' + r.other_id}><${Avatar} person=${{ name: r.name, avatar_path: r.avatar_path, is_demo: r.is_demo }} size=${54} /></a>
      <div class="grow" style="min-width:0">
        <div class="h3">${r.name} sent you a request ${r.is_demo ? html`<span class="demo-tag" style="vertical-align:2px;margin-left:4px">Demo</span>` : null}</div>
        <div class="faint ui small">${r.mutuals ? `You have ${plural(r.mutuals, 'mutual friend')}` : r.college || 'No mutual friends yet'}</div>
        <div class="row" style="--gap:8px;margin-top:10px">
          <button class="btn sm" disabled=${busy} onClick=${() => act(true)}>Accept</button>
          <button class="btn sm quiet" disabled=${busy} onClick=${() => act(false)}>Ignore</button>
        </div>
      </div>
    </div>
    <${Sprockets} />
    <${EdgePrint} left=${r.is_demo ? 'DEMO 400' : 'SPOTTED 400'} arrow=${false} />
  </div>`;
}

function ShareRow() {
  const sharing = useStore((s) => s.sharing);
  return html`<button class="setting button" role="switch" aria-checked=${Boolean(sharing)} onClick=${() => (sharing ? goGhost() : shareSheet())}>
    <${Icon} name="pin" />
    <span class="grow"><span class="t1" style="display:block">Share live location</span><span class="t2">${sharing ? `On · switches off at ${fmtHour(new Date(sharing.expiresAt))}` : 'With friends only · off by default'}</span></span>
    <${Switch} on=${Boolean(sharing)} />
  </button>`;
}

export function FriendsScreen({ tab = 'free' }) {
  const friendships = useStore((s) => s.friendships);
  const slots = useStore((s) => s.slots);
  const presence = useStore((s) => s.presence);
  const incoming = friendships.filter((f) => f.state === 'incoming');
  const outgoing = friendships.filter((f) => f.state === 'outgoing');
  const friends = friendships.filter((f) => f.state === 'friends').sort((a, b) => a.name.localeCompare(b.name));
  const tabs = [['list', 'Friends'], ['free', 'Free now'], ['requests', 'Requests']];

  return html`<section class="screen">
    <header class="topbar">
      <h1 class="wordmark">Spotted</h1>
      <span class="spacer"></span>
      <a class="icon-btn" href="#/search" aria-label="Add friends"><${Icon} name="userPlus" /></a>
    </header>
    <div class="page stack" style="--gap:22px">
      <div class="seg" role="tablist">
        ${tabs.map(([k, l]) => html`<button role="tab" aria-selected=${tab === k} onClick=${() => go('/friends/' + k, { replace: true })}>
          ${l}${k === 'requests' && incoming.length ? html`<span class="badge">${incoming.length}</span>` : null}</button>`)}
      </div>

      ${tab === 'free' ? html`<${FreeNow} />` : null}

      ${tab === 'list' ? html`<div class="list">
        ${friends.length ? friends.map((f) => {
          const st = freeState(slots[f.other_id]);
          const live = presence[f.other_id];
          return html`<a class="list-item" href=${'#/u/' + f.other_id} key=${f.id}>
            <${Avatar} person=${{ name: f.name, avatar_path: f.avatar_path, is_demo: f.is_demo }} size=${46} />
            <span class="grow" style="min-width:0"><span class="t1 ellipsis" style="display:block">${f.name}</span><span class="t2 ellipsis" style="display:block">${f.college || (f.mutuals ? plural(f.mutuals, 'mutual friend') : '')}</span></span>
            ${st.free ? html`<span class="status">${freeLabel(st)}</span>` : live ? html`<span class="status live">on the map</span>` : null}
          </a>`;
        }) : html`<div class="empty"><${Icon} name="users" /><p>No friends yet. Find classmates and club members by name.</p><a class="btn sm outline" href="#/search">Find people</a></div>`}
      </div>` : null}

      ${tab === 'requests' ? html`<div class="stack" style="--gap:18px">
        ${incoming.length ? incoming.map((r) => html`<${RequestCard} r=${r} key=${r.id} />`) : html`<p class="faint ui" style="margin:0">No new requests.</p>`}
        ${outgoing.length ? html`<div class="stack" style="--gap:6px">
          <h2 class="h3 muted">Sent</h2>
          <div class="list">${outgoing.map((r) => html`<div class="list-item" key=${r.id}>
            <a href=${'#/u/' + r.other_id}><${Avatar} person=${{ name: r.name, avatar_path: r.avatar_path, is_demo: r.is_demo }} size=${46} /></a>
            <span class="grow t1">${r.name}</span><${FriendButton} id=${r.other_id} name=${r.name} />
          </div>`)}</div>
        </div>` : null}
      </div>` : null}

      ${tab !== 'requests' && incoming.length ? html`<${RequestCard} r=${incoming[0]} />` : null}
      <${ShareRow} />
    </div>
  </section>`;
}

// ---------------------------------------------------------------- search
export function SearchScreen() {
  const [q, setQ] = useState('');
  const [res, setRes] = useState(null);
  const [busy, setBusy] = useState(false);
  useStore((s) => s.friendships);
  useEffect(() => {
    if (q.trim().length < 2) { setRes(null); return; }
    setBusy(true);
    const t = setTimeout(async () => {
      try { setRes(await searchPeople(q)); } catch (e) { fail(e); }
      setBusy(false);
    }, 250);
    return () => clearTimeout(t);
  }, [q]);
  return html`<section class="screen">
    <header class="topbar">
      <a class="icon-btn" href="#/friends/list" aria-label="Back to friends" onClick=${(e) => { e.preventDefault(); back('/friends/list'); }}><${Icon} name="back" /></a>
      <h1 class="h2">Find people</h1>
    </header>
    <div class="page stack" style="--gap:16px">
      <label class="searchbox"><${Icon} name="search" /><span class="sr-only">Name</span>
        <input autofocus placeholder="Search by name" value=${q} onInput=${(e) => setQ(e.currentTarget.value)} autocomplete="off" enterkeyhint="search" /></label>
      ${busy && !res ? html`<${Loader} />` : null}
      ${res && !res.length ? html`<p class="faint ui" style="margin:0">Nobody called “${q.trim()}” yet. Share the link with them.</p>` : null}
      ${res?.length ? html`<div class="list">${res.map((p) => html`<div class="list-item" key=${p.id}>
        <a href=${'#/u/' + p.id} class="row grow" style="--gap:14px;text-decoration:none;min-width:0">
          <${Avatar} person=${p} size=${46} />
          <span class="grow" style="min-width:0"><span class="t1 ellipsis" style="display:block">${p.name}</span><span class="t2 ellipsis" style="display:block">${p.college || ''}</span></span>
        </a>
        <${FriendButton} id=${p.id} name=${p.name} />
      </div>`)}</div>` : null}
      ${!res ? html`<p class="hint" style="margin:0">Friends can see your free hours and, only when you switch it on, your live location. Add people you actually know.</p>` : null}
    </div>
  </section>`;
}
