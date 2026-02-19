/**
 * CityListing custom Mapbox style.
 * Minimal map: only streets, avenues, rivers, parks and plazas.
 * Colors aligned with the design system (indigo primary, warm background).
 */

// Design system tokens (resolved to hex for Mapbox GL)
const COLORS = {
  // Backgrounds
  land:        '#f7f4f0',   // warm off-white (--background 30 20% 97%)
  water:       '#d4e8f5',   // soft blue
  waterway:    '#c2ddf0',
  park:        '#d8ede0',   // soft green
  plaza:       '#ede9e3',   // warm stone

  // Roads
  motorway:    '#c8d4f0',   // indigo-tinted
  trunk:       '#d0daf2',
  primary:     '#dce4f5',
  secondary:   '#e5ebf7',
  street:      '#ede9e3',   // warm stone
  streetCase:  '#ddd8d0',
  motorwayCase:'#b0bfe8',

  // Labels
  labelPrimary:   '#1a2340',  // dark indigo (--foreground 220 25% 12%)
  labelSecondary: '#6b7a99',  // muted indigo
  labelWater:     '#5a8ab0',

  // Borders
  border:      '#e0dbd4',
}

export const CITYLISTING_MAP_STYLE = {
  version: 8 as const,
  name: 'CityListing',
  glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}',
  sprite: 'mapbox://sprites/mapbox/streets-v12',
  sources: {
    'composite': {
      type: 'vector' as const,
      url: 'mapbox://mapbox.mapbox-streets-v8',
    },
  },
  layers: [
    // ── Background ──────────────────────────────────────────────────────────
    {
      id: 'background',
      type: 'background' as const,
      paint: { 'background-color': COLORS.land },
    },

    // ── Water ───────────────────────────────────────────────────────────────
    {
      id: 'water',
      type: 'fill' as const,
      source: 'composite',
      'source-layer': 'water',
      paint: { 'fill-color': COLORS.water, 'fill-antialias': true },
    },
    {
      id: 'waterway',
      type: 'line' as const,
      source: 'composite',
      'source-layer': 'waterway',
      filter: ['in', 'class', 'river', 'canal', 'stream'],
      paint: {
        'line-color': COLORS.waterway,
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 14, 2.5],
        'line-opacity': 0.9,
      },
    },

    // ── Parks & green areas ─────────────────────────────────────────────────
    {
      id: 'landuse-park',
      type: 'fill' as const,
      source: 'composite',
      'source-layer': 'landuse',
      filter: ['in', 'class', 'park', 'garden', 'grass', 'pitch', 'recreation_ground', 'cemetery'],
      paint: { 'fill-color': COLORS.park, 'fill-opacity': 0.85 },
    },
    {
      id: 'landuse-plaza',
      type: 'fill' as const,
      source: 'composite',
      'source-layer': 'landuse',
      filter: ['in', 'class', 'pedestrian', 'plaza'],
      paint: { 'fill-color': COLORS.plaza, 'fill-opacity': 0.9 },
    },

    // ── Road casings (outlines) ─────────────────────────────────────────────
    {
      id: 'road-motorway-case',
      type: 'line' as const,
      source: 'composite',
      'source-layer': 'road',
      filter: ['in', 'class', 'motorway', 'motorway_link'],
      layout: { 'line-cap': 'round' as const, 'line-join': 'round' as const },
      paint: {
        'line-color': COLORS.motorwayCase,
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 3, 18, 14],
        'line-gap-width': 0,
      },
    },
    {
      id: 'road-street-case',
      type: 'line' as const,
      source: 'composite',
      'source-layer': 'road',
      filter: ['in', 'class', 'street', 'street_limited', 'secondary', 'tertiary', 'primary', 'trunk'],
      layout: { 'line-cap': 'round' as const, 'line-join': 'round' as const },
      paint: {
        'line-color': COLORS.streetCase,
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 18, 8],
        'line-gap-width': 0,
      },
    },

    // ── Roads fill ──────────────────────────────────────────────────────────
    {
      id: 'road-motorway',
      type: 'line' as const,
      source: 'composite',
      'source-layer': 'road',
      filter: ['in', 'class', 'motorway', 'motorway_link'],
      layout: { 'line-cap': 'round' as const, 'line-join': 'round' as const },
      paint: {
        'line-color': COLORS.motorway,
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 2, 18, 12],
      },
    },
    {
      id: 'road-trunk',
      type: 'line' as const,
      source: 'composite',
      'source-layer': 'road',
      filter: ['==', 'class', 'trunk'],
      layout: { 'line-cap': 'round' as const, 'line-join': 'round' as const },
      paint: {
        'line-color': COLORS.trunk,
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1.5, 18, 10],
      },
    },
    {
      id: 'road-primary',
      type: 'line' as const,
      source: 'composite',
      'source-layer': 'road',
      filter: ['==', 'class', 'primary'],
      layout: { 'line-cap': 'round' as const, 'line-join': 'round' as const },
      paint: {
        'line-color': COLORS.primary,
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 1, 18, 8],
      },
    },
    {
      id: 'road-secondary',
      type: 'line' as const,
      source: 'composite',
      'source-layer': 'road',
      filter: ['in', 'class', 'secondary', 'tertiary'],
      layout: { 'line-cap': 'round' as const, 'line-join': 'round' as const },
      paint: {
        'line-color': COLORS.secondary,
        'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.8, 18, 6],
      },
    },
    {
      id: 'road-street',
      type: 'line' as const,
      source: 'composite',
      'source-layer': 'road',
      filter: ['in', 'class', 'street', 'street_limited'],
      layout: { 'line-cap': 'round' as const, 'line-join': 'round' as const },
      paint: {
        'line-color': COLORS.street,
        'line-width': ['interpolate', ['linear'], ['zoom'], 12, 0.5, 18, 4],
      },
    },
    {
      id: 'road-service',
      type: 'line' as const,
      source: 'composite',
      'source-layer': 'road',
      filter: ['in', 'class', 'service', 'path', 'pedestrian', 'track'],
      minzoom: 14,
      layout: { 'line-cap': 'round' as const, 'line-join': 'round' as const },
      paint: {
        'line-color': COLORS.street,
        'line-width': ['interpolate', ['linear'], ['zoom'], 14, 0.3, 18, 2],
        'line-opacity': 0.7,
      },
    },

    // ── Labels ──────────────────────────────────────────────────────────────
    // mapbox-streets-v8: road names are in source-layer 'road' (same as geometry)
    {
      id: 'label-road-major',
      type: 'symbol' as const,
      source: 'composite',
      'source-layer': 'road',
      filter: ['has', 'name'],
      minzoom: 9,
      layout: {
        'text-field': ['coalesce', ['get', 'name'], ['get', 'name_es'], ['get', 'name_en']],
        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 9, 10, 16, 14],
        'symbol-placement': 'line' as const,
        'text-max-angle': 30,
        'text-padding': 4,
      },
      paint: {
        'text-color': COLORS.labelSecondary,
        'text-halo-color': COLORS.land,
        'text-halo-width': 2,
      },
    },
    {
      id: 'label-road-secondary',
      type: 'symbol' as const,
      source: 'composite',
      'source-layer': 'road',
      filter: ['has', 'name'],
      minzoom: 11,
      layout: {
        'text-field': ['coalesce', ['get', 'name'], ['get', 'name_es'], ['get', 'name_en']],
        'text-font': ['DIN Pro Regular', 'Arial Unicode MS Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 11, 10, 18, 13],
        'symbol-placement': 'line' as const,
        'text-max-angle': 30,
        'text-padding': 4,
      },
      paint: {
        'text-color': COLORS.labelSecondary,
        'text-halo-color': COLORS.land,
        'text-halo-width': 2,
      },
    },
    {
      id: 'label-road-street',
      type: 'symbol' as const,
      source: 'composite',
      'source-layer': 'road',
      filter: ['has', 'name'],
      minzoom: 12,
      layout: {
        'text-field': ['coalesce', ['get', 'name'], ['get', 'name_es'], ['get', 'name_en']],
        'text-font': ['DIN Pro Regular', 'Arial Unicode MS Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 12, 9, 18, 12],
        'symbol-placement': 'line' as const,
        'text-max-angle': 30,
        'text-padding': 4,
      },
      paint: {
        'text-color': COLORS.labelSecondary,
        'text-halo-color': COLORS.land,
        'text-halo-width': 2,
      },
    },
    {
      id: 'label-place',
      type: 'symbol' as const,
      source: 'composite',
      'source-layer': 'place_label',
      layout: {
        'text-field': ['coalesce', ['get', 'name'], ['get', 'name_es'], ['get', 'name_en']],
        'text-font': ['DIN Pro Medium', 'Arial Unicode MS Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 8, 11, 14, 16],
        'text-max-width': 8,
      },
      paint: {
        'text-color': COLORS.labelPrimary,
        'text-halo-color': COLORS.land,
        'text-halo-width': 2,
      },
    },
  ],
}
