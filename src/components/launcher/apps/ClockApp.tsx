'use client';

// Clock — World Clock + Alarm tabs, mirroring the iOS clock app.
// World clock rows render live (driven by the store's 1s tick) using
// Intl with explicit time zones; alarms are a demo list with switches.

import { useEffect, useRef, useState } from 'react';
import { AlarmClock, ChevronLeft, Globe, Plus } from 'lucide-react';
import { useLauncher } from '@/lib/launcher/store';

const ZONES: { city: string; tz: string }[] = [
  { city: 'New Delhi', tz: 'Asia/Kolkata' },
  { city: 'Mumbai', tz: 'Asia/Kolkata' },
  { city: 'London', tz: 'Europe/London' },
  { city: 'New York', tz: 'America/New_York' },
  { city: 'Tokyo', tz: 'Asia/Tokyo' },
  { city: 'Sydney', tz: 'Australia/Sydney' },
];

interface Alarm {
  id: string;
  time: string;
  meridiem: 'AM' | 'PM';
  label: string;
  repeat: string;
  on: boolean;
  bedtime?: boolean;
}

const DEMO_ALARMS: Alarm[] = [
  { id: 'a1', time: '7:00', meridiem: 'AM', label: 'Wake up', repeat: 'Every day', on: true },
  { id: 'a2', time: '8:30', meridiem: 'AM', label: 'Standup', repeat: 'Mon–Fri', on: true },
  { id: 'a3', time: '1:00', meridiem: 'PM', label: 'Lunch', repeat: 'Mon–Fri', on: false },
  { id: 'a4', time: '10:30', meridiem: 'PM', label: 'Wind down', repeat: 'Every day', on: true, bedtime: true },
];

/** Minutes the given zone is offset from UTC at `at`. */
function tzOffsetMinutes(tz: string, at: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const map: Record<string, string> = {};
  for (const p of dtf.formatToParts(at)) map[p.type] = p.value;
  const asUTC = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour) % 24,
    Number(map.minute),
    Number(map.second),
  );
  return Math.round((asUTC - at.getTime()) / 60000);
}

function timeInZone(tz: string, at: Date): { time: string; meridiem: string } {
  const out = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(at);
  const m = out.match(/^(\d{1,2}:\d{2})\s*(AM|PM)$/);
  if (!m) return { time: out, meridiem: '' };
  return { time: m[1], meridiem: m[2] };
}

/** Calendar-day difference between the zone's date and the local date. */
function zoneDayDiff(tz: string, at: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const map: Record<string, string> = {};
  for (const p of dtf.formatToParts(at)) map[p.type] = p.value;
  const zoneDays = Date.UTC(Number(map.year), Number(map.month) - 1, Number(map.day)) / 86_400_000;
  const localDays = Date.UTC(at.getFullYear(), at.getMonth(), at.getDate()) / 86_400_000;
  return zoneDays - localDays;
}

function dayOffsetLabel(tz: string, at: Date): string {
  const diff = zoneDayDiff(tz, at);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff === -1) return 'Yesterday';
  return diff > 0 ? `${diff} days ahead` : `${-diff} days behind`;
}

function gmtLabel(tz: string, at: Date): string {
  const off = tzOffsetMinutes(tz, at);
  const sign = off < 0 ? '−' : '+';
  const a = Math.abs(off);
  const h = Math.floor(a / 60);
  const m = a % 60;
  return `GMT${sign}${h}${m ? ':' + String(m).padStart(2, '0') : ''}`;
}

function Switch({
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
      style={{ background: checked ? '#4CD964' : '#3A3A3C' }}
    >
      <span
        className="absolute top-[2px] h-[27px] w-[27px] rounded-full bg-white shadow-[0_2px_4px_rgba(0,0,0,0.35)] transition-[left] duration-200"
        style={{ left: checked ? '22px' : '2px' }}
      />
    </button>
  );
}

function WorldClockPane() {
  const tick = useLauncher((s) => s.tick);
  void tick; // subscribed for the 1s re-render
  const now = new Date();

  return (
    <div data-tick={tick}>
      {ZONES.map((z, i) => {
        const { time, meridiem } = timeInZone(z.tz, now);
        return (
          <div key={`${z.city}-${i}`} className="relative flex items-center justify-between px-6 py-4">
            {i > 0 && (
              <span className="absolute inset-x-[16px] top-0 h-px bg-white/[0.12]" aria-hidden />
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-[13px] text-white/50">{dayOffsetLabel(z.tz, now)}</span>
              <span className="text-[22px] font-medium text-white">{z.city}</span>
              <span className="text-[12px] text-white/40">{gmtLabel(z.tz, now)}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[40px] font-light leading-none text-white tabular-nums">{time}</span>
              {meridiem && <span className="text-[13px] font-medium text-white/70">{meridiem}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AlarmPane({ onAdd }: { onAdd: () => void }) {
  const [alarms, setAlarms] = useState<Alarm[]>(DEMO_ALARMS);

  return (
    <div>
      {alarms.map((a, i) => (
        <div key={a.id}>
          {a.bedtime && (
            <h2 className="px-6 pb-1 pt-4 text-[13px] font-medium uppercase tracking-[0.08em] text-white/40">
              Bedtime
            </h2>
          )}
          <div className="relative flex items-center justify-between px-6 py-3.5">
            {i > 0 && !a.bedtime && (
              <span className="absolute inset-x-[16px] top-0 h-px bg-white/[0.12]" aria-hidden />
            )}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-1">
                <span
                  className={`text-[40px] font-light leading-none tabular-nums ${a.on ? 'text-white' : 'text-white/35'}`}
                >
                  {a.time}
                </span>
                <span className={`text-[13px] font-medium ${a.on ? 'text-white/70' : 'text-white/30'}`}>
                  {a.meridiem}
                </span>
              </div>
              <span className={`text-[13px] ${a.on ? 'text-white/50' : 'text-white/30'}`}>
                {a.label} · {a.repeat}
              </span>
            </div>
            <Switch
              checked={a.on}
              label={`${a.label} alarm ${a.on ? 'on' : 'off'}`}
              onChange={(v) => setAlarms((prev) => prev.map((x) => (x.id === a.id ? { ...x, on: v } : x)))}
            />
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={onAdd}
        className="mt-4 flex w-full items-center justify-center gap-2 py-3 text-[15px] font-medium text-[#FF9F0A]"
        aria-label="Add alarm"
      >
        <Plus size={18} /> Add Alarm
      </button>
    </div>
  );
}

export function ClockApp() {
  const [tab, setTab] = useState<'world' | 'alarm'>('world');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = (msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(msg);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  };

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#0A0A0A]">
      {/* header */}
      <div className="flex items-center justify-between px-4 pb-3 pt-[62px]">
        <button
          type="button"
          onClick={() => useLauncher.getState().closeOverlay()}
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20"
          aria-label="Back to home"
        >
          <ChevronLeft size={22} />
        </button>
        <h1 className="text-[34px] font-bold text-white">
          {tab === 'world' ? 'World Clock' : 'Alarm'}
        </h1>
        {tab === 'alarm' ? (
          <button
            type="button"
            onClick={() => showToast('Alarms are coming soon')}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20"
            aria-label="Add alarm"
          >
            <Plus size={22} />
          </button>
        ) : (
          <span className="h-11 w-11" aria-hidden />
        )}
      </div>

      {/* panes */}
      <div
        key={tab}
        className="launcher-scroll min-h-0 flex-1 overflow-y-auto pb-10"
        style={{ animation: 'clockPane 180ms ease-out' }}
      >
        <style>{`@keyframes clockPane { from { opacity: 0; transform: translateY(6px);} to { opacity: 1; transform: none;} }`}</style>
        {tab === 'world' ? <WorldClockPane /> : <AlarmPane onAdd={() => showToast('Alarms are coming soon')} />}
      </div>

      {/* toast */}
      {toast && (
        <div
          className="pointer-events-none absolute bottom-[110px] left-1/2 z-10 -translate-x-1/2 rounded-full bg-white/15 px-4 py-2 text-[13px] font-medium text-white backdrop-blur-xl"
          role="status"
        >
          {toast}
        </div>
      )}

      {/* tab bar */}
      <div className="flex h-[84px] shrink-0 items-start border-t border-white/10 bg-[#151517]/95 pt-2 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setTab('world')}
          aria-pressed={tab === 'world'}
          className={`flex h-14 flex-1 flex-col items-center justify-center gap-1 ${
            tab === 'world' ? 'text-white' : 'text-white/40'
          }`}
        >
          <Globe size={24} strokeWidth={tab === 'world' ? 2.2 : 1.8} />
          <span className="text-[10px] font-medium">World Clock</span>
        </button>
        <button
          type="button"
          onClick={() => setTab('alarm')}
          aria-pressed={tab === 'alarm'}
          className={`flex h-14 flex-1 flex-col items-center justify-center gap-1 ${
            tab === 'alarm' ? 'text-white' : 'text-white/40'
          }`}
        >
          <AlarmClock size={24} strokeWidth={tab === 'alarm' ? 2.2 : 1.8} />
          <span className="text-[10px] font-medium">Alarm</span>
        </button>
      </div>

    </div>
  );
}
