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

export function darkroomStyle() {
  return {
    version: 8,
    name: 'Spotted darkroom',
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    sources: {
      omt: { type: 'vector', url: 'https://tiles.openfreemap.org/planet' },
    },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': '#0c0c0b' } },
      {
        id: 'landcover', type: 'fill', source: 'omt', 'source-layer': 'landcover',
        paint: {
          'fill-color': ['match', ['get', 'class'], ['wood', 'forest'], '#0f130e', ['grass', 'farmland', 'scrub'], '#0e110d', 'wetland', '#0b0f10', '#0d0d0c'],
          'fill-opacity': 0.95,
        },
      },
      {
        id: 'landuse', type: 'fill', source: 'omt', 'source-layer': 'landuse',
        paint: {
          'fill-color': ['match', ['get', 'class'],
            ['school', 'college', 'university', 'hospital'], '#141210',
            ['stadium', 'pitch', 'playground'], '#11140f',
            ['residential', 'suburb', 'neighbourhood'], '#0f0f0e',
            '#0d0d0c'],
        },
      },
      { id: 'park', type: 'fill', source: 'omt', 'source-layer': 'park', paint: { 'fill-color': '#10150f' } },
      { id: 'water', type: 'fill', source: 'omt', 'source-layer': 'water', paint: { 'fill-color': '#040607' } },
      { id: 'water-edge', type: 'line', source: 'omt', 'source-layer': 'water', paint: { 'line-color': '#1b2126', 'line-width': 0.9 } },
      {
        id: 'waterway', type: 'line', source: 'omt', 'source-layer': 'waterway',
        paint: { 'line-color': '#0a0d10', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.6, 16, 3] },
      },
      {
        id: 'building', type: 'fill', source: 'omt', 'source-layer': 'building', minzoom: 13.5,
        paint: {
          'fill-color': '#1a1917',
          'fill-outline-color': '#23211f',
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 13.5, 0, 14.6, 1],
        },
      },
      {
        id: 'road-path', type: 'line', source: 'omt', 'source-layer': 'transportation', minzoom: 14,
        filter: ['in', ['get', 'class'], ['literal', ['path', 'track']]],
        paint: { 'line-color': '#1f1e1c', 'line-width': 0.8, 'line-dasharray': [2, 2] },
      },
      {
        id: 'road-minor', type: 'line', source: 'omt', 'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['minor', 'service']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#2b2927', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 12, 0.5, 15, 2.4, 18, 11] },
      },
      {
        id: 'road-mid', type: 'line', source: 'omt', 'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['tertiary', 'secondary']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#3b3733', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 11, 0.8, 15, 4, 18, 16] },
      },
      {
        id: 'road-major', type: 'line', source: 'omt', 'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['primary', 'trunk', 'motorway']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: { 'line-color': '#4f453c', 'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 10, 1, 15, 5.5, 18, 20] },
      },
      {
        id: 'rail', type: 'line', source: 'omt', 'source-layer': 'transportation',
        filter: ['==', ['get', 'class'], 'rail'],
        paint: { 'line-color': '#4a302b', 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.8, 16, 2], 'line-dasharray': [3, 2] },
      },
      {
        id: 'water-label', type: 'symbol', source: 'omt', 'source-layer': 'water_name', minzoom: 12,
        layout: { 'text-field': name, 'text-font': ['Noto Sans Italic'], 'text-size': 12, 'text-letter-spacing': 0.05 },
        paint: { 'text-color': '#64727d', 'text-halo-color': '#040607', 'text-halo-width': 1.2 },
      },
      {
        id: 'road-label', type: 'symbol', source: 'omt', 'source-layer': 'transportation_name', minzoom: 14.5,
        layout: { 'symbol-placement': 'line', 'text-field': name, 'text-font': ['Noto Sans Regular'], 'text-size': 11, 'text-letter-spacing': 0.04 },
        paint: { 'text-color': '#77716a', 'text-halo-color': '#0c0c0b', 'text-halo-width': 1.4 },
      },
      {
        id: 'poi-label', type: 'symbol', source: 'omt', 'source-layer': 'poi', minzoom: 14.2,
        filter: ['in', ['get', 'class'], ['literal', ['college', 'school', 'park', 'railway', 'stadium', 'hospital', 'place_of_worship', 'attraction']]],
        layout: { 'text-field': name, 'text-font': ['Noto Sans Regular'], 'text-size': 11, 'text-max-width': 8, 'text-letter-spacing': 0.03 },
        paint: { 'text-color': '#837d75', 'text-halo-color': '#0c0c0b', 'text-halo-width': 1.4 },
      },
      {
        id: 'place-local', type: 'symbol', source: 'omt', 'source-layer': 'place', minzoom: 12.8,
        filter: ['in', ['get', 'class'], ['literal', ['suburb', 'neighbourhood', 'quarter', 'village', 'hamlet', 'isolated_dwelling']]],
        layout: { 'text-field': name, 'text-font': ['Noto Sans Regular'], 'text-size': 10.5, 'text-transform': 'uppercase', 'text-letter-spacing': 0.2, 'text-max-width': 9 },
        paint: { 'text-color': '#7c766e', 'text-halo-color': '#0c0c0b', 'text-halo-width': 1.4 },
      },
      {
        id: 'place-town', type: 'symbol', source: 'omt', 'source-layer': 'place',
        filter: ['in', ['get', 'class'], ['literal', ['city', 'town']]],
        layout: {
          'text-field': name, 'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 10, 13, 13, 22, 15, 28],
          'text-letter-spacing': 0.34,
        },
        paint: {
          'text-color': '#e2dcd2', 'text-halo-color': 'rgba(0,0,0,.9)', 'text-halo-width': 2.2, 'text-halo-blur': 1,
          'text-opacity': ['interpolate', ['linear'], ['zoom'], 14.5, 1, 15.5, 0],
        },
      },
    ],
  };
}

export function createMap(container, opts = {}) {
  const map = new window.maplibregl.Map({
    container,
    style: darkroomStyle(),
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
  map.addControl(new window.maplibregl.AttributionControl({
    compact: true,
    customAttribution: '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
  }), 'bottom-right');
  return map;
}
