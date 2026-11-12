// Shared pieces of the darkroom: icons, film strip, avatars, photos, sheets.
import { html, useEffect, useRef, useState } from 'preact-htm';
import { initials, useToasts } from '../lib/core.js';
import { usePhoto } from '../lib/media.js';

// ---------------------------------------------------------------- icons
// One stroke family, 24 grid, 1.75 stroke.
const P = {
  search: html`<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>`,
  gear: html`<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/>`,
  users: html`<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c2 .7 3.2 2.4 3.5 5.2"/>`,
  image: html`<rect x="3" y="4.5" width="18" height="15" rx="2"/><circle cx="8.5" cy="9.5" r="1.8"/><path d="m21 15.5-5-5-9.5 9"/>`,
  pin: html`<path d="M12 21s-6.5-5.6-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 15.4 12 21 12 21Z"/><circle cx="12" cy="9.8" r="2.4"/>`,
  locate: html`<path d="M20.5 3.5 3.5 11l7.2 2.3 2.3 7.2Z"/>`,
  back: html`<path d="m15 5-7 7 7 7"/>`,
  more: html`<circle cx="12" cy="5" r="1.3" fill="currentColor"/><circle cx="12" cy="12" r="1.3" fill="currentColor"/><circle cx="12" cy="19" r="1.3" fill="currentColor"/>`,
  heart: html`<path d="M12 20.3s-7.8-4.6-8.9-10A4.9 4.9 0 0 1 12 6.6a4.9 4.9 0 0 1 8.9 3.7c-1.1 5.4-8.9 10-8.9 10Z"/>`,
  comment: html`<path d="M4 18.5V7a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6.5a3 3 0 0 1-3 3H8.5L4 20Z" transform="translate(0 -.5)"/>`,
  send: html`<path d="M4 12 20 4l-4.5 16-3.5-6.5Z"/><path d="m12 13.5 3.5-4"/>`,
  map: html`<path d="M9 4 3.5 6v14L9 18l6 2 5.5-2V4L15 6Z"/><path d="M9 4v14M15 6v14"/>`,
  userPlus: html`<circle cx="9.5" cy="8" r="3.5"/><path d="M3 20c.6-3.6 3.2-5.5 6.5-5.5 1.6 0 3 .4 4.1 1.2"/><path d="M18.5 13v7M15 16.5h7"/>`,
  check: html`<path d="m5 12.5 4.5 4.5L19 7.5"/>`,
  x: html`<path d="M6 6l12 12M18 6 6 18"/>`,
  plus: html`<path d="M12 5v14M5 12h14"/>`,
  camera: html`<path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.8l1.4-2h4.6l1.4 2h1.8A2.5 2.5 0 0 1 20 8.5v8a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5Z"/><circle cx="12" cy="12.5" r="3.6"/>`,
  ghost: html`<path d="M5.5 20V10.5a6.5 6.5 0 0 1 13 0V20l-2.2-1.6-2.1 1.6-2.2-1.6-2.2 1.6-2.1-1.6Z"/><circle cx="9.7" cy="10.5" r=".9" fill="currentColor"/><circle cx="14.3" cy="10.5" r=".9" fill="currentColor"/>`,
  flag: html`<path d="M5 21V4.5M5 4.5h11l-2 4 2 4H5"/>`,
  block: html`<circle cx="12" cy="12" r="8.5"/><path d="m6 6 12 12"/>`,
  out: html`<path d="M14 4.5h3.5a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H14"/><path d="M10 16.5 5.5 12 10 7.5M5.5 12H15"/>`,
  trash: html`<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 12.5h9l1-12.5"/>`,
  clock: html`<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>`,
  grid: html`<rect x="4" y="4" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1"/>`,
  shield: html`<path d="M12 3 5 6v5.5c0 4.4 3 8 7 9.5 4-1.5 7-5.1 7-9.5V6Z"/><path d="m9 12 2.2 2.2L15.5 10"/>`,
  edit: html`<path d="M4 20h4L19 9l-4-4L4 16Z"/><path d="m13.5 6.5 4 4"/>`,
  code: html`<path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5"/>`,
  mail: html`<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>`,
  sun: html`<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6 6 6M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4"/>`,
};
export function Icon({ name, cls = '', title }) {
  return html`<svg class=${'icon ' + cls} viewBox="0 0 24 24" aria-hidden=${title ? undefined : 'true'} role=${title ? 'img' : undefined}>${title ? html`<title>${title}</title>` : null}${P[name]}</svg>`;
}
export const EdgeArrow = () => html`<svg class="edge-arrow" viewBox="0 0 10 8" aria-hidden="true"><path d="M0 0 10 4 0 8Z"/></svg>`;

// ---------------------------------------------------------------- film strip
export function EdgePrint({ left = 'SPOTTED 400', mid, right, arrow = true }) {
  return html`<div class="edgeprint" aria-hidden="true">
    <span class="edge">${left}</span>
    ${mid != null ? html`<span class="edge">${mid}</span>` : null}
    <span class="spacer"></span>
    ${right != null ? html`<span class="edge">${right}</span>` : null}
    ${arrow ? html`<${EdgeArrow} />` : null}
  </div>`;
}
export const Sprockets = () => html`<div class="sprockets" aria-hidden="true"></div>`;

// A photo printed on a strip: sprockets, image, sprockets, edge print.
export function FilmFrame({ children, stock = 'SPOTTED 400', frame, top = false, bottom = true }) {
  return html`<div class="strip">
    ${top ? html`<${EdgePrint} left=${stock} right=${frame} arrow=${false} />` : null}
    <${Sprockets} />
    <div class="frame">${children}</div>
    <${Sprockets} />
    ${bottom ? html`<${EdgePrint} left=${stock} mid=${frame} />` : null}
  </div>`;
}
export const stockFor = (post) => (post?.is_demo ? 'DEMO 400' : 'SPOTTED 400');

// ---------------------------------------------------------------- media
// A photo "develops" out of the safelight the first time it's seen in a
// session; after that it appears instantly.
const developed = new Set();
export function Photo({ path, demo, alt = '', cls = '', eager = false, onReady }) {
  const url = usePhoto(path, demo);
  const [loaded, setLoaded] = useState(false);
  const seen = useRef(developed.has(path));
  const img = useRef();
  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth) setLoaded(true);
  }, [url]);
  if (!url) return html`<div class=${'ph ' + cls} aria-label=${alt}></div>`;
  const state = seen.current ? 'is-cached' : loaded ? 'is-in' : '';
  return html`<img ref=${img} class=${`develop ${state} ${cls}`} src=${url} alt=${alt}
    loading=${eager ? 'eager' : 'lazy'} decoding="async"
    onLoad=${() => { setLoaded(true); developed.add(path); onReady?.(); }} />`;
}

export function Avatar({ person, size = 44, cls = '', plain = false }) {
  const url = usePhoto(person?.avatar_path, person?.is_demo);
  const [broken, setBroken] = useState(false);
  return html`<span class=${`avatar ${plain ? 'plain' : ''} ${cls}`} style=${`--s:${size}px`} aria-hidden="true">
    ${url && !broken
      ? html`<img src=${url} alt="" loading="lazy" decoding="async" onError=${() => setBroken(true)} />`
      : html`<span class="mono">${initials(person?.name)}</span>`}
  </span>`;
}

// ---------------------------------------------------------------- controls
export function Switch({ on, cls = '' }) {
  return html`<span class=${`switch ${on ? 'on' : ''} ${cls}`} aria-hidden="true"></span>`;
}
export function Spinner() { return html`<span class="spinner" aria-hidden="true"></span>`; }
export function Loader({ label = 'Loading' }) {
  return html`<div class="loading" role="status"><div class="reel-loader" aria-hidden="true"><i></i><i></i><i></i></div><span class="sr-only">${label}</span></div>`;
}
export function Check({ checked, onChange, children, id }) {
  return html`<label class="check" for=${id}>
    <input id=${id} type="checkbox" checked=${checked} onChange=${(e) => onChange(e.currentTarget.checked)} />
    <span class="box"><svg viewBox="0 0 24 24"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg></span>
    <span>${children}</span>
  </label>`;
}

// ---------------------------------------------------------------- overlays
let sheetSetter = null;
export function openSheet(render) { sheetSetter?.(() => render); }
export function closeSheet() { sheetSetter?.(null); }

export function SheetHost() {
  const [render, setRender] = useState(null);
  sheetSetter = setRender;
  const panel = useRef();
  useEffect(() => {
    if (!render) return;
    const prev = document.activeElement;
    const onKey = (e) => { if (e.key === 'Escape') closeSheet(); };
    addEventListener('keydown', onKey);
    requestAnimationFrame(() => panel.current?.querySelector('button, input, textarea, [tabindex]')?.focus());
    return () => { removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, [render]);
  if (!render) return null;
  return html`<div class="backdrop" onClick=${closeSheet}></div>
    <div class="sheet" role="dialog" aria-modal="true" ref=${panel}>
      <div class="handle" aria-hidden="true"></div>
      ${render()}
    </div>`;
}

export function Toasts() {
  const list = useToasts();
  return html`<div class="toasts" role="status" aria-live="polite">
    ${list.map((t) => html`<div class=${`toast ${t.kind === 'error' ? 'error' : ''}`} key=${t.id}>
      <${Icon} name=${t.kind === 'error' ? 'x' : 'check'} /><span>${t.text}</span>
    </div>`)}
  </div>`;
}

export function Confirm({ title, body, confirm, danger = true, onConfirm }) {
  const [busy, setBusy] = useState(false);
  return html`<div class="stack" style="--gap:14px">
    <h2 class="h2">${title}</h2>
    ${body ? html`<p class="muted" style="margin:0">${body}</p>` : null}
    <div class="row" style="--gap:10px;margin-top:6px">
      <button class="btn quiet grow" onClick=${closeSheet}>Cancel</button>
      <button class=${`btn grow ${danger ? '' : ''}`} disabled=${busy} onClick=${async () => {
        setBusy(true);
        try { await onConfirm(); closeSheet(); } catch { setBusy(false); }
      }}>${busy ? html`<${Spinner} />` : confirm}</button>
    </div>
  </div>`;
}
