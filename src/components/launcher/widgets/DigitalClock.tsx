'use client';

// Digital clock — time, weekday + date and a small greeting.
// Premium dark glass card (rgba(28,28,29,0.65)) with white SF-style
// light typography. Re-renders via the store `tick`.

import type { CSSProperties } from 'react';
import { useLauncher } from '@/lib/launcher/store';
import type { WidgetProps } from './registry';

export function DigitalClock({ width, height }: WidgetProps) {
  useLauncher((s) => s.tick); // re-render every second
  const blurEnabled = useLauncher((s) => s.prefs.blurEnabled);

  const now = new Date();
  const parts = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(now);
  const hour = parts.find((p) => p.type === 'hour')?.value ?? '';
  const minute = parts.find((p) => p.type === 'minute')?.value ?? '';
  const meridiem = parts.find((p) => p.type === 'dayPeriod')?.value ?? '';

  const h = now.getHours();
  const greeting = h < 5 ? 'Good night' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  const showGreeting = height >= 118;
  const timeSize = Math.max(34, Math.min(64, Math.round(width * 0.175)));

  return (
    <div style={card(width, height, blurEnabled)}>
      <div
        className="flex h-full w-full flex-col justify-center"
        style={{ padding: `${Math.round(height * 0.12)}px ${Math.round(width * 0.07)}px` }}
      >
        {showGreeting && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.48)',
              marginBottom: 4,
            }}
          >
            {greeting}
          </span>
        )}
        <div className="flex items-baseline" style={{ gap: 8 }}>
          <span
            className="tabular-nums"
            style={{ fontSize: timeSize, fontWeight: 300, lineHeight: 1.02, letterSpacing: '-0.02em', color: '#FFFFFF' }}
          >
            {hour}:{minute}
          </span>
          {meridiem && (
            <span
              style={{ fontSize: Math.round(timeSize * 0.3), fontWeight: 400, color: 'rgba(255,255,255,0.58)' }}
            >
              {meridiem}
            </span>
          )}
        </div>
        <span
          style={{
            marginTop: 5,
            fontSize: Math.max(11, Math.min(13.5, Math.round(width * 0.036))),
            fontWeight: 400,
            color: 'rgba(255,255,255,0.70)',
          }}
        >
          {now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
        </span>
      </div>
    </div>
  );
}

/** Dark glass card (rgba(28,28,29,0.65) + blur(24px) saturate(160%)). */
function card(width: number, height: number, blurEnabled: boolean): CSSProperties {
  return {
    width,
    height,
    position: 'relative',
    borderRadius: 22,
    background: blurEnabled ? 'rgba(28,28,29,0.65)' : '#1C1C1D',
    backdropFilter: blurEnabled ? 'blur(24px) saturate(160%)' : undefined,
    WebkitBackdropFilter: blurEnabled ? 'blur(24px) saturate(160%)' : undefined,
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.14), 0 8px 28px rgba(0,0,0,0.20)',
    overflow: 'hidden',
  };
}
