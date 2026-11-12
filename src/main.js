// Spotted: boot, auth, routing and the film-strip nav.
import { html, render, useEffect, useState } from 'preact-htm';
import { sb, configured, useStore, setState, getState, useRoute, go, fail, plural } from './lib/core.js';
import { loadMe, loadFriendships, loadSocial, loadPosts } from './lib/data.js';
import { resumeSharing, startRealtime, teardownLive } from './lib/live.js';
import { Icon, Avatar, SheetHost, Toasts, Loader, Sprockets, EdgePrint } from './ui/kit.js';
import { MapScreen } from './views/map.js';
import { SignIn, Setup } from './views/auth.js';
import { PostScreen } from './views/post.js';
import { FriendsScreen, SearchScreen } from './views/friends.js';
import { ProfileScreen, FramesScreen, SettingsScreen } from './views/profile.js';
import { ComposeScreen } from './views/compose.js';

// An OAuth error comes back in the URL hash; keep the message, then tidy up.
let authError = null;
(() => {
  const h = new URLSearchParams(location.hash.replace(/^#/, ''));
  const q = new URLSearchParams(location.search);
  const desc = h.get('error_description') || q.get('error_description');
  if (desc) {
    authError = /access_denied|cancel/i.test(h.get('error') || q.get('error') || '') ? 'Sign-in was cancelled. Try again when you’re ready.' : `Sign-in didn’t work: ${desc.replace(/\+/g, ' ')}`;
    history.replaceState(history.state, '', location.pathname);
  }
})();

const EMPTY = { me: null, friendships: [], slots: {}, presence: {}, posts: [], likes: new Set(), sharing: null, postsLoaded: false };

async function loadAll() {
  await Promise.all([loadFriendships(), loadSocial(), loadPosts()]);
  await resumeSharing();
  startRealtime();
  sb.rpc('sp_purge_expired_presence').then(() => {}, () => {});
}

function Nav({ path }) {
  const me = useStore((s) => s.me);
  const incoming = useStore((s) => s.friendships.filter((f) => f.state === 'incoming').length);
  const frames = useStore((s) => s.posts.length);
  const at = (p) => (p === '/' ? path === '/' : path.startsWith(p)) ? 'page' : undefined;
  return html`<div class="filmnav">
    <${Sprockets} />
    <nav aria-label="Main">
      <a class="navbtn" href="#/" aria-current=${at('/')}><${Icon} name="map" />Map</a>
      <a class="navbtn" href="#/frames" aria-current=${at('/frames')}><${Icon} name="grid" />Frames</a>
      <a class="shutter" href="#/new" aria-label="Post a frame"><${Icon} name="plus" /></a>
      <a class="navbtn" href="#/friends/free" aria-current=${at('/friends')}><${Icon} name="users" />Friends
        ${incoming ? html`<span class="badge" aria-label=${plural(incoming, 'request')}>${incoming}</span>` : null}</a>
      <a class="navbtn" href="#/me" aria-current=${at('/me') || at('/u/' + me?.id)}><${Avatar} person=${me} size=${26} plain />You</a>
    </nav>
    <${EdgePrint} left="SPOTTED 400 · KALYANI" right=${String(frames).padStart(2, '0')} />
  </div>`;
}

function Signed() {
  const route = useRoute();
  const me = useStore((s) => s.me);
  const { parts, path, query } = route;

  // "Show on map" links: #/?at=<post id>
  useEffect(() => {
    const at = query.get('at');
    if (path === '/' && at) {
      const p = getState().posts.find((x) => x.id === at);
      if (p) setTimeout(() => dispatchEvent(new CustomEvent('spotted:fly', { detail: p })), 80);
      go('/', { replace: true });
    }
  }, [path, query.toString()]);

  let screen = null;
  switch (parts[0]) {
    case undefined: break;
    case 'frames': screen = html`<${FramesScreen} />`; break;
    case 'friends': screen = html`<${FriendsScreen} tab=${['list', 'free', 'requests'].includes(parts[1]) ? parts[1] : 'free'} />`; break;
    case 'search': screen = html`<${SearchScreen} />`; break;
    case 'p': screen = html`<${PostScreen} id=${parts[1]} key=${parts[1]} />`; break;
    case 'u': screen = html`<${ProfileScreen} id=${parts[1]} key=${parts[1]} />`; break;
    case 'me': screen = html`<${ProfileScreen} />`; break;
    case 'settings': screen = html`<${SettingsScreen} />`; break;
    case 'profile': screen = html`<section class="screen"><${Setup} existing=${me} onDone=${() => go('/me', { replace: true })} /></section>`; break;
    case 'new': screen = html`<${ComposeScreen} />`; break;
    default: screen = null;
  }
  return html`
    <${MapScreen} active=${!screen} />
    ${screen}
    <${Nav} path=${path} />
  `;
}

function App() {
  const booted = useStore((s) => s.booted);
  const session = useStore((s) => s.session);
  const me = useStore((s) => s.me);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    if (!configured) return;
    sb.auth.getSession().then(({ data }) => setState({ session: data.session, booted: true }));
    const { data } = sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') { teardownLive(); setState({ ...EMPTY, session: null }); setProfileChecked(false); go('/', { replace: true }); return; }
      if (session?.user?.id !== getState().session?.user?.id) setProfileChecked(false);
      setState({ session });
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const uid = session?.user?.id;
  useEffect(() => {
    if (!uid) return;
    let live = true;
    loadMe()
      .then((p) => { if (!live) return; setProfileChecked(true); if (p) return loadAll(); })
      .catch((e) => { if (live) { setProfileChecked(true); fail(e, 'Couldn’t reach Spotted. Check your connection and reload.'); } });
    return () => { live = false; };
  }, [uid]);

  // After the first profile save, load everything else.
  useEffect(() => { if (me && profileChecked && !getState().postsLoaded) loadAll().catch((e) => fail(e)); }, [me?.id]);

  let body;
  if (!configured) body = html`<div class="page" style="padding-top:60px"><h1 class="wordmark">Spotted</h1><p class="muted">Add your Supabase URL and anon key to <code>config.js</code> to start. See the README.</p></div>`;
  else if (!booted || (session && !profileChecked)) body = html`<${Loader} label="Opening Spotted" />`;
  else if (!session) body = html`<${SignIn} error=${authError} />`;
  else if (!me) body = html`<section class="screen full" style="z-index:40"><${Setup} onDone=${() => go('/', { replace: true })} /></section>`;
  else body = html`<${Signed} />`;

  return html`<div class="app">${body}<${SheetHost} /><${Toasts} /></div>`;
}

render(html`<${App} />`, document.getElementById('app'));
