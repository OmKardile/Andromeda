'use client';

// EmojiDrawer — deterministic emoji wallpaper engine (Task 6-d).
// Port of the recovered LauncherOS18 wallpaper drawers (GRID_S / GRID_M /
// GRID_L / RING / EmojiSpiralDrawer) to a resolution-independent CSS renderer.
//
// All geometry is expressed against the 390px-wide phone-frame reference using
// container-query units (cqw = 1% of this element's width), so the exact same
// markup renders as a full wallpaper (390×844) and as a tiny live preview in
// the picker — no measuring, no ResizeObserver.
//
// Determinism: every jitter (position / rotation) is drawn from a seeded
// mulberry32 PRNG (seed = stable hash of config ⊕ index ⊕ emoji codepoints),
// never from Math.random() — the wallpaper is pixel-stable across renders.

import type { CSSProperties } from 'react';
import type { EmojiLayout } from '@/lib/launcher/types';

export interface EmojiDrawerProps {
  emojis: string[];
  layout: EmojiLayout;
  bg: string;
  className?: string;
  style?: CSSProperties;
  /** tile-count multiplier (default 1). Grids keep their column count, rows scale; ring/spiral scale N. */
  densityScale?: number;
}

// Fallback palette for stored wallpapers with an empty list
// (same seeds the old EmojiWallpaperStub used, now defined locally).
const EMOJI_FALLBACK = ['😀', '🌻', '🐶', '🍏', '🎧', '🌈', '🦋', '🌊'];

const REF_WIDTH = 390; // phone-frame reference width — spec font sizes are px @ 390
const MAX_TILES = 140; // ~140 tile perf cap for grid modes (8×18=144 → clipped)
const GOLDEN_ANGLE = 137.508; // EmojiSpiralDrawer golden angle, degrees

/** px @ reference width → container-query width units (cqw). */
const cq = (pxAtRef: number) => (pxAtRef / REF_WIDTH) * 100;

// ----------------------------------------------------------------- seeded rng

function hashString(s: string): number {
  let h = 2166136261; // FNV-1a
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function codepoints(emoji: string): number {
  let sum = 0;
  for (const ch of emoji) sum += ch.codePointAt(0) ?? 0;
  return sum >>> 0;
}

// ------------------------------------------------------------------- geometry

interface Tile {
  key: string;
  emoji: string;
  left: string;
  top: string;
  fontSize: string;
  rotate: number;
}

function buildTiles(emojis: string[], layout: EmojiLayout, densityScale: number): Tile[] {
  const items = emojis.length ? emojis : EMOJI_FALLBACK;
  const d =
    Number.isFinite(densityScale) && densityScale > 0 ? Math.min(2, Math.max(0.25, densityScale)) : 1;
  const baseSeed = hashString(`${layout}|${d}|${items.join('')}`);

  // Per-tile rng: seeded by config hash ⊕ index ⊕ emoji codepoints, so the
  // same emoji at a different slot (or a different wallpaper config) jitters
  // differently but always identically across re-renders.
  const rngFor = (i: number, emoji: string) =>
    mulberry32((baseSeed ^ Math.imul(i + 1, 2654435761) ^ codepoints(emoji)) >>> 0);

  const tiles: Tile[] = [];

  if (layout === 'ring' || layout === 'spiral') {
    const n =
      layout === 'ring'
        ? Math.min(28, Math.max(6, Math.round(14 * d)))
        : Math.min(28, Math.max(8, Math.round(18 * d)));
    for (let i = 0; i < n; i++) {
      const emoji = items[i % items.length];
      const rng = rngFor(i, emoji);
      const jx = (rng() * 2 - 1) * 3; // ±3% of width, per-axis position jitter
      const jy = (rng() * 2 - 1) * 3;
      let dx: number;
      let dy: number;
      let sizeCq: number;
      let rot: number;
      if (layout === 'ring') {
        const t = (i / n) * Math.PI * 2 - Math.PI / 2; // start at 12 o'clock
        const r = 34; // ~34% of min-dimension (= width in portrait) radius
        dx = Math.cos(t) * r;
        dy = Math.sin(t) * r;
        sizeCq = cq(30);
        rot = (rng() * 2 - 1) * 8;
      } else {
        // EmojiSpiralDrawer: golden-angle sunburst.
        // r(i) = (i/N) · 0.42 of min-dimension, θ(i) = i · 137.508°,
        // size shrinking 30px → 14px as the radius grows.
        const r = (i / n) * 0.42 * 100; // % of width
        const theta = (i * GOLDEN_ANGLE * Math.PI) / 180;
        dx = Math.cos(theta) * r;
        dy = Math.sin(theta) * r;
        const f = n > 1 ? i / (n - 1) : 0;
        sizeCq = cq(30 - f * 16);
        rot = (rng() * 2 - 1) * 25; // ±25° organic tilt
      }
      tiles.push({
        key: `${layout}-${i}`,
        emoji,
        left: `calc(50% + ${(dx + jx).toFixed(2)}cqw)`,
        top: `calc(50% + ${(dy + jy).toFixed(2)}cqw)`,
        fontSize: `${sizeCq.toFixed(2)}cqw`,
        rotate: rot,
      });
    }
    return tiles;
  }

  // Grid modes — cols / rows / font sizes from the recovered spec.
  const spec =
    layout === 'grid-s'
      ? { cols: 8, rows: 18, fontPx: 22 }
      : layout === 'grid-m'
        ? { cols: 6, rows: 13, fontPx: 30 }
        : { cols: 4, rows: 9, fontPx: 44 };
  const rows = Math.max(1, Math.round(spec.rows * d));
  const count = Math.min(spec.cols * rows, MAX_TILES);
  const cellW = 100 / spec.cols;
  const cellH = 100 / rows;
  for (let i = 0; i < count; i++) {
    const emoji = items[i % items.length];
    const rng = rngFor(i, emoji);
    const jx = (rng() * 2 - 1) * 0.03 * cellW; // ±3% of the cell
    const jy = (rng() * 2 - 1) * 0.03 * cellH;
    const rot = (rng() * 2 - 1) * 5; // subtle tilt
    const col = i % spec.cols;
    const row = Math.floor(i / spec.cols);
    tiles.push({
      key: `${layout}-${i}`,
      emoji,
      left: `${((col + 0.5) * cellW + jx).toFixed(2)}%`,
      top: `${((row + 0.5) * cellH + jy).toFixed(2)}%`,
      fontSize: `${cq(spec.fontPx).toFixed(2)}cqw`,
      rotate: rot,
    });
  }
  return tiles;
}

// ------------------------------------------------------------------ component

export function EmojiDrawer({
  emojis,
  layout,
  bg,
  className,
  style,
  densityScale = 1,
}: EmojiDrawerProps) {
  const tiles = buildTiles(emojis, layout, densityScale);
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full select-none overflow-hidden ${className ?? ''}`}
      style={{ background: bg, containerType: 'inline-size', ...style }}
    >
      {tiles.map((t) => (
        <span
          key={t.key}
          className="absolute leading-none"
          style={{
            left: t.left,
            top: t.top,
            fontSize: t.fontSize,
            transform: `translate(-50%, -50%) rotate(${t.rotate.toFixed(2)}deg)`,
            // soft depth under every emoji
            textShadow: '0 2px 6px rgba(0, 0, 0, 0.18)',
          }}
        >
          {t.emoji}
        </span>
      ))}
    </div>
  );
}
