// Andromeda launcher — built-in app catalog.
// Icon art is original (Lucide glyphs on iOS-style squircle gradients),
// no binary assets copied from the reference app.

import {
  Activity,
  BookOpen,
  Calculator,
  CalendarDays,
  Camera,
  Clock,
  CloudSun,
  Compass,
  Folder,
  Gamepad2,
  Globe,
  HeartPulse,
  Image,
  ListTodo,
  Mail,
  Map,
  MessageCircle,
  Mic,
  Music,
  Phone,
  Podcast,
  Ruler,
  Settings as SettingsIcon,
  StickyNote,
  TrendingUp,
  Tv,
  Users,
  Video,
  Wallet,
  Zap,
} from 'lucide-react';
import type { AppDef, Prefs } from './types';

export const APPS: AppDef[] = [
  { id: 'phone', name: 'Phone', icon: Phone, bg: 'linear-gradient(180deg,#5CE075,#2FB84A)', category: 'system', screen: null },
  { id: 'messages', name: 'Messages', icon: MessageCircle, bg: 'linear-gradient(180deg,#6BE85F,#2FC41E)', category: 'social', screen: null },
  { id: 'camera', name: 'Camera', icon: Camera, bg: 'linear-gradient(180deg,#8E8E93,#48484A)', category: 'media', screen: null },
  { id: 'photos', name: 'Photos', icon: Image, bg: 'linear-gradient(180deg,#FFFFFF,#F2F2F7)', fg: '#FF9500', category: 'media', screen: 'photos' },
  { id: 'clock', name: 'Clock', icon: Clock, bg: 'linear-gradient(180deg,#1C1C1D,#000000)', category: 'utilities', screen: 'clock' },
  { id: 'weather', name: 'Weather', icon: CloudSun, bg: 'linear-gradient(180deg,#4BCDEF,#1FA3CF)', category: 'utilities', screen: 'weather' },
  { id: 'notes', name: 'Notes', icon: StickyNote, bg: 'linear-gradient(180deg,#FFF6C2,#FFD60A)', fg: '#5A4A00', category: 'productivity', screen: 'notes' },
  { id: 'calculator', name: 'Calculator', icon: Calculator, bg: 'linear-gradient(180deg,#3A3A3C,#1C1C1E)', category: 'utilities', screen: 'calculator' },
  { id: 'settings', name: 'Settings', icon: SettingsIcon, bg: 'linear-gradient(180deg,#D9D9DE,#A7A7AC)', fg: '#3A3A3C', category: 'system', screen: 'settings' },
  { id: 'music', name: 'Music', icon: Music, bg: 'linear-gradient(180deg,#FF6482,#FA2C55)', category: 'media', screen: null },
  { id: 'maps', name: 'Maps', icon: Map, bg: 'linear-gradient(180deg,#8DE96D,#34A853)', category: 'utilities', screen: null },
  { id: 'mail', name: 'Mail', icon: Mail, bg: 'linear-gradient(180deg,#6FE3F5,#2BB8E8)', category: 'productivity', screen: null },
  { id: 'browser', name: 'Browser', icon: Globe, bg: 'linear-gradient(180deg,#48D5C8,#1AA8A0)', category: 'utilities', screen: null },
  { id: 'calendar', name: 'Calendar', icon: CalendarDays, bg: 'linear-gradient(180deg,#FFFFFF,#F2F2F7)', fg: '#FF3B30', category: 'productivity', screen: 'calendar' },
  { id: 'contacts', name: 'Contacts', icon: Users, bg: 'linear-gradient(180deg,#FFFFFF,#F2F2F7)', fg: '#1AA8A0', category: 'productivity', screen: null },
  { id: 'files', name: 'Files', icon: Folder, bg: 'linear-gradient(180deg,#FFD671,#FF9F0A)', category: 'utilities', screen: null },
  { id: 'health', name: 'Health', icon: HeartPulse, bg: 'linear-gradient(180deg,#FFFFFF,#F2F2F7)', fg: '#FF2D55', category: 'utilities', screen: null },
  { id: 'wallet', name: 'Wallet', icon: Wallet, bg: 'linear-gradient(180deg,#3A3A3C,#1C1C1E)', category: 'system', screen: null },
  { id: 'appstore', name: 'App Store', icon: Zap, bg: 'linear-gradient(180deg,#40E0D0,#0FB5A6)', category: 'system', screen: null },
  { id: 'podcasts', name: 'Podcasts', icon: Podcast, bg: 'linear-gradient(180deg,#FF5FBD,#C139C4)', category: 'media', screen: null },
  { id: 'tv', name: 'TV', icon: Tv, bg: 'linear-gradient(180deg,#2C2C2E,#000000)', category: 'media', screen: null },
  { id: 'reminders', name: 'Reminders', icon: ListTodo, bg: 'linear-gradient(180deg,#FFFFFF,#F2F2F7)', fg: '#E8890C', category: 'productivity', screen: null },
  { id: 'stocks', name: 'Stocks', icon: TrendingUp, bg: 'linear-gradient(180deg,#1C1C1E,#000000)', category: 'utilities', screen: null },
  { id: 'translate', name: 'Translate', icon: Globe, bg: 'linear-gradient(180deg,#E8F5E9,#C8E6C9)', fg: '#2E7D32', category: 'utilities', screen: null },
  { id: 'videos', name: 'Videos', icon: Video, bg: 'linear-gradient(180deg,#FF5F5F,#E0301E)', category: 'media', screen: null },
  { id: 'games', name: 'Arcade', icon: Gamepad2, bg: 'linear-gradient(180deg,#FFB340,#FF7A00)', category: 'games', screen: null },
  { id: 'books', name: 'Books', icon: BookOpen, bg: 'linear-gradient(180deg,#FF9F0A,#FF6B00)', category: 'media', screen: null },
  { id: 'fitness', name: 'Fitness', icon: Activity, bg: 'linear-gradient(180deg,#B4FF5C,#39D353)', fg: '#1C3A00', category: 'utilities', screen: null },
  { id: 'voice', name: 'Voice Memos', icon: Mic, bg: 'linear-gradient(180deg,#3A3A3C,#1C1C1E)', category: 'utilities', screen: null },
  { id: 'compass', name: 'Compass', icon: Compass, bg: 'linear-gradient(180deg,#2C2C2E,#000000)', category: 'utilities', screen: null },
  { id: 'measure', name: 'Measure', icon: Ruler, bg: 'linear-gradient(180deg,#3A3A3C,#1C1C1E)', category: 'utilities', screen: null },
];

export const APP_MAP: Record<string, AppDef> = Object.fromEntries(
  APPS.map((a) => [a.id, a]),
);

export function getApp(id: string): AppDef | undefined {
  return APP_MAP[id];
}

/** Display name honoring per-app renames. */
export function displayName(appId: string, prefs: Prefs): string {
  const app = APP_MAP[appId];
  return prefs.renames[appId] ?? app?.name ?? appId;
}

/** Apps currently visible (not hidden). */
export function visibleApps(prefs: Prefs): AppDef[] {
  const hidden = new Set(prefs.hiddenApps);
  return APPS.filter((a) => !hidden.has(a.id));
}

/** Frecency score for the suggestions widget: normalized recency + usage count. */
export function suggestionScore(
  appId: string,
  usage: Prefs['usage'],
  now = Date.now(),
): number {
  const u = usage[appId];
  if (!u) return 0;
  const hoursSince = (now - u.last) / 3_600_000;
  const recency = Math.exp(-hoursSince / 48); // 2-day half-life-ish
  const count = Math.min(u.count, 20) / 20;
  return 0.6 * recency + 0.4 * count;
}

export function suggestedApps(prefs: Prefs, limit = 8): AppDef[] {
  return visibleApps(prefs)
    .map((a) => ({ a, s: suggestionScore(a.id, prefs.usage) }))
    .filter((x) => x.s > 0)
    .sort((x, y) => y.s - x.s)
    .slice(0, limit)
    .map((x) => x.a);
}
