'use client';

// MusicWidget — Now Playing tile: cover art, track, artist, live progress,
// and a play/pause button. Tapping the art opens the Music app.

import { Pause, Play } from 'lucide-react';
import { useLauncher } from '@/lib/launcher/store';
import { TRACKS } from '@/lib/launcher/music';
import { glassStyle } from '@/lib/launcher/glass';
import type { WidgetProps } from './registry';

export function MusicWidget({ width, height }: WidgetProps) {
  const music = useLauncher((s) => s.music);
  const playPause = useLauncher((s) => s.playPause);
  const launchApp = useLauncher((s) => s.launchApp);

  const track = TRACKS[music.trackIndex];
  const progress = Math.min(1, music.position / track.duration);

  return (
    <div
      className="relative flex h-full w-full cursor-pointer items-center gap-3 overflow-hidden"
      style={{ ...glassStyle(22), padding: Math.max(10, height * 0.08) }}
      role="button"
      tabIndex={0}
      aria-label={`Now playing: ${track.title} by ${track.artist}. ${music.playing ? 'Playing' : 'Paused'}.`}
      onClick={() => launchApp('music')}
      onKeyDown={(e) => e.key === 'Enter' && launchApp('music')}
    >
      {/* cover */}
      <div
        className="relative flex h-full shrink-0 items-center justify-center overflow-hidden rounded-2xl shadow-lg"
        style={{ aspectRatio: '1', background: track.art, width: height * 0.76 }}
        aria-hidden
      >
        <span style={{ fontSize: height * 0.34 }}>{track.glyph}</span>
      </div>

      {/* meta + progress */}
      <div className="flex h-full min-w-0 flex-1 flex-col justify-center">
        <div className="truncate text-[13px] font-bold text-black/85">{track.title}</div>
        <div className="truncate text-[11px] font-medium text-black/50">{track.artist}</div>
        <div className="mt-2 h-[3px] w-full overflow-hidden rounded-full bg-black/12">
          <div
            className="h-full rounded-full bg-[#FA2C55] transition-[width] duration-500"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      </div>

      {/* play/pause */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          playPause();
        }}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/12 text-black/75 transition active:scale-90 hover:bg-black/20"
        aria-label={music.playing ? 'Pause music' : 'Play music'}
      >
        {music.playing ? <Pause size={15} fill="currentColor" /> : <Play size={15} fill="currentColor" className="ml-0.5" />}
      </button>
    </div>
  );
}
