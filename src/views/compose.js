// Post a frame: pick a photo (resized + EXIF stripped here), caption, place,
// and a pin that is exact or "area only" (~500 m, snapped on the phone).
import { html, useEffect, useRef, useState } from 'preact-htm';
import { go, back, toast, fail, snapArea } from '../lib/core.js';
import { processPhoto } from '../lib/media.js';
import { createPost } from '../lib/data.js';
import { locateOnce } from '../lib/live.js';
import { createMap, TOWN } from '../map/style.js';
import { Icon, Sprockets, EdgePrint, Spinner } from '../ui/kit.js';

function circle(lat, lng, meters, n = 48) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2;
    const dLat = (meters / 111320) * Math.sin(a);
    const dLng = (meters / (111320 * Math.cos((lat * Math.PI) / 180))) * Math.cos(a);
    pts.push([lng + dLng, lat + dLat]);
  }
  return { type: 'Feature', geometry: { type: 'Polygon', coordinates: [pts] }, properties: {} };
}

function PinPicker({ pin, setPin, precision }) {
  const el = useRef();
  const map = useRef();
  const marker = useRef();
  useEffect(() => {
    const m = createMap(el.current, { zoom: 13.6 });
    map.current = m;
    m.on('load', () => {
      m.addSource('area', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      m.addLayer({ id: 'area-fill', type: 'fill', source: 'area', paint: { 'fill-color': '#e3262b', 'fill-opacity': 0.14 } });
      m.addLayer({ id: 'area-line', type: 'line', source: 'area', paint: { 'line-color': '#ff4246', 'line-width': 1.5, 'line-dasharray': [2, 2] } });
    });
    m.on('click', (e) => setPin([e.lngLat.lat, e.lngLat.lng]));
    return () => m.remove();
  }, []);
  useEffect(() => {
    const m = map.current;
    if (!m) return;
    const draw = () => {
      if (!pin) { marker.current?.remove(); marker.current = null; m.getSource('area')?.setData({ type: 'FeatureCollection', features: [] }); return; }
      const [lat, lng] = precision === 'area' ? snapArea(pin[0], pin[1]) : pin;
      if (!marker.current) {
        const d = document.createElement('div');
        d.className = 'drop-pin';
        marker.current = new window.maplibregl.Marker({ element: d, anchor: 'bottom', offset: [0, -4] }).setLngLat([lng, lat]).addTo(m);
      } else marker.current.setLngLat([lng, lat]);
      marker.current.getElement().style.opacity = precision === 'area' ? '0' : '1';
      m.getSource('area')?.setData(precision === 'area' ? circle(lat, lng, 280) : { type: 'FeatureCollection', features: [] });
      const b = m.getBounds();
      if (!b.contains([lng, lat])) m.easeTo({ center: [lng, lat] });
    };
    if (m.isStyleLoaded() && m.getSource('area')) draw(); else m.once('load', draw);
  }, [pin, precision]);
  return html`<div class="pinmap">
    <div class="map" ref=${el} role="application" aria-label="Tap the map where the photo was taken"></div>
    ${!pin ? html`<span class="hint-float">Tap where you took it</span>` : null}
  </div>`;
}

export function ComposeScreen() {
  const [shot, setShot] = useState(null);    // { full, thumb, url }
  const [working, setWorking] = useState(false);
  const [caption, setCaption] = useState('');
  const [place, setPlace] = useState('');
  const [pin, setPin] = useState(null);
  const [precision, setPrecision] = useState('exact');
  const [posting, setPosting] = useState(false);
  const [developed, setDeveloped] = useState(false);

  useEffect(() => () => shot?.url && URL.revokeObjectURL(shot.url), [shot]);

  const pick = async (e) => {
    const file = e.currentTarget.files?.[0];
    e.currentTarget.value = '';
    if (!file) return;
    setWorking(true);
    setDeveloped(false);
    try {
      const out = await processPhoto(file);
      setShot({ ...out, url: URL.createObjectURL(out.full.blob) });
    } catch (err) {
      console.error(err);
      toast('That photo couldn’t be opened. Try a JPG or PNG.', 'error');
    }
    setWorking(false);
  };

  const useHere = async () => {
    try {
      const [lat, lng] = await locateOnce();
      const [[w, s], [ea, n]] = TOWN.bounds;
      if (lng < w || lng > ea || lat < s || lat > n) return toast('You’re outside Kalyani. Tap the map to pin the spot instead.', 'error', 4800);
      setPin([lat, lng]);
    } catch (err) {
      toast(err?.code === 1 ? 'Location is blocked for this site. Tap the map instead.' : 'Couldn’t find you. Tap the map instead.', 'error', 4600);
    }
  };

  const submit = async () => {
    if (!shot || !pin || posting) return;
    setPosting(true);
    try {
      // "Area only": the exact spot is snapped on the phone and never sent.
      const [lat, lng] = precision === 'area' ? snapArea(pin[0], pin[1]) : pin;
      const post = await createPost({ full: shot.full, thumb: shot.thumb, caption, placeName: place, lat, lng, precision });
      toast('Frame posted. It’s on the map.');
      go('/p/' + post.id, { replace: true });
    } catch (err) {
      setPosting(false);
      fail(err, 'Upload failed. Your photo is still here, try again.');
    }
  };

  const ready = shot && pin && !posting;
  return html`<section class="screen full">
    <header class="topbar">
      <button class="icon-btn" onClick=${() => back('/')} aria-label="Close"><${Icon} name="x" /></button>
      <h1 class="h2">New frame</h1>
      <span class="spacer"></span>
      <button class="btn sm" disabled=${!ready} onClick=${submit}>${posting ? html`<${Spinner} />` : 'Post'}</button>
    </header>

    <div class="strip">
      <${EdgePrint} left="SPOTTED 400" right=${shot ? 'LOADED' : 'EMPTY'} arrow=${false} />
      <${Sprockets} />
      <div class="frame">
        ${shot ? html`<div style="position:relative">
            <img src=${shot.url} alt="Your photo" class=${`develop ${developed ? 'is-in' : ''}`} onLoad=${() => setDeveloped(true)}
              style=${`width:100%;aspect-ratio:${shot.full.width}/${shot.full.height};max-height:60vh;object-fit:cover;${posting ? 'filter:grayscale(1) sepia(1) saturate(6) hue-rotate(-48deg) brightness(.45);transition:filter .6s' : ''}`} />
            <label class="btn sm quiet" style="position:absolute;right:10px;bottom:10px;background:rgba(0,0,0,.7)">Change<input type="file" accept="image/*" class="sr-only" onChange=${pick} /></label>
          </div>`
          : html`<label class="drop">
            ${working ? html`<span class="developing-note"><span class="live"></span>Developing…</span>` : html`<span>
              <${Icon} name="camera" /><b>Load a frame</b>
              <span class="hint">JPG, PNG or WebP. Resized and stripped of GPS before it leaves your phone.</span>
            </span>`}
            <input type="file" accept="image/*" onChange=${pick} aria-label="Choose a photo" />
          </label>`}
      </div>
      <${Sprockets} />
    </div>

    <div class="page stack" style="--gap:20px;padding-top:18px">
      ${posting ? html`<p class="developing-note" role="status"><span class="live"></span>Developing your frame…</p>` : null}
      <label class="field"><span class="row between">Caption <span class="count">${caption.length}/500</span></span>
        <textarea class="textarea" maxlength="500" placeholder="Golden hour after labs" value=${caption} onInput=${(e) => setCaption(e.currentTarget.value)}></textarea>
      </label>
      <label class="field"><span>Place</span>
        <input class="input" maxlength="80" list="places" placeholder="Lake Park" value=${place} onInput=${(e) => setPlace(e.currentTarget.value)} />
        <datalist id="places">${TOWN.places.map((p) => html`<option value=${p} />`)}</datalist>
      </label>
      <div class="field">
        <span class="row between">Pin it <button type="button" class="link-btn" onClick=${useHere}><span class="row" style="--gap:6px"><${Icon} name="locate" cls="sm" />Use my location</span></button></span>
        <${PinPicker} pin=${pin} setPin=${setPin} precision=${precision} />
        <div class="seg small" role="radiogroup" aria-label="Pin precision">
          <button type="button" role="radio" aria-selected=${precision === 'exact'} aria-checked=${precision === 'exact'} onClick=${() => setPrecision('exact')}>Exact spot</button>
          <button type="button" role="radio" aria-selected=${precision === 'area'} aria-checked=${precision === 'area'} onClick=${() => setPrecision('area')}>Area only · ~500 m</button>
        </div>
        <span class="hint">${precision === 'area' ? 'Only the rough area is saved. The exact spot never leaves your phone.' : 'Pick “area only” for home, hostel or anywhere you’d rather not pin exactly.'}</span>
      </div>
      <button class="btn block" disabled=${!ready} onClick=${submit}>${posting ? html`<${Spinner} />` : !shot ? 'Load a photo first' : !pin ? 'Pin it on the map' : 'Post frame'}</button>
    </div>
    <div style="height:calc(24px + var(--safe-b))"></div>
  </section>`;
}
