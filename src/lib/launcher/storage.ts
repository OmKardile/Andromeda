// Andromeda launcher — persistence layer.
// SharedPreferences-equivalent: a compact JSON document in localStorage,
// hydrated once on mount and debounced-saved on change.

import type { Layout, Prefs, WidgetInstance } from './types';

const PREFS_KEY = 'andromeda.prefs';
const LAYOUT_KEY = 'andromeda.layout';

export const CITIES = [
  { id: 'new-delhi', name: 'New Delhi', country: 'IN', lat: 28.61, lon: 77.21 },
  { id: 'mumbai', name: 'Mumbai', country: 'IN', lat: 19.08, lon: 72.88 },
  { id: 'bangalore', name: 'Bengaluru', country: 'IN', lat: 12.97, lon: 77.59 },
  { id: 'london', name: 'London', country: 'GB', lat: 51.51, lon: -0.13 },
  { id: 'paris', name: 'Paris', country: 'FR', lat: 48.85, lon: 2.35 },
  { id: 'new-york', name: 'New York', country: 'US', lat: 40.71, lon: -74.01 },
  { id: 'san-francisco', name: 'San Francisco', country: 'US', lat: 37.77, lon: -122.42 },
  { id: 'tokyo', name: 'Tokyo', country: 'JP', lat: 35.68, lon: 139.69 },
  { id: 'singapore', name: 'Singapore', country: 'SG', lat: 1.35, lon: 103.82 },
  { id: 'sydney', name: 'Sydney', country: 'AU', lat: -33.87, lon: 151.21 },
  { id: 'dubai', name: 'Dubai', country: 'AE', lat: 25.2, lon: 55.27 },
  { id: 'berlin', name: 'Berlin', country: 'DE', lat: 52.52, lon: 13.4 },
  { id: 'moscow', name: 'Moscow', country: 'RU', lat: 55.76, lon: 37.62 },
  { id: 'toronto', name: 'Toronto', country: 'CA', lat: 43.65, lon: -79.38 },
  { id: 'sao-paulo', name: 'São Paulo', country: 'BR', lat: -23.55, lon: -46.63 },
  { id: 'cairo', name: 'Cairo', country: 'EG', lat: 30.04, lon: 31.24 },
  { id: 'hong-kong', name: 'Hong Kong', country: 'HK', lat: 22.32, lon: 114.17 },
  { id: 'los-angeles', name: 'Los Angeles', country: 'US', lat: 34.05, lon: -118.24 },
] as const;

/** Bundled photo library (AI-generated, no copied assets). */
export const PHOTOS = [
  '/photos/p-1.jpg',
  '/photos/p-2.jpg',
  '/photos/p-3.jpg',
  '/photos/p-4.jpg',
  '/photos/p-5.jpg',
  '/photos/p-6.jpg',
];

/** Bundled wallpapers (AI-generated). */
export const WALLPAPER_IMAGES = [
  '/wallpapers/w-flow.png',
  '/wallpapers/w-peaks.png',
  '/wallpapers/w-botanical.png',
  '/wallpapers/w-dune.png',
  '/wallpapers/w-geo.png',
];

/** 18 built-in solid colors, starting with #079ecb per the recovered spec. */
export const SOLID_COLORS = [
  '#079ECB', '#0FB5A6', '#34C759', '#5AC83F', '#A2D9A7',
  '#F2F2F7', '#D9C8B4', '#C7A979', '#FFD60A', '#FFB340',
  '#FF9F0A', '#FF6B00', '#FF3B30', '#E85FBD', '#C139C4',
  '#8E8E93', '#48484A', '#1C1C1E',
];

export const GRADIENT_PRESETS: { from: string; to: string }[] = [
  { from: '#079ECB', to: '#0FB5A6' },
  { from: '#FF9F0A', to: '#FF3B30' },
  { from: '#34C759', to: '#0FB5A6' },
  { from: '#C139C4', to: '#FF6482' },
  { from: '#FFB340', to: '#FF6B00' },
  { from: '#1C1C1E', to: '#48484A' },
];

export const EMOJI_CATEGORIES: { name: string; emojis: string[] }[] = [
  { name: 'Smileys', emojis: ['😀', '😁', '😂', '🥹', '😊', '😇', '🥰', '😍', '😜', '🤪', '🤗', '🤔', '😴', '🥳', '😎', '🙃', '😭', '😡'] },
  { name: 'Nature', emojis: ['🌻', '🌷', '🌹', '🌿', '🍀', '🌵', '🌴', '🌲', '🍁', '🍄', '🌊', '🔥', '🌈', '⛰️', '🌙', '⭐', '☀️', '❄️'] },
  { name: 'Animals', emojis: ['🐶', '🐱', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🦄', '🐢', '🦋', '🐝', '🐞', '🐙'] },
  { name: 'Food', emojis: ['🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🥭', '🍍', '🥥', '🥑', '🌮', '🍜'] },
  { name: 'Objects', emojis: ['🎧', '🎸', '🎮', '💡', '📚', '✏️', '💻', '⌚', '👓', '🔑', '💰', '🎁', '⚽', '🏀', '🎯', '🎨', '🚀', '✈️'] },
];

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}

export function newWidget(
  kind: WidgetInstance['kind'],
  over?: Partial<WidgetInstance>,
): WidgetInstance {
  return {
    id: uid(),
    kind,
    span: 2,
    rows: 2,
    ...over,
  };
}

export function defaultPrefs(): Prefs {
  return {
    blurEnabled: true,
    pageTransition: 'default',
    iconScale: 1,
    tempUnit: 'C',
    autoRefreshH: 6,
    city: CITIES[0] as unknown as Prefs['city'],
    badgesEnabled: true,
    wallpaper: { type: 'image', src: WALLPAPER_IMAGES[0] },
    autoArrange: false,
    hideNav: false,
    flexibleText: true,
    hiddenApps: [],
    renames: {},
    usage: {},
    searchHistory: [],
  };
}

/** Default layout: clock widget + 4-app dock (per the recovered default). */
export function defaultLayout(): Layout {
  const page0: Layout['pages'][number] = [
    { key: 'w-clock', item: { type: 'widget', widget: { id: 'w-clock', kind: 'clock-analog', span: 4, rows: 2 } }, col: 0, row: 0, w: 4, h: 2 },
    { key: 'a-music', item: { type: 'app', appId: 'music' }, col: 0, row: 2, w: 1, h: 1 },
    { key: 'a-browser', item: { type: 'app', appId: 'browser' }, col: 1, row: 2, w: 1, h: 1 },
    { key: 'a-maps', item: { type: 'app', appId: 'maps' }, col: 2, row: 2, w: 1, h: 1 },
    { key: 'a-mail', item: { type: 'app', appId: 'mail' }, col: 3, row: 2, w: 1, h: 1 },
    { key: 'a-photos', item: { type: 'app', appId: 'photos' }, col: 0, row: 3, w: 1, h: 1 },
    { key: 'a-clock', item: { type: 'app', appId: 'clock' }, col: 1, row: 3, w: 1, h: 1 },
    { key: 'a-weather', item: { type: 'app', appId: 'weather' }, col: 2, row: 3, w: 1, h: 1 },
    { key: 'a-notes', item: { type: 'app', appId: 'notes' }, col: 3, row: 3, w: 1, h: 1 },
    { key: 'a-calculator', item: { type: 'app', appId: 'calculator' }, col: 0, row: 4, w: 1, h: 1 },
    { key: 'a-calendar', item: { type: 'app', appId: 'calendar' }, col: 1, row: 4, w: 1, h: 1 },
    { key: 'a-contacts', item: { type: 'app', appId: 'contacts' }, col: 2, row: 4, w: 1, h: 1 },
    { key: 'a-files', item: { type: 'app', appId: 'files' }, col: 3, row: 4, w: 1, h: 1 },
    { key: 'a-health', item: { type: 'app', appId: 'health' }, col: 0, row: 5, w: 1, h: 1 },
    { key: 'a-wallet', item: { type: 'app', appId: 'wallet' }, col: 1, row: 5, w: 1, h: 1 },
    { key: 'a-videos', item: { type: 'app', appId: 'videos' }, col: 2, row: 5, w: 1, h: 1 },
    { key: 'a-games', item: { type: 'app', appId: 'games' }, col: 3, row: 5, w: 1, h: 1 },
  ];
  const page1: Layout['pages'][number] = [
    { key: 'w-weather', item: { type: 'widget', widget: { id: 'w-weather', kind: 'weather', span: 4, rows: 2 } }, col: 0, row: 0, w: 4, h: 2 },
    { key: 'w-calendar', item: { type: 'widget', widget: { id: 'w-calendar', kind: 'calendar', span: 4, rows: 2 } }, col: 0, row: 2, w: 4, h: 2 },
    { key: 'a-reminders', item: { type: 'app', appId: 'reminders' }, col: 0, row: 4, w: 1, h: 1 },
    { key: 'a-stocks', item: { type: 'app', appId: 'stocks' }, col: 1, row: 4, w: 1, h: 1 },
    { key: 'a-translate', item: { type: 'app', appId: 'translate' }, col: 2, row: 4, w: 1, h: 1 },
    { key: 'a-books', item: { type: 'app', appId: 'books' }, col: 3, row: 4, w: 1, h: 1 },
    { key: 'a-fitness', item: { type: 'app', appId: 'fitness' }, col: 0, row: 5, w: 1, h: 1 },
    { key: 'a-voice', item: { type: 'app', appId: 'voice' }, col: 1, row: 5, w: 1, h: 1 },
    { key: 'a-podcasts', item: { type: 'app', appId: 'podcasts' }, col: 2, row: 5, w: 1, h: 1 },
    { key: 'a-tv', item: { type: 'app', appId: 'tv' }, col: 3, row: 5, w: 1, h: 1 },
  ];
  const page2: Layout['pages'][number] = [
    { key: 'a-appstore', item: { type: 'app', appId: 'appstore' }, col: 0, row: 0, w: 1, h: 1 },
    { key: 'a-compass', item: { type: 'app', appId: 'compass' }, col: 1, row: 0, w: 1, h: 1 },
    { key: 'a-measure', item: { type: 'app', appId: 'measure' }, col: 2, row: 0, w: 1, h: 1 },
    { key: 'a-phone2', item: { type: 'app', appId: 'phone' }, col: 3, row: 0, w: 1, h: 1 },
  ];
  return {
    pages: [page0, page1, page2, []],
    dock: ['phone', 'messages', 'camera', 'settings'],
    folders: {},
    zeroPage: [
      { id: 'z-sugg', kind: 'suggestions', span: 4, rows: 2 },
      { id: 'z-photo', kind: 'photo', span: 2, rows: 2, data: { photo: PHOTOS[0] } },
      { id: 'z-batt', kind: 'battery', span: 2, rows: 2 },
      { id: 'z-world', kind: 'world-clock', span: 4, rows: 2 },
    ],
  };
}

// ---------------------------------------------------------------------------
// Load / save
// ---------------------------------------------------------------------------

export function loadPrefs(): Prefs | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Prefs>;
    return { ...defaultPrefs(), ...parsed };
  } catch {
    return null;
  }
}

export function loadLayout(): Layout | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(LAYOUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Layout;
    if (!parsed || !Array.isArray(parsed.pages) || !Array.isArray(parsed.dock)) return null;
    return parsed;
  } catch {
    return null;
  }
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export function saveState(prefs: Prefs, layout: Layout): void {
  if (typeof window === 'undefined') return;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      window.localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      window.localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout));
    } catch {
      // storage full / unavailable — non-fatal
    }
  }, 300);
}

export function clearAll(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(PREFS_KEY);
  window.localStorage.removeItem(LAYOUT_KEY);
}
