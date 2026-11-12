import { SHOT } from '../lib/core.js';

// A darkroom basemap on OpenFreeMap's free vector tiles (OpenMapTiles schema).
// No API key, and never the tile.openstreetmap.org servers.

export const TOWN = {
  name: 'Kalyani',
  center: [88.4462, 22.9746],
  zoom: 13.35,
  // Keep the map on the town (with some room around it).
  bounds: [[88.34, 22.89], [88.58, 23.06]],
  minZoom: 11.6,
  maxZoom: 18,
  places: [
    'JIS College, Phase III', 'University of Kalyani', 'Kalyani Government Engineering College', 'AIIMS Kalyani',
    'Lake Park', 'Central Park', 'Buddha Park', 'Kalyani station', 'Kalyani Ghoshpara station', 'Kalyani Simanta station',
    'Kalyani Stadium', 'Kalyani Mahavidyalaya', 'Hooghly riverside', 'B-Block market',
  ],
  colleges: [
    'JIS College of Engineering', 'University of Kalyani', 'Kalyani Government Engineering College', 'AIIMS Kalyani',
    'Kalyani Mahavidyalaya', 'IISER Kolkata', 'JIS Polytechnic',
  ],
};

const name = ['coalesce', ['get', 'name:en'], ['get', 'name:latin'], ['get', 'name']];

export function darkroomStyle({ labels = true } = {}) {
  const style = {
    version: 8,
    name: 'Spotted darkroom',
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#131716' } },
      {
        id: 'landcover', type: 'fill', source: 'omt', 'source-layer': 'landcover',
        paint: {
          'fill-color': ['match', ['get', 'class'], ['wood', 'forest'], '#16201a', ['grass', 'farmland', 'scrub'], '#18201b', 'wetland', '#121a1b', '#141817'],
          'fill-opacity': 0.95,
        },
      },
      {
        id: 'landuse', type: 'fill', source: 'omt', 'source-layer': 'landuse',
        paint: {
          'fill-color': ['match', ['get', 'class'],
            ['school', 'college', 'university', 'hospital'], '#1a1d1c',
            ['stadium', 'pitch', 'playground'], '#17201a',
            ['residential', 'suburb', 'neighbourhood'], '#151918',
            '#141817'],
        },
      },
      { id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': '#18221b' } },
      { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': '#0a1114' } },
      { id: 'water-edge', type: 'line', source: 'omt', 'source-layer': 'water', paint: { 'line-color': '#26333a', 'line-width': 0.9 } },
      {
        id: 'waterway', type: 'line', source: 'omt', 'source-layer': 'waterway',
        paint: { 'line-color': '#0c1417', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.6, 16, 3] },
      },
      {
        id: 'building', type: 'fill', source: 'omt', 'source-layer': 'building', minzoom: 13.5,
        paint: {
          'fill-color': '#1d2120',
          'fill-outline-color': '#272c2a',
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 13.5, 0, 14.6, 1],
        },
      },
      {
        id: 'road-path', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 14,
        filter: ['in', ['get', 'class'], ['literal', ['path', 'track']]],
        paint: { 'line-color': '#262b29', 'line-width': 0.8, 'line-dasharray': [2, 2] },
      },
      {
        id: 'road-minor', type: 'line', source: 'omt', 'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['minor', 'service']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#2c3230', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 12, 0.5, 15, 2.4, 18, 11] },
      },
      {
        id: 'road-mid', type: 'line', source: 'omt', 'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['tertiary', 'secondary']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#3c4240', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 11, 0.8, 15, 4, 18, 16] },
      },
      {
        id: 'road-major', type: 'line', source: 'omt', 'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['primary', 'trunk', 'motorway']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#545a57', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 10, 1, 15, 5.5, 18, 20] },
      },
      {
        id: 'rail', type: 'line', source: 'omt', 'source-layer': 'transportation',
        filter: ['==', ['get', 'class'], 'rail'],
        paint: { 'line-color': '#4a3431', 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.8, 16, 2], 'line-dasharray': [3, 2] },
      },
      {
        id: 'water-label', type: 'symbol', source: 'omt', 'source-layer': 'water_name', minzoom: 12,
        layout: { 'text-field': name, 'text-font': ['Noto Sans Italic'], 'text-size': 12, 'text-letter-spacing': 0.05 },
        paint: { 'text-color': '#7d8d96', 'text-halo-color': '#0a1114', 'text-halo-width': 1.2 },
      },
      {
        id: 'road-label', type: 'symbol', source: 'omt', 'source-layer': 'transportation_name', minzoom: 14.5,
        layout: { 'symbol-placement': 'line', 'text-field': name, 'text-font': ['Noto Sans Regular'], 'text-size': 11, 'text-letter-spacing': 0.04 },
        paint: { 'text-color': '#7b817e', 'text-halo-color': '#131716', 'text-halo-width': 1.4 },
      },
      {
        id: 'poi-label', type: 'symbol', source: 'omt', 'source-layer': 'poi', minzoom: 14.2,
        filter: ['in', ['get', 'class'], ['literal', ['college', 'school', 'park', 'railway', 'stadium', 'hospital', 'place_of_worship', 'attraction']]],
        layout: { 'text-field': name, 'text-font': ['Noto Sans Regular'], 'text-size': 11, 'text-max-width': 8, 'text-letter-spacing': 0.03 },
        paint: { 'text-color': '#868c89', 'text-halo-color': '#131716', 'text-halo-width': 1.4 },
      },
      {
        id: 'place-local', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 12.8,
        filter: ['in', ['get', 'class'], ['literal', ['suburb', 'neighbourhood', 'quarter', 'village', 'hamlet', 'isolated_dwelling']]],
        layout: { 'text-field': name, 'text-font': ['Noto Sans Regular'], 'text-size': 10.5, 'text-transform': 'uppercase', 'text-letter-spacing': 0.2, 'text-max-width': 9 },
        paint: { 'text-color': '#808683', 'text-halo-color': '#131716', 'text-halo-width': 1.4 },
      },
      {
        id: 'place-town', type: 'symbol', source: 'omt', 'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
        layout: {
          'text-field': name, 'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 10, 13, 13, 22, 15, 28],
          'text-letter-spacing': 0.14,
        },
        paint: {
          'text-color': '#e2dcd2', 'text-halo-color': 'rgba(0,0,0,.9)', 'text-halo-width': 2.2, 'text-halo-blur': 1,
          'text-opacity': ['interpolate', ['linear'], ['zoom'], 12.6, 0.9, 13.3, 0],
        },
      },
    ],
  };
  if (!labels) style.layers = style.layers.filter((l) => l.type !== 'symbol');
  return style;
}

export function createMap(container, opts = {}) {
  const map = new window.maplibregl.Map({
    container,
    style: darkroomStyle({ labels: opts.labels ?? true }),
    center: opts.center || TOWN.center,
    zoom: opts.zoom ?? TOWN.zoom,
    minZoom: TOWN.minZoom,
    maxZoom: TOWN.maxZoom,
    maxBounds: TOWN.bounds,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    attributionControl: false,
    interactive: opts.interactive ?? true,
    fadeDuration: 150,
    pixelRatio: (window.devicePixelRatio || 1) * SHOT,
  });
  map.touchZoomRotate.disableRotation();
  map.keyboard.disableRotation?.();
  // The tile source carries the OpenFreeMap / OpenMapTiles / OpenStreetMap
  // credit. Keep it compact and folded (one tap on the "i" opens it).
  map.addControl(new window.maplibregl.AttributionControl({ compact: true }), opts.attribution || 'bottom-right');
  map.once('idle', () => {
    container.querySelector?.('.maplibregl-ctrl-attrib')?.classList.remove('maplibregl-compact-show');
  });
  return map;
}
