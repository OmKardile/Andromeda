'use client';

// GenericAppScreen — polished placeholder for apps without a dedicated
// functional screen: app icon + name, a believable one-liner, fake
// screenshot skeletons, and a "Back to Home" button tinted with the
// app's own accent color.

import { ChevronLeft } from 'lucide-react';
import { getApp } from '@/lib/launcher/apps';
import type { AppDef } from '@/lib/launcher/types';

const PER_APP_LINES: Record<string, string> = {
  phone: 'Your calls, front and center.',
  messages: 'Say it with a bubble.',
  camera: 'Point, shoot, done.',
  music: 'Your soundtrack, everywhere you go.',
  maps: 'Find your way, then some.',
  mail: 'Inbox zero is calling.',
  browser: 'The whole web, one tab at a time.',
  contacts: 'Everyone you know, in one place.',
  files: 'All your stuff, tidy.',
  health: 'Steps, sleep, and everything between.',
  wallet: 'Cards, tickets and passes, tucked away.',
  appstore: 'Discover your next favorite.',
  podcasts: 'Stories for your ears.',
  tv: 'Bigger screen energy.',
  reminders: 'Set it, forget it, get reminded.',
  stocks: 'Watch the numbers move.',
  translate: 'Parlez-vous any language?',
  videos: 'Press play and lean back.',
  games: 'Ready, player one.',
  books: 'Pages at your fingertips.',
  fitness: 'Move more, feel great.',
  voice: 'Tap to talk, tap to stop.',
  compass: 'Always know which way is up.',
  measure: 'How long? Now you know.',
};

const CATEGORY_LINES: Record<AppDef['category'], string> = {
  system: 'System smarts, tuned to you.',
  social: 'Stay close to your people.',
  media: 'Play, watch, repeat.',
  productivity: 'Get it done, beautifully.',
  utilities: 'A handy little tool.',
  games: 'Insert coin, press start.',
};

const CATEGORY_ACCENTS: Record<AppDef['category'], string> = {
  system: '#0A7A6E',
  social: '#1F8F3A',
  media: '#E02E50',
  productivity: '#E08A00',
  utilities: '#B25E00',
  games: '#E0641E',
};

/** Pick an accent from the icon gradient; fall back when it is too light. */
function accentOf(app: AppDef): string {
  const hexes = app.bg.match(/#[0-9A-Fa-f]{6}/g) ?? [];
  const pick = hexes[hexes.length - 1] ?? hexes[0];
  if (!pick) return CATEGORY_ACCENTS[app.category];
  const r = parseInt(pick.slice(1, 3), 16) / 255;
  const g = parseInt(pick.slice(3, 5), 16) / 255;
  const b = parseInt(pick.slice(5, 7), 16) / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.62 ? CATEGORY_ACCENTS[app.category] : pick;
}

function SkeletonCard() {
  return (
    <div className="w-full rounded-2xl bg-black/5 p-4" aria-hidden>
      <div className="flex items-center gap-2.5">
        <div className="gen-shimmer h-9 w-9 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <div className="gen-shimmer h-2.5 w-2/3 rounded-full" />
          <div className="gen-shimmer h-2 w-1/3 rounded-full" />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        <div className="gen-shimmer h-2.5 w-full rounded-full" />
        <div className="gen-shimmer h-2.5 w-11/12 rounded-full" />
        <div className="gen-shimmer h-2.5 w-1/2 rounded-full" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="gen-shimmer h-7 w-20 rounded-full" />
        <div className="gen-shimmer h-7 w-14 rounded-full" />
      </div>
    </div>
  );
}

const SHIMMER_CSS = `
.gen-shimmer {
  background: linear-gradient(90deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.12) 37%, rgba(0,0,0,0.05) 63%);
  background-size: 200% 100%;
  animation: genShimmer 1500ms ease-in-out infinite;
}
@keyframes genShimmer { from { background-position: 200% 0; } to { background-position: -200% 0; } }
`;

export function GenericAppScreen({ appId, onClose }: { appId: string; onClose: () => void }) {
  const app = getApp(appId);
  if (!app) return null;

  const Icon = app.icon;
  const accent = accentOf(app);
  const tagline = PER_APP_LINES[app.id] ?? CATEGORY_LINES[app.category];

  return (
    <div className="launcher-scroll relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#F2F2F7]">
      <style>{SHIMMER_CSS}</style>

      {/* top bar */}
      <div className="flex items-center justify-between px-5 pb-2 pt-[58px]">
        <span
          className="text-[15px] font-semibold"
          style={{ textTransform: 'capitalize', color: accent }}
        >
          {app.category}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex h-11 items-center gap-0.5 rounded-full bg-black/[0.06] pl-2 pr-4 text-[15px] font-medium text-black active:bg-black/10"
          aria-label="Back to home screen"
        >
          <ChevronLeft size={18} strokeWidth={2.5} /> Home
        </button>
      </div>

      {/* hero */}
      <div className="flex flex-col items-center px-8 pt-6 text-center">
        <div
          className="flex h-[96px] w-[96px] items-center justify-center rounded-[24px] shadow-[0_12px_28px_rgba(0,0,0,0.22)]"
          style={{ background: app.bg }}
        >
          <Icon size={48} color={app.fg ?? '#fff'} strokeWidth={1.4} />
        </div>
        <h1 className="mt-4 text-[28px] font-bold text-black">{app.name}</h1>
        <p className="mt-1 text-[15px] text-black/55">{tagline}</p>
      </div>

      {/* fake screenshots */}
      <div className="mt-8 space-y-3 px-5">
        <div className="grid grid-cols-2 gap-3">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>

      <p className="mt-5 text-center text-[13px] text-black/40">Demo experience</p>

      {/* back button */}
      <div className="px-5 pb-10 pt-5">
        <button
          type="button"
          onClick={onClose}
          className="h-[50px] w-full rounded-full bg-[#10B981] text-[16px] font-semibold text-white shadow-lg transition-transform duration-100 active:scale-[0.97]"
          style={{ boxShadow: '0 10px 24px rgba(16,185,129,0.35)' }}
          aria-label={`Close ${app.name} and return to the home screen`}
        >
          Back to Home
        </button>
      </div>
    </div>
  );
}
