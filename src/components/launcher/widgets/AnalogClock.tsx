'use client';

// Analog clock — the hero widget.
// Recovered spec: clock card uses a static dark background #1C1C1D with a
// white clock face, black hour/minute hands and a slim red second hand.
// Re-renders are driven by the store's 1-second `tick` — no local timers.

import type { CSSProperties } from 'react';
import { useLauncher } from '@/lib/launcher/store';
import type { WidgetProps } from './registry';

const INK = '#1C1C1E';
const RED = '#FF3B30';

export function AnalogClock({ width, height }: WidgetProps) {
  useLauncher((s) => s.tick); // re-render every second
  const blurEnabled = useLauncher((s) => s.prefs.blurEnabled);

  const now = new Date();
  const pad = Math.max(10, Math.round(Math.min(width, height) * 0.085));
  const dial = Math.min(width - pad * 2, height - pad * 2);
  const showDate = width - pad * 2 - dial > dial * 0.62;

  return (
    <div style={darkCard(width, height, blurEnabled)}>
      <div
        className="flex h-full w-full items-center"
        style={{ padding: pad, gap: Math.round(dial * 0.16) }}
      >
        <Dial size={dial} now={now} />
        {showDate && (
          <div className="flex min-w-0 flex-1 flex-col justify-center" style={{ color: '#FFFFFF' }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                letterSpacing: '0.22em',
                opacity: 0.5,
                textTransform: 'uppercase',
              }}
            >
              {now.toLocaleDateString('en-US', { weekday: 'long' })}
            </span>
            <span
              className="tabular-nums"
              style={{ fontSize: Math.min(58, Math.round(dial * 0.44)), fontWeight: 300, lineHeight: 1.08 }}
            >
              {now.getDate()}
            </span>
            <span style={{ fontSize: 12.5, fontWeight: 500, opacity: 0.72 }}>
              {now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/** Dark glass card — the clock's static #1C1C1D background per the spec. */
function darkCard(width: number, height: number, blurEnabled: boolean): CSSProperties {
  return {
    width,
    height,
    position: 'relative',
    borderRadius: 22,
    background: blurEnabled
      ? 'linear-gradient(180deg, rgba(44,44,46,0.72), rgba(26,26,28,0.80))'
      : 'linear-gradient(180deg, #2C2C2E, #1A1A1C)',
    backdropFilter: blurEnabled ? 'blur(24px) saturate(160%)' : undefined,
    WebkitBackdropFilter: blurEnabled ? 'blur(24px) saturate(160%)' : undefined,
    boxShadow:
      'inset 0 0 0 1px rgba(255,255,255,0.14), 0 8px 28px rgba(0,0,0,0.22)',
    overflow: 'hidden',
  };
}

/** The white dial — pure SVG, no binary assets (GPL standing decision). */
function Dial({ size, now }: { size: number; now: Date }) {
  const sec = now.getSeconds() + now.getMilliseconds() / 1000;
  const min = now.getMinutes() + sec / 60;
  const hr = (now.getHours() % 12) + min / 60;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      aria-label="Analog clock"
      role="img"
      style={{ display: 'block', flexShrink: 0, filter: 'drop-shadow(0 3px 9px rgba(0,0,0,0.32))' }}
    >
      <defs>
        <radialGradient id="clock-face" cx="0.5" cy="0.4" r="0.78">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="72%" stopColor="#FBFAF7" />
          <stop offset="100%" stopColor="#ECEAE4" />
        </radialGradient>
      </defs>

      {/* face + rim */}
      <circle cx="100" cy="100" r="97" fill="url(#clock-face)" stroke="rgba(28,28,29,0.10)" strokeWidth="2" />

      {/* 60 tick marks — 12 majors */}
      {Array.from({ length: 60 }, (_, i) => {
        const major = i % 5 === 0;
        const a = (i * 6 * Math.PI) / 180;
        const r1 = major ? 73.5 : 79;
        const r2 = 84;
        return (
          <line
            key={i}
            x1={100 + r1 * Math.sin(a)}
            y1={100 - r1 * Math.cos(a)}
            x2={100 + r2 * Math.sin(a)}
            y2={100 - r2 * Math.cos(a)}
            stroke={INK}
            strokeOpacity={major ? 0.85 : 0.22}
            strokeWidth={major ? 3.6 : 2}
            strokeLinecap="round"
          />
        );
      })}

      {size >= 118 && (
        <text
          x="100"
          y="152"
          textAnchor="middle"
          fontSize="8"
          fontWeight="600"
          letterSpacing="2.6"
          fill={INK}
          fillOpacity="0.32"
          fontFamily="inherit"
        >
          ANDROMEDA
        </text>
      )}

      {/* hour hand with counterweight tail */}
      <g transform={`rotate(${hr * 30} 100 100)`}>
        <line x1="100" y1="113" x2="100" y2="42" stroke={INK} strokeWidth="7.6" strokeLinecap="round" />
      </g>
      {/* minute hand */}
      <g transform={`rotate(${min * 6} 100 100)`}>
        <line x1="100" y1="116" x2="100" y2="22" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      </g>
      {/* slim red second hand + counterweight */}
      <g transform={`rotate(${sec * 6} 100 100)`}>
        <line x1="100" y1="124" x2="100" y2="15" stroke={RED} strokeWidth="2.2" strokeLinecap="round" />
        <circle cx="100" cy="115" r="5" fill={RED} />
      </g>
      {/* center cap */}
      <circle cx="100" cy="100" r="5.4" fill={INK} />
      <circle cx="100" cy="100" r="2" fill="#FFFFFF" />
    </svg>
  );
}
