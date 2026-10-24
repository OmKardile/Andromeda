// Andromeda launcher — core type system
// Mirrors the behavioral spec recovered from the decompiled LauncherOS 18 app.

import type { LucideIcon } from 'lucide-react';

// ---------------------------------------------------------------------------
// Apps
// ---------------------------------------------------------------------------

export type AppScreenId =
  | 'settings'
  | 'clock'
  | 'weather'
  | 'notes'
  | 'calculator'
  | 'photos'
  | 'calendar'
  | 'music'
  | 'reminders'
  | null;

export interface AppDef {
  id: string;
  name: string;
  icon: LucideIcon;
  /** CSS background (gradient) for the icon squircle */
  bg: string;
  /** Icon glyph color */
  fg?: string;
  category: 'system' | 'social' | 'media' | 'productivity' | 'utilities' | 'games';
  /** Opens a functional screen inside the launcher */
  screen?: AppScreenId;
}

// ---------------------------------------------------------------------------
// Widgets
// ---------------------------------------------------------------------------

export type WidgetKind =
  | 'clock-analog'
  | 'clock-digital'
  | 'world-clock'
  | 'calendar'
  | 'weather'
  | 'battery'
  | 'photo'
  | 'suggestions'
  | 'music'
  | 'reminders';

export interface WidgetInstance {
  id: string;
  kind: WidgetKind;
  /** width in grid columns (2 or 4) */
  span: 2 | 4;
  /** height in grid rows (2 or 4) */
  rows: 2 | 4;
  /** widget specific config (photo index, city, ...) */
  data?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export type GridItem =
  | { type: 'app'; appId: string }
  | { type: 'widget'; widget: WidgetInstance }
  | { type: 'folder'; folderId: string };

export interface PlacedItem {
  /** unique key within page */
  key: string;
  item: GridItem;
  col: number;
  row: number;
  w: number;
  h: number;
}

export interface Folder {
  id: string;
  name: string;
  appIds: string[];
}

export interface Layout {
  /** home pages (index 0 = first). Zero page is handled separately. */
  pages: PlacedItem[][];
  dock: (string | null)[];
  folders: Record<string, Folder>;
  zeroPage: WidgetInstance[];
}

// ---------------------------------------------------------------------------
// Wallpaper
// ---------------------------------------------------------------------------

export type EmojiLayout = 'grid-s' | 'grid-m' | 'grid-l' | 'ring' | 'spiral';

export type WallpaperDef =
  | { type: 'image'; src: string }
  | { type: 'solid'; color: string }
  | { type: 'gradient'; from: string; to: string }
  | {
      type: 'emoji';
      emojis: string[];
      layout: EmojiLayout;
      bg: string;
    };

// ---------------------------------------------------------------------------
// Weather
// ---------------------------------------------------------------------------

export interface CityDef {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
}

export interface WeatherNow {
  temperature: number;
  weatherCode: number;
  isDay: boolean;
  windSpeed: number;
  humidity: number;
  apparentTemperature: number;
}

export interface WeatherDay {
  date: string;
  weatherCode: number;
  max: number;
  min: number;
}

export interface WeatherHour {
  time: string;
  temperature: number;
  weatherCode: number;
}

export interface WeatherData {
  city: CityDef;
  now: WeatherNow;
  today: WeatherDay;
  days: WeatherDay[];
  hours: WeatherHour[];
  fetchedAt: number;
  mock?: boolean;
}

// ---------------------------------------------------------------------------
// Preferences (mirrors the recovered SharedPreferences keys)
// ---------------------------------------------------------------------------

export type PageTransition = 'default' | 'rotation' | 'flip' | 'zoom' | 'alpha';

export interface Prefs {
  /** pref_blur_effect_enable — master gate for the whole glass system (default true) */
  blurEnabled: boolean;
  /** appearance — dark app screens & surfaces (default false) */
  darkMode: boolean;
  /** show the iOS-style lock screen on boot (default true) */
  showLockScreen: boolean;
  /** display brightness 0.30..1 (default 1) — dims a global overlay */
  brightness: number;
  /** scroll_type — workspace page transition (default "default") */
  pageTransition: PageTransition;
  /** app_icon_size_change_v2 — 0.80..1.20 (default 1) */
  iconScale: number;
  /** show_c_temp — temperature unit (default 'C') */
  tempUnit: 'C' | 'F';
  /** weather auto refresh hours 1..24 (default 6) */
  autoRefreshH: number;
  city: CityDef;
  badgesEnabled: boolean;
  wallpaper: WallpaperDef;
  /** pref_auto_arrange */
  autoArrange: boolean;
  /** full_screen_option */
  hideNav: boolean;
  /** pref_flexible_icon_text_size_enable */
  flexibleText: boolean;
  hiddenApps: string[];
  renames: Record<string, string>;
  usage: Record<string, { count: number; last: number }>;
  searchHistory: string[];
}

// ---------------------------------------------------------------------------
// Overlays & interaction
// ---------------------------------------------------------------------------

export type Overlay =
  | { kind: 'none' }
  | { kind: 'drawer' }
  | { kind: 'search' }
  | { kind: 'folder'; folderId: string }
  | { kind: 'app'; appId: string }
  | {
      kind: 'edit-menu';
      appId?: string;
      folderId?: string;
      widgetId?: string;
      /** pointer position that opened the menu (used to close-on-drag) */
      origin?: { x: number; y: number };
    };

export interface DragPayload {
  /** what is being dragged */
  from: 'page' | 'dock' | 'drawer-app' | 'folder' | 'zero-page';
  appId?: string;
  widget?: WidgetInstance;
  placedKey?: string;
  folderId?: string;
  originPage?: number;
  originDockIndex?: number;
}

// ---------------------------------------------------------------------------
// Music (now playing)
// ---------------------------------------------------------------------------

export interface TrackDef {
  id: string;
  title: string;
  artist: string;
  /** seconds */
  duration: number;
  /** CSS gradient for the generated cover art */
  art: string;
  /** emoji stamped on the cover */
  glyph: string;
}

// ---------------------------------------------------------------------------
// Reminders
// ---------------------------------------------------------------------------

export interface Reminder {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
  /** optional due bucket for grouping */
  list: 'today' | 'scheduled' | 'all';
}

// ---------------------------------------------------------------------------
// Shade (control / notification centers)
// ---------------------------------------------------------------------------

export type Shade = 'none' | 'control' | 'notifications';

export interface CCToggles {
  wifi: boolean;
  bluetooth: boolean;
  airplane: boolean;
  flashlight: boolean;
}
