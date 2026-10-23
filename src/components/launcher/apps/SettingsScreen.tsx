'use client';

// Settings — full launcher settings screen mirroring the recovered
// iOS-style settings design (SettingIOSActivity / GeneralActivity):
// #F2F2F7 background, white 10px cards, 44px rows, 29px rounded-6 icon
// squares, 51×31 switches (#4CD964 / #E9E9EB), hairline separators
// inset past the icon, and a local push/pop stack of sub-pages with a
// 320ms slide — no router involvement.

import { useState, type ReactNode } from 'react';
import {
  ArrowLeftRight,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  EyeOff,
  Image as ImageIcon,
  Info,
  LayoutGrid,
  MapPin,
  RectangleHorizontal,
  RefreshCw,
  Sparkles,
  SquarePen,
  Thermometer,
  Trash2,
  Type,
  X,
  ZoomIn,
} from 'lucide-react';
import { useLauncher } from '@/lib/launcher/store';
import { APPS, displayName } from '@/lib/launcher/apps';
import type { AppDef, PageTransition, Prefs, WallpaperDef } from '@/lib/launcher/types';
import {
  CITIES,
  GRADIENT_PRESETS,
  PHOTOS,
  SOLID_COLORS,
  WALLPAPER_IMAGES,
} from '@/lib/launcher/storage';

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function IOSSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="relative h-[31px] w-[51px] shrink-0 rounded-full transition-colors duration-200"
      style={{ background: checked ? '#4CD964' : '#E9E9EB' }}
    >
      <span
        className="absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.2)] transition-[left] duration-200"
        style={{ left: checked ? '22px' : '2px' }}
      />
    </button>
  );
}

function ChevronTrail() {
  return <ChevronRight size={16} color="#C7C7CC" aria-hidden />;
}

function ValueTrail({ children }: { children: ReactNode }) {
  return (
    <>
      <span className="mr-1 text-[15px] text-[#3C3C43]/60">{children}</span>
      <ChevronTrail />
    </>
  );
}

interface RowProps {
  icon: ReactNode;
  iconBg: string;
  iconFg?: string;
  label: string;
  caption?: string;
  onClick?: () => void;
  trailing?: ReactNode;
  danger?: boolean;
  first?: boolean;
}

function Row({ icon, iconBg, iconFg = '#fff', label, caption, onClick, trailing, danger, first }: RowProps) {
  const inner = (
    <>
      {!first && <span className="absolute bottom-auto left-[57px] right-0 top-0 h-px bg-[#3C3C43]/10" aria-hidden />}
      <span
        className="flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-[6px]"
        style={{ background: iconBg }}
      >
        {icon}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={`truncate text-[15px] ${danger ? 'text-[#FF3B30]' : 'text-black'}`}>{label}</span>
        {caption && <span className="text-[12px] leading-snug text-[#3C3C43]/60">{caption}</span>}
      </span>
      {trailing}
    </>
  );
  const cls = `relative flex w-full items-center gap-3 px-4 ${caption ? 'min-h-[56px] py-2' : 'min-h-[44px]'}`;
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cls} text-left active:bg-black/[0.04]`}>
        {inner}
      </button>
    );
  }
  return <div className={cls}>{inner}</div>;
}

function Section({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section className="mb-6">
      {title && (
        <h2 className="mb-1.5 pl-[26px] pr-4 text-[13px] font-normal uppercase tracking-[0.06em] text-[#3C3C43]/60">
          {title}
        </h2>
      )}
      <div className="mx-[10px] overflow-hidden rounded-[10px] bg-white">{children}</div>
    </section>
  );
}

function MiniAppIcon({ app, size = 29 }: { app: AppDef; size?: number }) {
  const Icon = app.icon;
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-[6px]"
      style={{ width: size, height: size, background: app.bg }}
    >
      <Icon size={size * 0.62} color={app.fg ?? '#fff'} strokeWidth={1.8} />
    </span>
  );
}

function SubHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="z-10 shrink-0 bg-[#F2F2F7] px-3 pb-2 pt-[58px]">
      <div className="relative flex h-11 items-center justify-center">
        <button
          type="button"
          onClick={onBack}
          className="absolute left-1 flex h-11 items-center gap-0.5 pr-2 text-[15px] font-medium text-black active:opacity-60"
          aria-label={`Back, close ${title}`}
        >
          <ChevronLeft size={20} strokeWidth={2.5} /> Settings
        </button>
        <h1 className="max-w-[60%] truncate text-[17px] font-semibold text-black">{title}</h1>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page-transition live previews (150×90, 2000ms loop, per recovered spec)
// ---------------------------------------------------------------------------

const TRANSITIONS: { id: PageTransition; label: string }[] = [
  { id: 'default', label: 'Default' },
  { id: 'rotation', label: 'Rotation' },
  { id: 'flip', label: 'Flip' },
  { id: 'zoom', label: 'Zoom In' },
  { id: 'alpha', label: 'Alpha' },
];

function MiniPage() {
  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center gap-[7px] rounded-[9px] bg-white"
      style={{ backfaceVisibility: 'hidden' }}
    >
      <div className="flex gap-[5px]">
        {['#0FB5A6', '#FF9F0A', '#E85FBD'].map((c) => (
          <span key={c} className="h-[13px] w-[13px] rounded-[4px]" style={{ background: c }} />
        ))}
      </div>
      <div className="flex gap-[5px]">
        {['#FF6B00', '#34C759', '#8E8E93'].map((c) => (
          <span key={c} className="h-[13px] w-[13px] rounded-[4px]" style={{ background: c }} />
        ))}
      </div>
    </div>
  );
}

function TransitionPreview({ kind }: { kind: PageTransition }) {
  const anims: Record<PageTransition, [string, string]> = {
    default: ['tpSlideA', 'tpSlideB'],
    rotation: ['tpRotA', 'tpRotB'],
    flip: ['tpFlipA', 'tpFlipB'],
    zoom: ['tpZoomA', 'tpZoomB'],
    alpha: ['tpAlphaA', 'tpAlphaB'],
  };
  const [a, b] = anims[kind];
  const perspective = kind === 'rotation' || kind === 'flip' ? 420 : undefined;
  return (
    <div
      className="relative h-[90px] w-[150px] shrink-0 overflow-hidden rounded-[14px] bg-[#D1D1D6]"
      style={{ perspective }}
      aria-hidden
    >
      <div className="absolute inset-[5px]" style={{ transformStyle: 'preserve-3d' }}>
        <div className="absolute inset-0" style={{ animation: `${a} 2000ms ease-in-out infinite` }}>
          <MiniPage />
        </div>
        <div className="absolute inset-0" style={{ animation: `${b} 2000ms ease-in-out infinite` }}>
          <MiniPage />
        </div>
      </div>
    </div>
  );
}

const TRANSITION_KEYFRAMES = `
@keyframes tpSlideA { 0% { transform: translateX(0);} 45%,100% { transform: translateX(-104%);} }
@keyframes tpSlideB { 0% { transform: translateX(104%);} 45%,100% { transform: translateX(0);} }
@keyframes tpRotA { 0% { transform: translateX(0) rotateY(0deg);} 45%,100% { transform: translateX(-72%) rotateY(28deg);} }
@keyframes tpRotB { 0% { transform: translateX(72%) rotateY(-28deg);} 45%,100% { transform: translateX(0) rotateY(0deg);} }
@keyframes tpFlipA { 0% { transform: rotateY(0deg) translateX(0); opacity: 1;} 40%,100% { transform: rotateY(78deg) translateX(-14%); opacity: 0;} }
@keyframes tpFlipB { 0%,35% { transform: rotateY(-78deg) translateX(14%); opacity: 0;} 75%,100% { transform: rotateY(0deg) translateX(0); opacity: 1;} }
@keyframes tpZoomA { 0% { transform: scale(1); opacity: 1;} 40%,100% { transform: scale(1.16); opacity: 0;} }
@keyframes tpZoomB { 0%,35% { transform: scale(0.8); opacity: 0;} 75%,100% { transform: scale(1); opacity: 1;} }
@keyframes tpAlphaA { 0% { opacity: 1;} 40%,100% { opacity: 0;} }
@keyframes tpAlphaB { 0%,35% { opacity: 0;} 75%,100% { opacity: 1;} }
@keyframes setPushIn { from { transform: translateX(100%);} to { transform: translateX(0);} }
@keyframes setPopOut { from { transform: translateX(0);} to { transform: translateX(100%);} }
@keyframes setAlert { from { transform: scale(1.14); opacity: 0;} to { transform: scale(1); opacity: 1;} }
`;

// ---------------------------------------------------------------------------
// Sub-pages
// ---------------------------------------------------------------------------

function TransitionPage({ onBack }: { onBack: () => void }) {
  const prefs = useLauncher((s) => s.prefs);
  const setPrefs = useLauncher((s) => s.setPrefs);
  return (
    <>
      <SubHeader title="Page Transition" onBack={onBack} />
      <style>{TRANSITION_KEYFRAMES}</style>
      <div className="launcher-scroll min-h-0 flex-1 overflow-y-auto pb-12">
        <p className="mb-3 px-[26px] text-[13px] leading-snug text-[#3C3C43]/60">
          Choose the animation used when swiping between home-screen pages.
        </p>
        <div className="mx-[10px] overflow-hidden rounded-[10px] bg-white">
          {TRANSITIONS.map((t, i) => {
            const selected = prefs.pageTransition === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setPrefs({ pageTransition: t.id })}
                className="relative flex w-full items-center gap-3 px-4 py-3 text-left active:bg-black/[0.04]"
                aria-pressed={selected}
              >
                {i > 0 && <span className="absolute left-[16px] right-0 top-0 h-px bg-[#3C3C43]/10" aria-hidden />}
                <TransitionPreview kind={t.id} />
                <span className="flex-1 text-[15px] text-black">{t.label}</span>
                {selected && <Check size={18} strokeWidth={3} color="#FF3B30" aria-label="Selected" />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function IconSizePage({ onBack }: { onBack: () => void }) {
  const prefs = useLauncher((s) => s.prefs);
  const setPrefs = useLauncher((s) => s.setPrefs);
  const scale = prefs.iconScale;
  const pct = ((scale - 0.8) / 0.4) * 100;
  const previewApps = APPS.filter((a) => ['music', 'browser', 'maps'].includes(a.id));
  return (
    <>
      <SubHeader title="Icon Size" onBack={onBack} />
      <div className="launcher-scroll min-h-0 flex-1 overflow-y-auto pb-12">
        {/* live preview */}
        <div className="mx-[10px] mb-6 flex h-[190px] items-center justify-center gap-7 rounded-[10px] bg-white">
          {previewApps.map((app) => {
            const Icon = app.icon;
            const size = 64 * scale;
            return (
              <div key={app.id} className="flex flex-col items-center gap-2">
                <span
                  className="flex items-center justify-center rounded-[15px] shadow-md"
                  style={{ width: size, height: size, background: app.bg }}
                >
                  <Icon size={size * 0.55} color={app.fg ?? '#fff'} strokeWidth={1.4} />
                </span>
                <span className="text-[11px] text-black/60">{app.name}</span>
              </div>
            );
          })}
        </div>

        {/* slider */}
        <div className="mx-[10px] rounded-[10px] bg-white px-4 py-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[15px] text-black">Icon Size</span>
            <span className="text-[15px] font-medium text-[#3C3C43]/60 tabular-nums">
              {Math.round(scale * 100)}%
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[#3C3C43]/50">80%</span>
            <input
              type="range"
              min={0.8}
              max={1.2}
              step={0.05}
              value={scale}
              onChange={(e) => setPrefs({ iconScale: Number(e.target.value) })}
              className="ios-range h-[6px] flex-1 cursor-pointer"
              style={{ background: `linear-gradient(90deg, #FF3B30 ${pct}%, #E9E9EB ${pct}%)` }}
              aria-label="Icon size slider, 80 to 120 percent"
            />
            <span className="text-[12px] text-[#3C3C43]/50">120%</span>
          </div>
          <style>{`
.ios-range { -webkit-appearance: none; appearance: none; border-radius: 3px; outline: none; }
.ios-range::-webkit-slider-thumb { -webkit-appearance: none; width: 27px; height: 27px; border-radius: 50%; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.28), 0 0 0 0.5px rgba(0,0,0,0.06); cursor: pointer; }
.ios-range::-moz-range-thumb { width: 27px; height: 27px; border: none; border-radius: 50%; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.28); cursor: pointer; }
`}</style>
        </div>
      </div>
    </>
  );
}

function CityPage({ onBack }: { onBack: () => void }) {
  const prefs = useLauncher((s) => s.prefs);
  const setPrefs = useLauncher((s) => s.setPrefs);
  return (
    <>
      <SubHeader title="City" onBack={onBack} />
      <div className="launcher-scroll min-h-0 flex-1 overflow-y-auto pb-12">
        <p className="mb-3 px-[26px] text-[13px] leading-snug text-[#3C3C43]/60">
          Used by the Weather app and weather widgets.
        </p>
        <div className="mx-[10px] overflow-hidden rounded-[10px] bg-white">
          {CITIES.map((c, i) => {
            const selected = prefs.city?.id === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setPrefs({ city: c as unknown as Prefs['city'] })}
                className="relative flex w-full items-center justify-between px-4 text-left active:bg-black/[0.04]"
                style={{ minHeight: 44 }}
                aria-pressed={selected}
              >
                {i > 0 && <span className="absolute left-[16px] right-0 top-0 h-px bg-[#3C3C43]/10" aria-hidden />}
                <span className="flex items-baseline gap-2">
                  <span className="text-[15px] text-black">{c.name}</span>
                  <span className="text-[12px] text-[#3C3C43]/50">{c.country}</span>
                </span>
                {selected && <Check size={18} strokeWidth={3} color="#FF3B30" aria-label="Selected" />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function RefreshPage({ onBack }: { onBack: () => void }) {
  const prefs = useLauncher((s) => s.prefs);
  const setPrefs = useLauncher((s) => s.setPrefs);
  const options = [1, 2, 3, 6, 12, 24];
  return (
    <>
      <SubHeader title="Auto Refresh" onBack={onBack} />
      <div className="launcher-scroll min-h-0 flex-1 overflow-y-auto pb-12">
        <p className="mb-3 px-[26px] text-[13px] leading-snug text-[#3C3C43]/60">
          How often weather data is refreshed in the background.
        </p>
        <div className="mx-[10px] overflow-hidden rounded-[10px] bg-white">
          {options.map((h, i) => {
            const selected = prefs.autoRefreshH === h;
            return (
              <button
                key={h}
                type="button"
                onClick={() => setPrefs({ autoRefreshH: h })}
                className="relative flex w-full items-center justify-between px-4 text-left active:bg-black/[0.04]"
                style={{ minHeight: 44 }}
                aria-pressed={selected}
              >
                {i > 0 && <span className="absolute left-[16px] right-0 top-0 h-px bg-[#3C3C43]/10" aria-hidden />}
                <span className="text-[15px] text-black">Every {h} h</span>
                {selected && <Check size={18} strokeWidth={3} color="#FF3B30" aria-label="Selected" />}
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function WallpaperTile({
  children,
  selected,
  onClick,
  aria,
}: {
  children: ReactNode;
  selected: boolean;
  onClick: () => void;
  aria: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={aria}
      aria-pressed={selected}
      className="relative overflow-hidden rounded-[10px] active:opacity-80"
    >
      {children}
      {selected && (
        <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/45 backdrop-blur-sm">
          <Check size={12} strokeWidth={3.5} color="#fff" />
        </span>
      )}
    </button>
  );
}

function WallpaperPage({ onBack }: { onBack: () => void }) {
  const prefs = useLauncher((s) => s.prefs);
  const setPrefs = useLauncher((s) => s.setPrefs);

  const isCurrent = (w: WallpaperDef) => {
    const cur = prefs.wallpaper;
    if (w.type === 'image' && cur.type === 'image') return w.src === cur.src;
    if (w.type === 'solid' && cur.type === 'solid') return w.color === cur.color;
    if (w.type === 'gradient' && cur.type === 'gradient') return w.from === cur.from && w.to === cur.to;
    return false;
  };

  return (
    <>
      <SubHeader title="Change Wallpaper" onBack={onBack} />
      <div className="launcher-scroll min-h-0 flex-1 overflow-y-auto pb-12">
        <h3 className="mb-2 mt-2 pl-[26px] text-[13px] font-normal uppercase tracking-[0.06em] text-[#3C3C43]/60">
          Wallpapers
        </h3>
        <div className="mx-[10px] grid grid-cols-3 gap-2">
          {WALLPAPER_IMAGES.map((src) => {
            const w: WallpaperDef = { type: 'image', src };
            return (
              <WallpaperTile
                key={src}
                selected={isCurrent(w)}
                onClick={() => setPrefs({ wallpaper: w })}
                aria={`Apply wallpaper ${src.split('/').pop()}`}
              >
                <img src={src} alt="" className="aspect-[9/16] w-full object-cover" draggable={false} />
              </WallpaperTile>
            );
          })}
        </div>

        <h3 className="mb-2 mt-6 pl-[26px] text-[13px] font-normal uppercase tracking-[0.06em] text-[#3C3C43]/60">
          Photos
        </h3>
        <div className="mx-[10px] grid grid-cols-3 gap-2">
          {PHOTOS.map((src) => {
            const w: WallpaperDef = { type: 'image', src };
            return (
              <WallpaperTile
                key={src}
                selected={isCurrent(w)}
                onClick={() => setPrefs({ wallpaper: w })}
                aria={`Apply photo ${src.split('/').pop()}`}
              >
                <img src={src} alt="" className="aspect-[9/16] w-full object-cover" draggable={false} />
              </WallpaperTile>
            );
          })}
        </div>

        <h3 className="mb-2 mt-6 pl-[26px] text-[13px] font-normal uppercase tracking-[0.06em] text-[#3C3C43]/60">
          Gradients
        </h3>
        <div className="mx-[10px] grid grid-cols-3 gap-2">
          {GRADIENT_PRESETS.map((g) => {
            const w: WallpaperDef = { type: 'gradient', from: g.from, to: g.to };
            return (
              <WallpaperTile
                key={g.from + g.to}
                selected={isCurrent(w)}
                onClick={() => setPrefs({ wallpaper: w })}
                aria="Apply gradient wallpaper"
              >
                <div
                  className="aspect-[9/16] w-full"
                  style={{ background: `linear-gradient(180deg, ${g.from}, ${g.to})` }}
                />
              </WallpaperTile>
            );
          })}
        </div>

        <h3 className="mb-2 mt-6 pl-[26px] text-[13px] font-normal uppercase tracking-[0.06em] text-[#3C3C43]/60">
          Solid Colors
        </h3>
        <div className="mx-[10px] grid grid-cols-6 gap-2">
          {SOLID_COLORS.map((c) => {
            const w: WallpaperDef = { type: 'solid', color: c };
            return (
              <WallpaperTile
                key={c}
                selected={isCurrent(w)}
                onClick={() => setPrefs({ wallpaper: w })}
                aria={`Apply solid color ${c}`}
              >
                <div className="aspect-square w-full rounded-full" style={{ background: c }} />
              </WallpaperTile>
            );
          })}
        </div>
      </div>
    </>
  );
}

function RenamesPage({ onBack }: { onBack: () => void }) {
  const prefs = useLauncher((s) => s.prefs);
  const renameApp = useLauncher((s) => s.renameApp);
  const [editing, setEditing] = useState<{ appId: string; draft: string } | null>(null);

  const commit = () => {
    if (editing) renameApp(editing.appId, editing.draft.trim());
    setEditing(null);
  };

  return (
    <>
      <SubHeader title="Change App Names" onBack={onBack} />
      <div className="launcher-scroll min-h-0 flex-1 overflow-y-auto pb-12">
        <p className="mb-3 px-[26px] text-[13px] leading-snug text-[#3C3C43]/60">
          Tap an app to rename it on the home screen. Leave the field empty to reset.
        </p>
        <div className="mx-[10px] overflow-hidden rounded-[10px] bg-white">
          {APPS.map((app, i) => {
            const isEditing = editing?.appId === app.id;
            const renamed = Boolean(prefs.renames[app.id]);
            if (isEditing && editing) {
              return (
                <div key={app.id} className="relative flex items-center gap-3 px-4 py-2">
                  {i > 0 && (
                    <span className="absolute left-[57px] right-0 top-0 h-px bg-[#3C3C43]/10" aria-hidden />
                  )}
                  <MiniAppIcon app={app} />
                  <input
                    className="h-11 min-w-0 flex-1 rounded-[8px] bg-black/[0.05] px-3 text-[15px] text-black outline-none focus:bg-black/[0.08]"
                    value={editing.draft}
                    placeholder={app.name}
                    autoFocus
                    aria-label={`New name for ${app.name}`}
                    onChange={(e) => setEditing({ appId: app.id, draft: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commit();
                      if (e.key === 'Escape') setEditing(null);
                    }}
                  />
                  <button
                    type="button"
                    onClick={commit}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[#34C759] active:bg-black/5"
                    aria-label="Save name"
                  >
                    <Check size={20} strokeWidth={2.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-black/40 active:bg-black/5"
                    aria-label="Cancel rename"
                  >
                    <X size={20} />
                  </button>
                </div>
              );
            }
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => setEditing({ appId: app.id, draft: displayName(app.id, prefs) })}
                className="relative flex w-full items-center gap-3 px-4 text-left active:bg-black/[0.04]"
                style={{ minHeight: 44 }}
                aria-label={`Rename ${displayName(app.id, prefs)}`}
              >
                {i > 0 && (
                  <span className="absolute left-[57px] right-0 top-0 h-px bg-[#3C3C43]/10" aria-hidden />
                )}
                <MiniAppIcon app={app} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[15px] text-black">{displayName(app.id, prefs)}</span>
                  {renamed && (
                    <span className="text-[11px] text-[#3C3C43]/50">originally “{app.name}”</span>
                  )}
                </span>
                <ChevronTrail />
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

function HiddenAppsPage({ onBack }: { onBack: () => void }) {
  const prefs = useLauncher((s) => s.prefs);
  const toggleHidden = useLauncher((s) => s.toggleHidden);
  return (
    <>
      <SubHeader title="Hidden Apps" onBack={onBack} />
      <div className="launcher-scroll min-h-0 flex-1 overflow-y-auto pb-12">
        <p className="mb-3 px-[26px] text-[13px] leading-snug text-[#3C3C43]/60">
          Hidden apps disappear from the home screen and the app drawer.
        </p>
        <div className="mx-[10px] overflow-hidden rounded-[10px] bg-white">
          {APPS.map((app, i) => {
            const hidden = prefs.hiddenApps.includes(app.id);
            return (
              <div key={app.id} className="relative flex items-center gap-3 px-4" style={{ minHeight: 44 }}>
                {i > 0 && (
                  <span className="absolute left-[57px] right-0 top-0 h-px bg-[#3C3C43]/10" aria-hidden />
                )}
                <MiniAppIcon app={app} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className={`truncate text-[15px] ${hidden ? 'text-[#3C3C43]/50' : 'text-black'}`}>
                    {displayName(app.id, prefs)}
                  </span>
                </span>
                <IOSSwitch
                  checked={hidden}
                  onChange={() => toggleHidden(app.id)}
                  label={`Hide ${displayName(app.id, prefs)}`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Reset confirmation (iOS-style alert)
// ---------------------------------------------------------------------------

function ResetDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 px-10">
      <div
        className="w-full overflow-hidden rounded-[14px] bg-[#F2F2F7]/95 text-center shadow-2xl backdrop-blur-xl"
        role="alertdialog"
        aria-modal="true"
        aria-label="Reset layout"
        style={{ animation: 'setAlert 220ms cubic-bezier(0.2,0,0,1)' }}
      >
        <div className="px-4 pb-4 pt-5">
          <h2 className="text-[17px] font-semibold text-black">Reset Layout?</h2>
          <p className="mt-1 text-[13px] leading-snug text-black/55">
            Your home screen, dock, widgets and preferences return to their defaults.
          </p>
        </div>
        <div className="h-px bg-black/10" />
        <div className="flex h-[44px]">
          <button type="button" className="flex-1 text-[16px] text-black/60 active:bg-black/5" onClick={onCancel}>
            Cancel
          </button>
          <div className="w-px bg-black/10" />
          <button
            type="button"
            className="flex-1 text-[16px] font-semibold text-[#FF3B30] active:bg-black/5"
            onClick={onConfirm}
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

function renderSubPage(id: string, onBack: () => void) {
  switch (id) {
    case 'transition':
      return <TransitionPage onBack={onBack} />;
    case 'icon-size':
      return <IconSizePage onBack={onBack} />;
    case 'city':
      return <CityPage onBack={onBack} />;
    case 'refresh':
      return <RefreshPage onBack={onBack} />;
    case 'wallpaper':
      return <WallpaperPage onBack={onBack} />;
    case 'renames':
      return <RenamesPage onBack={onBack} />;
    case 'hidden':
      return <HiddenAppsPage onBack={onBack} />;
    default:
      return null;
  }
}

export function SettingsScreen() {
  const prefs = useLauncher((s) => s.prefs);
  const setPrefs = useLauncher((s) => s.setPrefs);
  const resetAll = useLauncher((s) => s.resetAll);
  const closeOverlay = useLauncher((s) => s.closeOverlay);

  // local navigation stack (push/pop with 320ms slide) — no router needed.
  // The stack is depth-1 in practice (sub-pages only push from the root).
  const [stack, setStack] = useState<string[]>([]);
  const [leaving, setLeaving] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const push = (id: string) => setStack((s) => (s.includes(id) ? s : [...s, id]));

  const pop = () => {
    if (stack.length === 0) return;
    setLeaving(stack[stack.length - 1]);
    setStack(stack.slice(0, -1));
    setTimeout(() => setLeaving(null), 340);
  };

  const top = stack.length > 0 ? stack[stack.length - 1] : null;
  const transitionLabel = TRANSITIONS.find((t) => t.id === prefs.pageTransition)?.label ?? 'Default';

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-[#F2F2F7]">
      <style>{TRANSITION_KEYFRAMES}</style>

      {/* root page (slides left while a sub-page is open) */}
      <div
        className="absolute inset-0 flex flex-col bg-[#F2F2F7]"
        style={{
          transform: stack.length > 0 ? 'translateX(-22%)' : 'translateX(0)',
          transition: 'transform 320ms cubic-bezier(0.25,0.1,0.25,1)',
        }}
      >
        <div className="flex shrink-0 items-end justify-between px-5 pb-2 pt-[58px]">
          <h1 className="text-[34px] font-bold text-black">Settings</h1>
          <button
            type="button"
            onClick={closeOverlay}
            className="mb-1 flex h-11 items-center gap-0.5 rounded-full bg-black/[0.06] pl-2 pr-4 text-[15px] font-medium text-black active:bg-black/10"
            aria-label="Back to home screen"
          >
            <ChevronLeft size={18} strokeWidth={2.5} /> Home
          </button>
        </div>

        <div className="launcher-scroll min-h-0 flex-1 overflow-y-auto pb-12">
          {/* GENERAL */}
          <Section title="General">
            <Row
              first
              iconBg="#0FB5A6"
              icon={<Sparkles size={17} />}
              label="Blur Effect"
              caption="Frosted glass everywhere"
              trailing={
                <IOSSwitch
                  checked={prefs.blurEnabled}
                  onChange={(v) => setPrefs({ blurEnabled: v })}
                  label="Blur effect"
                />
              }
            />
            <Row
              iconBg="#FF9F0A"
              icon={<ArrowLeftRight size={17} />}
              label="Page Transition"
              onClick={() => push('transition')}
              trailing={<ValueTrail>{transitionLabel}</ValueTrail>}
            />
            <Row
              iconBg="#E85FBD"
              icon={<ZoomIn size={17} />}
              label="Icon Size"
              onClick={() => push('icon-size')}
              trailing={<ValueTrail>{Math.round(prefs.iconScale * 100)}%</ValueTrail>}
            />
            <Row
              iconBg="#8E8E93"
              icon={<RectangleHorizontal size={17} />}
              label="Hide Home Indicator"
              trailing={
                <IOSSwitch
                  checked={prefs.hideNav}
                  onChange={(v) => setPrefs({ hideNav: v })}
                  label="Hide home indicator"
                />
              }
            />
            <Row
              iconBg="#34C759"
              icon={<LayoutGrid size={17} />}
              label="Auto Arrange"
              trailing={
                <IOSSwitch
                  checked={prefs.autoArrange}
                  onChange={(v) => setPrefs({ autoArrange: v })}
                  label="Auto arrange home screen"
                />
              }
            />
            <Row
              iconBg="#FFB340"
              icon={<Type size={17} />}
              label="Flexible Text Size"
              caption="Labels scale with icon size"
              trailing={
                <IOSSwitch
                  checked={prefs.flexibleText}
                  onChange={(v) => setPrefs({ flexibleText: v })}
                  label="Flexible text size"
                />
              }
            />
          </Section>

          {/* WALLPAPER & WEATHER */}
          <Section title="Wallpaper & Weather">
            <Row
              first
              iconBg="#64D2FF"
              icon={<MapPin size={17} />}
              label="City"
              onClick={() => push('city')}
              trailing={<ValueTrail>{prefs.city?.name ?? '—'}</ValueTrail>}
            />
            <Row
              iconBg="#FF9F0A"
              icon={<Thermometer size={17} />}
              label="Temperature Unit"
              trailing={
                <div className="flex rounded-[8px] bg-[#E9E9EB] p-[2px]">
                  {(['C', 'F'] as const).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setPrefs({ tempUnit: u })}
                      aria-pressed={prefs.tempUnit === u}
                      aria-label={`Degrees ${u === 'C' ? 'Celsius' : 'Fahrenheit'}`}
                      className={`h-[27px] w-[40px] rounded-[6px] text-[14px] font-medium transition-colors ${
                        prefs.tempUnit === u ? 'bg-white text-black shadow-sm' : 'text-black/50'
                      }`}
                    >
                      °{u}
                    </button>
                  ))}
                </div>
              }
            />
            <Row
              iconBg="#34C759"
              icon={<RefreshCw size={17} />}
              label="Auto Refresh"
              onClick={() => push('refresh')}
              trailing={<ValueTrail>Every {prefs.autoRefreshH} h</ValueTrail>}
            />
            <Row
              iconBg="#FF2D55"
              icon={<ImageIcon size={17} />}
              label="Change Wallpaper"
              onClick={() => push('wallpaper')}
              trailing={<ChevronTrail />}
            />
          </Section>

          {/* APPS */}
          <Section title="Apps">
            <Row
              first
              iconBg="#FF3B30"
              icon={<Bell size={17} />}
              label="Badge Notifications"
              caption="Count pills on app icons"
              trailing={
                <IOSSwitch
                  checked={prefs.badgesEnabled}
                  onChange={(v) => setPrefs({ badgesEnabled: v })}
                  label="Badge notifications"
                />
              }
            />
            <Row
              iconBg="#0FB5A6"
              icon={<SquarePen size={17} />}
              label="Change App Names"
              onClick={() => push('renames')}
              trailing={<ChevronTrail />}
            />
            <Row
              iconBg="#8E8E93"
              icon={<EyeOff size={17} />}
              label="Hidden Apps"
              onClick={() => push('hidden')}
              trailing={
                prefs.hiddenApps.length > 0 ? (
                  <ValueTrail>{prefs.hiddenApps.length} hidden</ValueTrail>
                ) : (
                  <ChevronTrail />
                )
              }
            />
          </Section>

          {/* ABOUT */}
          <Section title="About">
            <Row
              first
              iconBg="#8E8E93"
              icon={<Info size={17} />}
              label="Version"
              trailing={<span className="text-[15px] text-[#3C3C43]/60">Andromeda 1.0 (web)</span>}
            />
            <Row
              iconBg="#FF3B30"
              icon={<Trash2 size={17} />}
              label="Reset Layout"
              danger
              onClick={() => setConfirmReset(true)}
              trailing={<ChevronTrail />}
            />
          </Section>

          <p className="text-center text-[12px] text-[#3C3C43]/40">Andromeda · Web Edition</p>
        </div>
      </div>

      {/* active sub-page */}
      {top && (
        <div
          key={top}
          className="absolute inset-0 flex flex-col bg-[#F2F2F7]"
          style={{ animation: 'setPushIn 320ms cubic-bezier(0.25,0.1,0.25,1)' }}
        >
          {renderSubPage(top, pop)}
        </div>
      )}

      {/* outgoing sub-page (pop animation) */}
      {leaving && (
        <div
          key={`leaving-${leaving}`}
          className="absolute inset-0 flex flex-col bg-[#F2F2F7]"
          style={{ animation: 'setPopOut 320ms cubic-bezier(0.25,0.1,0.25,1)' }}
          aria-hidden
        >
          {renderSubPage(leaving, () => {})}
        </div>
      )}

      {confirmReset && (
        <ResetDialog
          onCancel={() => setConfirmReset(false)}
          onConfirm={() => {
            resetAll();
            closeOverlay();
          }}
        />
      )}
    </div>
  );
}
