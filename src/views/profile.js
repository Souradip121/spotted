// Profiles (yours and others'), the frames contact sheet, and settings.
import { html, useEffect, useState } from 'preact-htm';
import { useStore, sb, back, go, toast, fail, freeState, freeLabel, plural, fmtHour, ago } from '../lib/core.js';
import { loadProfile, profilePosts, relation, loadBlocks, unblock, deleteEverything } from '../lib/data.js';
import { Icon, Avatar, Photo, Sprockets, EdgePrint, stockFor, openSheet, closeSheet, Confirm, Loader, Switch } from '../ui/kit.js';
import { FriendButton } from './friends.js';
import { ReportSheet, blockSheet } from './post.js';
import { shareSheet, goGhost } from './map.js';

export function ContactSheet({ posts }) {
  return html`<div class="strip">
    <${Sprockets} />
    <div class="sheet-grid">
      ${posts.map((p) => html`<a class="sheet-cell" href=${'#/p/' + p.id} key=${p.id} aria-label=${`${p.caption || 'Photo'} at ${p.place_name || 'Kalyani'}`}>
        <${Photo} path=${p.thumb_path} demo=${p.is_demo} alt="" />
        <span class="edge fn">${p.is_demo ? 'DEMO ' : ''}${String(p.frame_no).padStart(2, '0')}</span>
        ${p.like_count ? html`<span class="likes"><svg class="icon" viewBox="0 0 24 24"><path d="M12 20.3s-7.8-4.6-8.9-10A4.9 4.9 0 0 1 12 6.6a4.9 4.9 0 0 1 8.9 3.7c-1.1 5.4-8.9 10-8.9 10Z"/></svg>${p.like_count}</span>` : null}
      </a>`)}
    </div>
    <${Sprockets} />
    <${EdgePrint} left="SPOTTED 400" mid=${plural(posts.length, 'FRAME')} />
  </div>`;
}

function ProfileMenu({ person }) {
  return html`<div class="menu">
    <button onClick=${() => openSheet(() => html`<${ReportSheet} userId=${person.id} name=${person.name} />`)}><${Icon} name="flag" />Report ${person.name}</button>
    <button class="danger" onClick=${() => blockSheet(person, () => back('/'))}><${Icon} name="block" />Block ${person.name}</button>
    <button onClick=${closeSheet}><${Icon} name="x" />Cancel</button>
  </div>`;
}

export function ProfileScreen({ id }) {
  const me = useStore((s) => s.me);
  const isMe = !id || id === me?.id;
  const pid = isMe ? me?.id : id;
  const slot = useStore((s) => s.slots[pid]);
  const live = useStore((s) => s.presence[pid]);
  const rel = useStore(() => relation(pid));
  const fr = useStore((s) => s.friendships.find((f) => f.other_id === pid));
  const allPosts = useStore((s) => s.posts);
  const [person, setPerson] = useState(isMe ? me : null);
  const [posts, setPosts] = useState(null);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let on = true;
    if (isMe) setPerson(me);
    else loadProfile(pid).then((p) => { if (!on) return; p ? setPerson(p) : setMissing(true); }).catch(() => on && setMissing(true));
    profilePosts(pid).then((p) => on && setPosts(p)).catch(() => on && setPosts([]));
    return () => { on = false; };
  }, [pid, isMe, me, allPosts.length]);

  if (missing) {
    return html`<section class="screen"><header class="topbar"><button class="icon-btn" onClick=${() => back('/')} aria-label="Back"><${Icon} name="back" /></button></header>
      <div class="page"><div class="empty"><${Icon} name="users" /><p>This profile isn’t available.</p></div></div></section>`;
  }
  if (!person) return html`<section class="screen"><${Loader} /></section>`;
  const st = freeState(slot);
  const likes = (posts || []).reduce((n, p) => n + p.like_count, 0);

  return html`<section class="screen">
    <header class="topbar">
      ${isMe ? html`<h1 class="wordmark">You</h1>` : html`<button class="icon-btn" onClick=${() => back('/')} aria-label="Back"><${Icon} name="back" /></button>`}
      <span class="spacer"></span>
      ${isMe ? html`<a class="icon-btn" href="#/settings" aria-label="Settings"><${Icon} name="gear" /></a>`
        : html`<button class="icon-btn" aria-label="More options" onClick=${() => openSheet(() => html`<${ProfileMenu} person=${person} />`)}><${Icon} name="more" /></button>`}
    </header>
    <div class="profile-head">
      <${Avatar} person=${person} size=${108} />
      <h2 class="h1">${person.name}</h2>
      ${person.college ? html`<p class="muted ui" style="margin:-4px 0 0">${person.college}</p>` : null}
      <div class="row" style="--gap:8px;justify-content:center;flex-wrap:wrap">
        ${person.is_demo ? html`<span class="demo-tag">Demo profile</span>` : null}
        ${st.free ? html`<span class="status">${freeLabel(st)}</span>` : null}
        ${live && !isMe ? html`<span class="status live">on the map</span>` : null}
      </div>
      <div class="stats">
        <div><b class="num">${posts ? posts.length : '–'}</b><span>Frames</span></div>
        <div><b class="num">${posts ? likes : '–'}</b><span>Likes</span></div>
        ${fr?.mutuals ? html`<div><b class="num">${fr.mutuals}</b><span>Mutual</span></div>` : null}
      </div>
      <div class="row" style="--gap:10px;margin-top:6px">
        ${isMe ? html`<a class="btn sm quiet" href="#/profile/edit"><${Icon} name="edit" cls="sm" />Edit profile</a><a class="btn sm quiet" href="#/friends/free"><${Icon} name="clock" cls="sm" />My week</a>`
          : html`<${FriendButton} id=${pid} name=${person.name} small=${false} />`}
      </div>
      ${!isMe && rel !== 'friends' ? html`<p class="hint" style="margin:4px 0 0;max-width:34ch">Free hours and live location are only shared between friends.</p>` : null}
    </div>
    ${posts == null ? html`<${Loader} />` : posts.length ? html`<${ContactSheet} posts=${posts} />` : html`<div class="page"><div class="empty"><${Icon} name="camera" />
      <p>${isMe ? 'No frames yet. Your first photo goes here.' : `${person.name} hasn’t posted a frame yet.`}</p>
      ${isMe ? html`<a class="btn sm" href="#/new">Post a frame</a>` : null}</div></div>`}
    <div style="height:24px"></div>
  </section>`;
}

export function FramesScreen() {
  const posts = useStore((s) => s.posts);
  const loaded = useStore((s) => s.postsLoaded);
  return html`<section class="screen">
    <header class="topbar"><h1 class="wordmark">Frames</h1><span class="spacer"></span><span class="edge" style="padding-right:8px">${plural(posts.length, 'FRAME')} · KALYANI</span></header>
    ${!loaded ? html`<${Loader} />` : posts.length ? html`<${ContactSheet} posts=${posts} />` : html`<div class="page"><div class="empty"><${Icon} name="camera" /><p>No frames in Kalyani yet. Be the first.</p><a class="btn sm" href="#/new">Post a frame</a></div></div>`}
    <div style="height:24px"></div>
  </section>`;
}

function Blocked() {
  const [list, setList] = useState(null);
  useEffect(() => { loadBlocks().then(setList).catch(() => setList([])); }, []);
  if (!list) return null;
  if (!list.length) return html`<p class="t2" style="margin:0">You haven’t blocked anyone.</p>`;
  return html`<div class="list">${list.map((b) => html`<div class="list-item" key=${b.id}>
    <${Avatar} person=${b} size=${40} /><span class="grow t1">${b.name}<span class="t2" style="display:block">blocked ${ago(b.created_at)}</span></span>
    <button class="btn sm quiet" onClick=${async () => { try { await unblock(b.id); setList((l) => l.filter((x) => x.id !== b.id)); toast('Unblocked.'); } catch (e) { fail(e); } }}>Unblock</button>
  </div>`)}</div>`;
}

export function SettingsScreen() {
  const sharing = useStore((s) => s.sharing);
  const session = useStore((s) => s.session);
  const [showBlocked, setShowBlocked] = useState(false);
  return html`<section class="screen">
    <header class="topbar"><button class="icon-btn" onClick=${() => back('/')} aria-label="Back"><${Icon} name="back" /></button><h1 class="h2">Settings</h1></header>
    <div class="page stack" style="--gap:28px">
      <div>
        <h2 class="edge" style="margin:0 0 4px">Location</h2>
        <button class="setting button" role="switch" aria-checked=${Boolean(sharing)} onClick=${() => (sharing ? goGhost() : shareSheet())}>
          <${Icon} name="pin" />
          <span class="grow"><span class="t1" style="display:block">Share live location</span><span class="t2">${sharing ? `On · switches off at ${fmtHour(new Date(sharing.expiresAt))}` : 'Off. Friends only, about 100 m, max 2 hours.'}</span></span>
          <${Switch} on=${Boolean(sharing)} />
        </button>
        <button class="setting button" onClick=${() => (sharing ? goGhost() : toast('You’re already a ghost. Nobody can see your location.'))}>
          <${Icon} name="ghost" /><span class="grow"><span class="t1" style="display:block">Ghost mode</span><span class="t2">One tap deletes your live location.</span></span>
        </button>
      </div>
      <div>
        <h2 class="edge" style="margin:0 0 4px">Account</h2>
        <a class="setting" href="#/profile/edit" style="text-decoration:none"><${Icon} name="edit" /><span class="grow t1">Edit profile</span></a>
        <button class="setting button" onClick=${() => setShowBlocked((v) => !v)} aria-expanded=${showBlocked}><${Icon} name="block" /><span class="grow t1">Blocked people</span></button>
        ${showBlocked ? html`<div style="padding:4px 0 8px 38px"><${Blocked} /></div>` : null}
        <button class="setting button" onClick=${() => sb.auth.signOut()}><${Icon} name="out" /><span class="grow"><span class="t1" style="display:block">Sign out</span><span class="t2">${session?.user?.email || ''}</span></span></button>
        <button class="setting button" onClick=${() => openSheet(() => html`<${Confirm} title="Delete your Spotted data?"
          body="Your profile, frames, likes, comments, friends, free hours and location are deleted for good. Your Google sign-in itself isn't touched."
          confirm="Delete everything" onConfirm=${async () => { try { await deleteEverything(); } catch (e) { fail(e); throw e; } }} />`)}>
          <${Icon} name="trash" /><span class="grow"><span class="t1" style="display:block;color:var(--red-hot)">Delete my Spotted data</span></span>
        </button>
      </div>
      <div>
        <h2 class="edge" style="margin:0 0 10px">How Spotted keeps you safe</h2>
        <ul class="stack" style="--gap:10px;list-style:none;margin:0;padding:0">
          ${[
            ['ghost', 'Live location is off by default, friends-only, about 100 m, and off after 2 hours. No history is kept.'],
            ['pin', 'Photos are resized on your phone and their hidden data (GPS, camera) is removed before upload.'],
            ['clock', 'Your free hours are only shown to accepted friends.'],
            ['block', 'Blocking hides you from each other completely, both ways.'],
            ['shield', 'Every rule is enforced by the database, not just the app.'],
          ].map(([i, t]) => html`<li class="row" style="--gap:12px;align-items:flex-start"><${Icon} name=${i} cls="sm" /><span class="t2" style="color:var(--text-2)">${t}</span></li>`)}
        </ul>
      </div>
      <a class="setting" href="https://github.com/Souradip121/spotted" target="_blank" rel="noopener" style="text-decoration:none">
        <${Icon} name="code" /><span class="grow"><span class="t1" style="display:block">Open source</span><span class="t2">Run Spotted for your own college town.</span></span>
      </a>
    </div>
  </section>`;
}
