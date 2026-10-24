'use client';

// LockScreen — iOS-style lock screen: big clock, date, weather glance,
// notification stack, and swipe-up-to-unlock (click/tap also unlocks — a11y).
// The wallpaper is heavily dimmed (GLASS.lockDim ≈ 69.8% per the recovered spec).

import { useRef, useState } from 'react';
import { Lock, LockOpen } from 'lucide-react';
import { useLauncher } from '@/lib/launcher/store';
import { GLASS, glassStyle } from '@/lib/launcher/glass';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function bigTime(d: Date): string {
  let h = d.getHours() % 12;
  if (h === 0) h = 12;
  return `${h}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export function LockScreen() {
  const locked = useLauncher((s) => s.locked);
  const tick = useLauncher((s) => s.tick);
  const weather = useLauncher((s) => s.weather);
  const batteryLevel = useLauncher((s) => s.batteryLevel);
  const reminders = useLauncher((s) => s.reminders);
  const unlock = useLauncher((s) => s.unlock);

  const [dy, setDy] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const startY = useRef<number | null>(null);

  if (!locked) return null;

  const finishUnlock = () => {
    setLeaving(true);
    setTimeout(unlock, 380);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    startY.current = e.clientY;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (startY.current === null) return;
    const raw = e.clientY - startY.current;
    setDy(Math.min(0, raw)); // only upward swipes
  };
  const onPointerUp = () => {
    if (dy < -70) finishUnlock();
    setDy(0);
    startY.current = null;
  };

  // re-renders every second via `tick` — deriving the date during render
  // keeps the clock fresh without a setState-in-effect
  const date = new Date();
  const pct = Math.round(batteryLevel * 100);

  return (
    <div
      className="absolute inset-0 z-[80] flex touch-none flex-col items-center overflow-hidden"
      style={{
        background: `rgba(0,0,0,${GLASS.lockDim})`,
        backdropFilter: `blur(${GLASS.blurPx}px)`,
        WebkitBackdropFilter: `blur(${GLASS.blurPx}px)`,
        animation: leaving
          ? 'lockOut 380ms cubic-bezier(0.32,0.72,0,1) both'
          : 'lockIn 300ms ease-out both',
        transform: dy ? `translateY(${dy}px)` : undefined,
        transition: dy === 0 ? 'transform 300ms cubic-bezier(0.32,0.72,0,1)' : 'none',
      }}
      role="dialog"
      aria-label="Lock screen — swipe up to unlock"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <style>{`
        @keyframes lockIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes lockOut { from { transform: translateY(0); opacity: 1; } to { transform: translateY(-100%); opacity: 0.4; } }
      `}</style>

      {/* clock block */}
      <div className="mt-[14%] flex flex-col items-center text-white select-none">
        <Lock size={18} className="mb-3 opacity-80" strokeWidth={2.5} aria-hidden />
        <div
          className="text-[76px] font-semibold leading-none tracking-tight"
          style={{ textShadow: '0 2px 18px rgba(0,0,0,0.45)' }}
          data-tick={tick}
          aria-label={`Locked at ${date.toLocaleTimeString()}`}
        >
          {bigTime(date)}
        </div>
        <div className="mt-2 text-[17px] font-medium text-white/90" style={{ textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}>
          {DAYS[date.getDay()]}, {MONTHS[date.getMonth()]} {date.getDate()}
        </div>

        {/* weather glance */}
        {weather && (
          <div
            className="mt-4 flex items-center gap-2 rounded-2xl px-4 py-2 text-[14px] text-white"
            style={glassStyle(18, { dark: true, strength: 0.7 })}
          >
            <span className="font-semibold">{weather.city.name}</span>
            <span className="opacity-60">·</span>
            <span>
              {Math.round(weather.now.temperature)}° · {weather.now.isDay ? 'Now' : 'Tonight'}
            </span>
          </div>
        )}
      </div>

      {/* notifications glance (up to 2) */}
      <div className="mt-6 w-full max-w-[330px] space-y-2 px-6">
        <LockNotif
          title="Andromeda"
          body={`Battery ${pct}% — swipe up to unlock`}
          glyph="🔒"
        />
        <LockNotif
          title="Reminders"
          body={
            reminders.some((r) => !r.done)
              ? `${reminders.filter((r) => !r.done).length} open reminder${
                  reminders.filter((r) => !r.done).length === 1 ? '' : 's'
                }`
              : 'All caught up'
          }
          glyph="✅"
        />
      </div>

      {/* unlock hint */}
      <button
        type="button"
        className="mt-auto mb-12 flex flex-col items-center gap-2.5 text-white/90 transition-transform active:scale-95"
        onClick={(e) => {
          e.stopPropagation();
          finishUnlock();
        }}
        aria-label="Unlock"
      >
        <span className="text-[13px] font-medium tracking-wide" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
          Swipe up to unlock
        </span>
        <LockOpen size={22} className="animate-[lockBounce_2s_ease-in-out_infinite]" aria-hidden />
        <style>{`@keyframes lockBounce { 0%,100% { transform: translateY(0);} 50% { transform: translateY(-7px);} }`}</style>
      </button>
    </div>
  );
}

function LockNotif({ title, body, glyph }: { title: string; body: string; glyph: string }) {
  return (
    <div
      className="flex items-center gap-3 rounded-[20px] px-3.5 py-3"
      style={glassStyle(20, { dark: true, strength: 0.85 })}
      role="status"
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-white/15 text-lg" aria-hidden>
        {glyph}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-semibold text-white/60">{title}</div>
        <div className="truncate text-[14px] text-white">{body}</div>
      </div>
    </div>
  );
}
