'use client';

// MusicApp — Now Playing: cover art (CSS gradients), transport controls,
// seekable progress, volume, and the track list. Plays through the global
// music engine (keeps position across launcher navigation).

import { useRef, useState } from 'react';
import { ChevronLeft, Pause, Play, Repeat, Shuffle, SkipBack, SkipForward, Volume2 } from 'lucide-react';
import { useLauncher } from '@/lib/launcher/store';
import { TRACKS, fmtTime } from '@/lib/launcher/music';

export function MusicApp() {
  const music = useLauncher((s) => s.music);
  const playPause = useLauncher((s) => s.playPause);
  const nextTrack = useLauncher((s) => s.nextTrack);
  const seekTo = useLauncher((s) => s.seekTo);
  const closeOverlay = useLauncher((s) => s.closeOverlay);

  const [volume, setVolume] = useState(0.7);
  const barRef = useRef<HTMLDivElement>(null);

  const track = TRACKS[music.trackIndex];
  const progress = music.position / track.duration;

  const seekFromClientX = (clientX: number) => {
    const el = barRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const ratio = (clientX - rect.left) / rect.width;
    seekTo(ratio * track.duration);
  };

  return (
    <div className="launcher-scroll relative flex min-h-0 flex-1 flex-col overflow-y-auto bg-[#0B0B0D] text-white">
      {/* top bar */}
      <div className="flex items-center justify-between px-5 pb-2 pt-[58px]">
        <span className="text-[15px] font-semibold text-white/50">Library</span>
        <button
          type="button"
          onClick={closeOverlay}
          className="flex h-11 items-center gap-0.5 rounded-full bg-white/10 pl-2 pr-4 text-[15px] font-medium active:bg-white/20"
          aria-label="Back to home screen"
        >
          <ChevronLeft size={18} strokeWidth={2.5} /> Home
        </button>
      </div>

      {/* hero */}
      <div className="flex flex-col items-center px-8 pt-4">
        <div
          className="relative flex h-[210px] w-[210px] items-center justify-center rounded-[26px] shadow-[0_24px_60px_rgba(0,0,0,0.6)] transition-transform duration-500"
          style={{
            background: track.art,
            transform: music.playing ? 'scale(1)' : 'scale(0.88)',
          }}
          aria-hidden
        >
          <span className="text-[86px] drop-shadow-lg">{track.glyph}</span>
        </div>

        <div className="mt-6 w-full text-center">
          <h1 className="text-[21px] font-bold leading-tight">{track.title}</h1>
          <p className="text-[16px] text-white/55">{track.artist}</p>
        </div>

        {/* seek bar */}
        <div className="mt-5 w-full">
          <div
            ref={barRef}
            role="slider"
            tabIndex={0}
            aria-label="Seek position"
            aria-valuenow={music.position}
            aria-valuemin={0}
            aria-valuemax={track.duration}
            onKeyDown={(e) => {
              if (e.key === 'ArrowRight') seekTo(music.position + 5);
              if (e.key === 'ArrowLeft') seekTo(music.position - 5);
            }}
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              seekFromClientX(e.clientX);
            }}
            onPointerMove={(e) => e.buttons === 1 && seekFromClientX(e.clientX)}
            className="group h-6 w-full cursor-pointer touch-none"
          >
            <div className="h-[5px] w-full overflow-hidden rounded-full bg-white/18">
              <div
                className="h-full rounded-full bg-white transition-[width] duration-500"
                style={{ width: `${progress * 100}%` }}
              />
            </div>
          </div>
          <div className="mt-1 flex justify-between text-[11px] tabular-nums text-white/45">
            <span>{fmtTime(music.position)}</span>
            <span>-{fmtTime(track.duration - music.position)}</span>
          </div>
        </div>

        {/* transport */}
        <div className="mt-3 flex w-full items-center justify-center gap-10">
          <button
            type="button"
            onClick={() => nextTrack(-1)}
            className="p-2 text-white/85 transition active:scale-90"
            aria-label="Previous track"
          >
            <SkipBack size={30} fill="currentColor" />
          </button>
          <button
            type="button"
            onClick={playPause}
            className="p-2 transition active:scale-90"
            aria-label={music.playing ? 'Pause' : 'Play'}
          >
            {music.playing ? <Pause size={46} fill="currentColor" /> : <Play size={46} fill="currentColor" />}
          </button>
          <button
            type="button"
            onClick={() => nextTrack(1)}
            className="p-2 text-white/85 transition active:scale-90"
            aria-label="Next track"
          >
            <SkipForward size={30} fill="currentColor" />
          </button>
        </div>

        {/* volume */}
        <div className="mt-4 flex w-full items-center gap-3 px-2">
          <Volume2 size={16} className="shrink-0 text-white/50" />
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(e) => setVolume(Number(e.target.value) / 100)}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/20 accent-white"
            aria-label="Volume"
          />
        </div>

        <div className="mt-3 flex items-center gap-6 text-white/35">
          <Shuffle size={16} aria-label="Shuffle off" />
          <Repeat size={16} aria-label="Repeat off" />
        </div>
      </div>

      {/* track list */}
      <div className="mt-8 px-5 pb-12">
        <h2 className="mb-2 px-1 text-[13px] font-bold uppercase tracking-wider text-white/40">Up Next</h2>
        <div className="space-y-1">
          {TRACKS.map((t, i) => {
            const active = i === music.trackIndex;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  if (active) playPause();
                  else {
                    nextTrack(i - music.trackIndex);
                  }
                }}
                className={`flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition active:scale-[0.98] ${
                  active ? 'bg-white/12' : 'hover:bg-white/6'
                }`}
                aria-label={`Play ${t.title} by ${t.artist}`}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl"
                  style={{ background: t.art }}
                  aria-hidden
                >
                  {t.glyph}
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`truncate text-[15px] font-semibold ${active ? 'text-[#FA2C55]' : 'text-white'}`}>
                    {t.title}
                    {active && music.playing && <span className="ml-2 text-[11px] text-white/50">playing…</span>}
                  </div>
                  <div className="truncate text-[13px] text-white/45">{t.artist}</div>
                </div>
                <span className="shrink-0 text-[12px] tabular-nums text-white/35">{fmtTime(t.duration)}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
