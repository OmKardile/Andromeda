'use client';

// ControlCenter — iOS-style pull-down shade with connectivity tiles,
// brightness / volume sliders, media controls, and launcher quick toggles
// (Blur, Dark Mode, Flashlight). Drag down or click the top handle.

import { useRef, useState } from 'react';
import {
  Bluetooth,
  Moon,
  Pause,
  Play,
  Plane,
  Radio,
  SkipBack,
  SkipForward,
  Sparkles,
  Sun,
  Flashlight,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useLauncher } from '@/lib/launcher/store';
import { TRACKS, fmtTime } from '@/lib/launcher/music';
import { glassStyle } from '@/lib/launcher/glass';

function CCTile({
  on,
  label,
  icon: Icon,
  onClick,
  bg,
}: {
  on: boolean;
  label: string;
  icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>;
  onClick: () => void;
  bg?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onClick}
      className="flex h-[70px] flex-col items-center justify-center gap-1 rounded-2xl transition active:scale-95"
      style={{
        background: on ? bg ?? '#0A84FF' : 'rgba(120,120,128,0.36)',
        color: on ? '#fff' : 'rgba(255,255,255,0.82)',
        boxShadow: on ? '0 4px 14px rgba(10,132,255,0.35)' : 'none',
      }}
    >
      <Icon size={22} />
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  );
}

function Slider({
  value,
  onChange,
  icon: Icon,
  label,
  accent,
}: {
  value: number;
  onChange: (v: number) => void;
  icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>;
  label: string;
  accent: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const setFromClientY = (clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const v = 1 - (clientY - rect.top) / rect.height;
    onChange(Math.max(0.05, Math.min(1, v)));
  };

  return (
    <div
      ref={ref}
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuenow={Math.round(value * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      onKeyDown={(e) => {
        if (e.key === 'ArrowUp') onChange(Math.min(1, value + 0.1));
        if (e.key === 'ArrowDown') onChange(Math.max(0.05, value - 0.1));
      }}
      onPointerDown={(e) => {
        dragging.current = true;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        setFromClientY(e.clientY);
      }}
      onPointerMove={(e) => dragging.current && setFromClientY(e.clientY)}
      onPointerUp={() => (dragging.current = false)}
      onPointerCancel={() => (dragging.current = false)}
      className="relative h-full w-full cursor-pointer touch-none overflow-hidden rounded-2xl"
      style={{ background: 'rgba(120,120,128,0.36)' }}
    >
      <div
        className="absolute inset-x-0 bottom-0 transition-[height] duration-100"
        style={{ height: `${value * 100}%`, background: accent }}
      />
      <div className="absolute inset-x-0 bottom-3 flex justify-center text-white mix-blend-difference">
        <Icon size={20} />
      </div>
    </div>
  );
}

export function ControlCenter() {
  const shade = useLauncher((s) => s.shade);
  const setShade = useLauncher((s) => s.setShade);
  const cc = useLauncher((s) => s.ccToggles);
  const toggleCC = useLauncher((s) => s.toggleCC);
  const prefs = useLauncher((s) => s.prefs);
  const setPrefs = useLauncher((s) => s.setPrefs);
  const music = useLauncher((s) => s.music);
  const playPause = useLauncher((s) => s.playPause);
  const nextTrack = useLauncher((s) => s.nextTrack);

  const [closing, setClosing] = useState(false);
  const [volume, setVolume] = useState(0.65);

  if (shade !== 'control') return null;

  const close = () => {
    setClosing(true);
    setTimeout(() => {
      setShade('none');
      setClosing(false);
    }, 260);
  };

  const track = TRACKS[music.trackIndex];

  return (
    <div className="absolute inset-0 z-[64]" role="dialog" aria-label="Control Center">
      {/* scrim */}
      <button
        className="absolute inset-0 bg-black/45"
        style={{ backdropFilter: 'blur(2px)', animation: 'ccFadeIn 240ms both' }}
        onClick={close}
        aria-label="Close Control Center"
      />
      <style>{`
        @keyframes ccFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes ccIn { from { transform: translateY(-16%); opacity: 0.3; } to { transform: translateY(0); opacity: 1; } }
        @keyframes ccOut { from { transform: translateY(0); opacity: 1; } to { transform: translateY(-16%); opacity: 0; } }
      `}</style>

      <div
        className="absolute inset-x-3 top-2 rounded-[34px] px-4 pb-4 pt-3 text-white"
        style={{
          ...glassStyle(34, { dark: true, strength: 1.05 }),
          animation: `${closing ? 'ccOut' : 'ccIn'} 260ms cubic-bezier(0.32,0.72,0,1) both`,
        }}
      >
        {/* grabber */}
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/35" />

        <div className="grid grid-cols-4 gap-2.5">
          <div className="col-span-2 grid grid-cols-2 gap-2.5">
            <CCTile on={cc.airplane} label="Airplane" icon={Plane} onClick={() => toggleCC('airplane')} bg="#FF9F0A" />
            <CCTile on={cc.wifi} label="Wi-Fi" icon={Radio} onClick={() => toggleCC('wifi')} />
            <CCTile on={cc.bluetooth} label="Bluetooth" icon={Bluetooth} onClick={() => toggleCC('bluetooth')} />
            <CCTile on={cc.flashlight} label="Torch" icon={Flashlight} onClick={() => toggleCC('flashlight')} bg="#FFD60A" />
          </div>

          <div className="h-[151px]">
            <Slider
              value={prefs.brightness}
              onChange={(v) => setPrefs({ brightness: Math.round(v * 100) / 100 })}
              icon={Sun}
              label="Brightness"
              accent="#FFFFFF"
            />
          </div>
          <div className="h-[151px]">
            <Slider
              value={volume}
              onChange={setVolume}
              icon={volume < 0.06 ? VolumeX : Volume2}
              label="Volume"
              accent="#0A84FF"
            />
          </div>
        </div>

        {/* media module */}
        <div className="mt-2.5 flex items-center gap-3 rounded-2xl bg-white/10 p-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl shadow-inner"
            style={{ background: track.art }}
            aria-hidden
          >
            {track.glyph}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-semibold leading-tight">{track.title}</div>
            <div className="truncate text-[12px] text-white/60">
              {track.artist} · {fmtTime(music.position)} / {fmtTime(track.duration)}
            </div>
            <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/20">
              <div
                className="h-full rounded-full bg-white/85 transition-[width] duration-500"
                style={{ width: `${(music.position / track.duration) * 100}%` }}
              />
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-white">
            <button
              type="button"
              onClick={() => nextTrack(-1)}
              className="rounded-full p-2 transition active:scale-90 hover:bg-white/15"
              aria-label="Previous track"
            >
              <SkipBack size={17} fill="currentColor" />
            </button>
            <button
              type="button"
              onClick={playPause}
              className="rounded-full p-2.5 transition active:scale-90 hover:bg-white/15"
              aria-label={music.playing ? 'Pause' : 'Play'}
            >
              {music.playing ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" />}
            </button>
            <button
              type="button"
              onClick={() => nextTrack(1)}
              className="rounded-full p-2 transition active:scale-90 hover:bg-white/15"
              aria-label="Next track"
            >
              <SkipForward size={17} fill="currentColor" />
            </button>
          </div>
        </div>

        {/* launcher quick toggles */}
        <div className="mt-2.5 grid grid-cols-4 gap-2.5">
          <CCTile
            on={prefs.blurEnabled}
            label="Blur"
            icon={Sparkles}
            onClick={() => setPrefs({ blurEnabled: !prefs.blurEnabled })}
            bg="#0FB5A6"
          />
          <CCTile
            on={prefs.darkMode}
            label="Dark Mode"
            icon={Moon}
            onClick={() => setPrefs({ darkMode: !prefs.darkMode })}
            bg="#5E5CE6"
          />
          <div className="col-span-2 flex items-center justify-center gap-2 rounded-2xl bg-white/10 px-3 text-[12px] font-medium text-white/70">
            {cc.airplane ? 'Radios off' : cc.wifi ? 'Andromeda-5G' : 'Wi-Fi off'}
          </div>
        </div>
      </div>
    </div>
  );
}
