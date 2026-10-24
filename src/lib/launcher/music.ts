// Andromeda launcher — music library (original demo tracks).
// Cover art is generated CSS (gradients + glyphs) — no binary assets.

import type { TrackDef } from './types';

export const TRACKS: TrackDef[] = [
  {
    id: 't-aurora',
    title: 'Aurora Drive',
    artist: 'Nova Fields',
    duration: 214,
    art: 'linear-gradient(140deg,#FF9F0A 0%,#FF3B30 55%,#C139C4 100%)',
    glyph: '🌅',
  },
  {
    id: 't-midnight',
    title: 'Midnight Runner',
    artist: 'The Glass Cities',
    duration: 187,
    art: 'linear-gradient(140deg,#0A84FF 0%,#5E5CE6 60%,#1C1C1E 100%)',
    glyph: '🌃',
  },
  {
    id: 't-solar',
    title: 'Solar Winds',
    artist: 'Kepler Sound',
    duration: 243,
    art: 'linear-gradient(140deg,#30D158 0%,#0FB5A6 70%,#079ECB 100%)',
    glyph: '☀️',
  },
  {
    id: 't-velvet',
    title: 'Velvet Static',
    artist: 'Marina Waves',
    duration: 198,
    art: 'linear-gradient(140deg,#FF6482 0%,#FA2C55 60%,#8E8E93 100%)',
    glyph: '📻',
  },
  {
    id: 't-orbit',
    title: 'Low Orbit',
    artist: 'Kite & Compass',
    duration: 226,
    art: 'linear-gradient(140deg,#64D2FF 0%,#0A84FF 55%,#5E5CE6 100%)',
    glyph: '🛰️',
  },
  {
    id: 't-paper',
    title: 'Paper Planes Home',
    artist: 'Fable & Fern',
    duration: 172,
    art: 'linear-gradient(140deg,#FFD60A 0%,#FF9F0A 60%,#34C759 100%)',
    glyph: '✈️',
  },
];

export function fmtTime(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}
