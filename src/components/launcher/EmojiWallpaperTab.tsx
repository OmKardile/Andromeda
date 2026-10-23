'use client';

// Emoji wallpaper tab (Task 6-d) — full picker for the recovered emoji
// wallpaper engine. A live phone-shaped preview (9:19.5) renders through the
// same deterministic EmojiDrawer used for the real wallpaper, so what you tap
// is exactly what you get. 8 categories (5 from storage + 3 local), max 8
// selected emojis (oldest drops off), 5 layouts, 11 background colors.

import type { WallpaperDef, EmojiLayout } from '@/lib/launcher/types';
import { EMOJI_CATEGORIES } from '@/lib/launcher/storage';
import { useState } from 'react';
import { EmojiDrawer } from './EmojiDrawer';

// storage.ts owns the first 5 categories — three more live here (the
// recovered spec describes 8 categories; storage.ts is not mine to touch).
const LOCAL_CATEGORIES: { name: string; emojis: string[] }[] = [
  {
    name: 'Hearts',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '💖', '💗', '💓', '💞', '💕', '💘', '💝', '💟', '❣️', '💌'],
  },
  {
    name: 'Symbols',
    emojis: ['✨', '🌟', '💫', '⚡', '🔥', '💥', '🎉', '🎊', '🎈', '🎁', '🏆', '👑', '💎', '🔮', '🪐', '♾️', '🌠', '🎯'],
  },
  {
    name: 'Travel',
    emojis: ['🚗', '✈️', '🚀', '🛸', '🚲', '🛵', '⛵', '🚂', '🗺️', '🧭', '🏝️', '🏔️', '🗽', '🗼', '🎡', '🎢', '🏕️', '🌋'],
  },
];
const CATEGORIES = [...EMOJI_CATEGORIES, ...LOCAL_CATEGORIES];

const BG_COLORS = [
  '#079ECB',
  '#0FB5A6',
  '#34C759',
  '#FFB340',
  '#FF9F0A',
  '#FF3B30',
  '#E85FBD',
  '#C139C4',
  '#F2F2F7',
  '#1C1C1E',
  '#FFFFFF',
];

const LAYOUTS: { id: EmojiLayout; label: string }[] = [
  { id: 'grid-s', label: 'Grid S' },
  { id: 'grid-m', label: 'Grid M' },
  { id: 'grid-l', label: 'Grid L' },
  { id: 'ring', label: 'Ring' },
  { id: 'spiral', label: 'Spiral' },
];

const MAX_PICKS = 8;

export function EmojiWallpaperTab({
  onPick,
  current,
}: {
  onPick: (w: Extract<WallpaperDef, { type: 'emoji' }>) => void;
  current: WallpaperDef;
}) {
  const isCurrent = current.type === 'emoji';
  const [cat, setCat] = useState(0);
  const [selected, setSelected] = useState<string[]>(
    isCurrent && current.emojis.length ? current.emojis : EMOJI_CATEGORIES[0].emojis.slice(0, 3),
  );
  const [layout, setLayout] = useState<EmojiLayout>(isCurrent ? current.layout : 'grid-m');
  const [bg, setBg] = useState(isCurrent ? current.bg : '#079ECB');

  const toggle = (e: string) =>
    setSelected((s) =>
      s.includes(e) ? s.filter((x) => x !== e) : s.length >= MAX_PICKS ? [...s.slice(1), e] : [...s, e],
    );

  return (
    <div className="flex gap-3">
      {/* ------------------------------------------------ live preview phone */}
      <div className="flex shrink-0 flex-col items-center gap-1.5">
        <div
          className="relative w-[120px] overflow-hidden rounded-[22px] shadow-[0_12px_32px_rgba(0,0,0,0.45)] ring-1 ring-white/20"
          style={{ aspectRatio: '9 / 19.5' }}
        >
          <EmojiDrawer className="absolute inset-0" emojis={selected} layout={layout} bg={bg} />
          {/* faux status bar + page dots to sell the "wallpaper" */}
          <div
            className="absolute inset-x-0 top-0 select-none pt-1.5 text-center text-[9px] font-semibold text-white"
            style={{ textShadow: '0 1px 3px rgba(0,0,0,0.55)' }}
          >
            9:41
          </div>
          <div className="absolute inset-x-0 bottom-2 flex justify-center gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className={`h-1 w-1 rounded-full ${i === 0 ? 'bg-white' : 'bg-white/40'}`}
                style={{ boxShadow: '0 0 2px rgba(0,0,0,0.4)' }}
              />
            ))}
          </div>
        </div>
        <span className="text-[10px] font-medium text-white/45">
          {selected.length}/{MAX_PICKS} picked
        </span>
      </div>

      {/* --------------------------------------------------------- controls */}
      <div className="max-h-[380px] min-w-0 flex-1 space-y-3 overflow-y-auto pr-1">
        {/* categories */}
        <div className="flex gap-1 overflow-x-auto pb-0.5">
          {CATEGORIES.map((c, i) => (
            <button
              key={c.name}
              className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                i === cat ? 'bg-white text-black' : 'bg-white/12 text-white/75 hover:bg-white/20'
              }`}
              onClick={() => setCat(i)}
            >
              {c.name}
            </button>
          ))}
        </div>

        {/* emoji select — white ring + order badge when selected */}
        <div className="grid grid-cols-9 gap-1">
          {CATEGORIES[cat].emojis.map((e) => {
            const idx = selected.indexOf(e);
            return (
              <button
                key={e}
                className={`relative flex aspect-square items-center justify-center rounded-lg text-xl leading-none transition-colors ${
                  idx >= 0 ? 'bg-white/25 ring-2 ring-white' : 'hover:bg-white/10'
                }`}
                onClick={() => toggle(e)}
                aria-label={`Emoji ${e}`}
                aria-pressed={idx >= 0}
              >
                {e}
                {idx >= 0 && (
                  <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-white text-[8px] font-bold text-black shadow">
                    {idx + 1}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* layout mode */}
        <div className="flex gap-1 rounded-full bg-white/10 p-1" role="group" aria-label="Layout">
          {LAYOUTS.map((l) => (
            <button
              key={l.id}
              className={`flex-1 rounded-full py-1 text-[10px] font-semibold transition-colors ${
                layout === l.id ? 'bg-white text-black' : 'text-white/70 hover:text-white'
              }`}
              onClick={() => setLayout(l.id)}
              aria-pressed={layout === l.id}
            >
              {l.label}
            </button>
          ))}
        </div>

        {/* bg color */}
        <div className="grid grid-cols-6 gap-2">
          {BG_COLORS.map((c) => (
            <button
              key={c}
              className="aspect-square rounded-full ring-1 ring-white/25 transition-transform active:scale-90"
              style={{
                background: c,
                outline: bg === c ? '2px solid #fff' : undefined,
                outlineOffset: 2,
              }}
              onClick={() => setBg(c)}
              aria-label={`Background ${c}`}
              aria-pressed={bg === c}
            />
          ))}
        </div>

        <button
          className="w-full rounded-full bg-emerald-500 py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
          disabled={selected.length === 0}
          onClick={() => onPick({ type: 'emoji', emojis: selected, layout, bg })}
        >
          Apply Emoji Wallpaper
        </button>
        {current.type === 'emoji' && (
          <p className="text-center text-[10px] text-white/40">
            Current: {current.emojis.slice(0, 8).join(' ')}
          </p>
        )}
      </div>
    </div>
  );
}
