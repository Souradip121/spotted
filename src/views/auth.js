// Sign in with Google, then develop your profile (name, college, photo, 18+).
import { html, useEffect, useRef, useState } from 'preact-htm';
import { sb, toast, fail, useStore } from '../lib/core.js';
import { saveProfile } from '../lib/data.js';
import { createMap, TOWN } from '../map/style.js';
import { Icon, Check, Spinner, EdgePrint, Sprockets, Avatar } from '../ui/kit.js';

const GoogleG = () => html`<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
  <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
  <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/>
</svg>`;

function DriftingMap() {
  const el = useRef();
  useEffect(() => {
    const map = createMap(el.current, { interactive: false, zoom: 14.1, center: [88.4425, 22.9735] });
    let raf;
    let t0;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const drift = (t) => {
      t0 ??= t;
      const k = (t - t0) / 1000;
      map.jumpTo({ center: [88.4425 + Math.sin(k / 38) * 0.012, 22.9735 + Math.cos(k / 46) * 0.007] });
      raf = requestAnimationFrame(drift);
    };
    map.on('load', () => { if (!reduce) raf = requestAnimationFrame(drift); });
    return () => { cancelAnimationFrame(raf); map.remove(); };
  }, []);
  return html`<div class="mapbg" aria-hidden="true"><div class="map" ref=${el}></div></div>`;
}

export function SignIn({ error }) {
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    const redirectTo = location.origin + location.pathname;
    const { error: err } = await sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
    if (err) { setBusy(false); fail(err, 'Couldn’t open Google sign-in. Try again.'); }
  };
  return html`<main class="signin">
    <${DriftingMap} />
    <div class="hero">
      <h1 class="wordmark">Spotted</h1>
      <p class="tag">Kalyani, in frames. Photos pinned where they were shot, and the friends who are free right now.</p>
      <div class="form-strip strip">
        <${EdgePrint} left="SPOTTED 400" right="KALYANI" arrow=${false} />
        <${Sprockets} />
        <div class="form">
          ${error ? html`<p class="error-text" role="alert">${error}</p>` : null}
          <button class="btn block google" onClick=${go} disabled=${busy}>
            ${busy ? html`<${Spinner} />` : html`<${GoogleG} />`} Continue with Google
          </button>
          <ul class="safety">
            <li><${Icon} name="ghost" />Your live location is off until you turn it on, and only accepted friends ever see it.</li>
            <li><${Icon} name="pin" />Pin a photo exactly, or just to its area (about 500 m).</li>
            <li><${Icon} name="flag" />Report and block on every profile and photo. For students 18 and over.</li>
          </ul>
        </div>
        <${Sprockets} />
      </div>
    </div>
    <footer><${EdgePrint} left="OPEN SOURCE" right="SOURADIP121/SPOTTED" /></footer>
  </main>`;
}

export function Setup({ existing, onDone }) {
  const session = useStore((s) => s.session);
  const meta = session?.user?.user_metadata || {};
  const [name, setName] = useState(existing?.name || (meta.full_name || meta.name || '').split(' ')[0] || '');
  const [college, setCollege] = useState(existing?.college || '');
  const [adult, setAdult] = useState(Boolean(existing));
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => () => preview && URL.revokeObjectURL(preview), [preview]);

  const submit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return setErr('Add the name your friends know you by.');
    if (!existing && !adult) return setErr('Spotted is for students 18 and over.');
    setErr('');
    setBusy(true);
    try {
      await saveProfile({ name, college, avatarFile: file });
      toast(existing ? 'Profile saved.' : 'Welcome to Spotted.');
      onDone?.();
    } catch (e2) {
      setBusy(false);
      fail(e2, 'Couldn’t save your profile. Try again.');
    }
  };

  const shown = preview ? { name, avatar_path: null } : existing || { name };
  return html`<form class="page stack" style="--gap:22px;padding-top:calc(24px + var(--safe-t))" onSubmit=${submit}>
    <div class="stack" style="--gap:8px">
      <h1 class="h1">${existing ? 'Edit profile' : 'Develop your profile'}</h1>
      <p class="muted" style="margin:0">${existing ? 'Friends see this on the map and your frames.' : 'This is what friends see on the map and next to your frames.'}</p>
    </div>
    <label class="row" style="--gap:16px;cursor:pointer">
      <span style="position:relative">
        ${preview
          ? html`<span class="avatar" style="--s:84px"><img src=${preview} alt="" /></span>`
          : html`<${Avatar} person=${shown} size=${84} />`}
        <span class="icon-btn" style="position:absolute;right:-6px;bottom:-6px;width:34px;height:34px;background:var(--red);color:#fff"><${Icon} name="camera" cls="sm" /></span>
      </span>
      <span class="stack" style="--gap:2px">
        <b class="h3">${existing?.avatar_path || preview ? 'Change photo' : 'Add a photo'}</b>
        <span class="hint">Optional. A face helps friends find you.</span>
      </span>
      <input class="sr-only" type="file" accept="image/*" onChange=${(e) => {
        const f = e.currentTarget.files?.[0];
        if (!f) return;
        setFile(f);
        setPreview(URL.createObjectURL(f));
      }} />
    </label>
    <label class="field"><span>Name</span>
      <input class="input" value=${name} maxlength="40" autocomplete="given-name" required onInput=${(e) => setName(e.currentTarget.value)} placeholder="What friends call you" />
    </label>
    <label class="field"><span>College</span>
      <input class="input" value=${college} maxlength="80" list="colleges" onInput=${(e) => setCollege(e.currentTarget.value)} placeholder="JIS College of Engineering" />
      <datalist id="colleges">${TOWN.colleges.map((c) => html`<option value=${c} />`)}</datalist>
    </label>
    ${existing ? null : html`<div class="stack" style="--gap:14px">
      <${Check} id="adult" checked=${adult} onChange=${setAdult}>I'm 18 or older</${Check}>
      <p class="hint" style="margin:0">Your live location stays off until you switch it on, and only friends you accept can see it. You can block or report anyone from their profile or photo.</p>
    </div>`}
    ${err ? html`<p class="error-text" role="alert" style="margin:0">${err}</p>` : null}
    <div class="stack" style="--gap:10px">
      <button class="btn block" disabled=${busy}>${busy ? html`<${Spinner} />` : existing ? 'Save' : 'Start spotting'}</button>
      ${existing ? html`<a class="btn quiet block" href="#/me">Cancel</a>` : html`<button type="button" class="btn quiet block" onClick=${() => sb.auth.signOut()}>Use a different account</button>`}
    </div>
  </form>`;
}
