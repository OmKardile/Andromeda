'use client';

// World clock — four cities in a 2×2 grid on a light glass card
// (recovered style: light glass + near-black text). Times are computed
// with Intl.DateTimeFormat per time zone; the day offset ("Today" /
// "Tomorrow" / "Yesterday") is relative to the viewer's local day.

import type { CSSProperties } from 'react';
import { useLauncher } from '@/lib/launcher/store';
import type { WidgetProps } from './registry';

const ZONES: { city: string; tz: string }[] = [
  { city: 'New Delhi', tz: 'Asia/Kolkata' },
  { city: 'London', tz: 'Europe/London' },
  { city: 'New York', tz: 'America/New_York' },
  { city: 'Tokyo', tz: 'Asia/Tokyo' },
];

const INK = '#1C1C1E';

export function WorldClock({ width, height }: WidgetProps) {
  useLauncher((s) => s.tick); // minute-level updates ride the 1s tick
  const blurEnabled = useLauncher((s) => s.prefs.blurEnabled);

  const now = new Date();
  const localDay = dayKey(now);

  const timeSize = Math.max(20, Math.min(27, Math.round(height * 0.155)));

  return (
    <div style={card(width, height, blurEnabled)}>
      <div className="grid h-full w-full grid-cols-2 grid-rows-2">
        {ZONES.map((z, i) => {
          const time = new Intl.DateTimeFormat('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: z.tz,
          }).format(now);
          const day = dayKey(now, z.tz);
          const offset = day > localDay ? 'Tomorrow' : day < localDay ? 'Yesterday' : 'Today';
          return (
            <div
              key={z.city}
              className="flex flex-col justify-center"
              style={{
                padding: '4px 16px',
                borderRight: i % 2 === 0 ? '1px solid rgba(28,28,29,0.08)' : undefined,
                borderBottom: i < 2 ? '1px solid rgba(28,28,29,0.08)' : undefined,
              }}
            >
              <div className="flex items-baseline justify-between">
                <span style={{ fontSize: 11, fontWeight: 600, color: INK, opacity: 0.82 }}>{z.city}</span>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 600,
                    letterSpacing: '0.02em',
                    color: offset === 'Today' ? 'rgba(60,60,67,0.55)' : '#FF9500',
                  }}
                >
                  {offset}
                </span>
              </div>
              <span
                className="tabular-nums"
                style={{ fontSize: timeSize, fontWeight: 300, lineHeight: 1.15, color: INK }}
              >
                {time}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** YYYY-MM-DD in the given zone (or local when omitted). */
function dayKey(d: Date, timeZone?: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    ...(timeZone ? { timeZone } : {}),
  }).format(d);
}

/** Light glass card — rgba(255,255,255,0.40) + blur + white edge. */
function card(width: number, height: number, blurEnabled: boolean): CSSProperties {
  return {
    width,
    height,
    position: 'relative',
    borderRadius: 22,
    background: blurEnabled ? 'rgba(255,255,255,0.40)' : 'rgba(255,255,255,0.94)',
    backdropFilter: blurEnabled ? 'blur(24px) saturate(160%)' : undefined,
    WebkitBackdropFilter: blurEnabled ? 'blur(24px) saturate(160%)' : undefined,
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.28), 0 8px 28px rgba(0,0,0,0.16)',
    overflow: 'hidden',
  };
}
