'use client';

// Battery widget — SVG charge ring.
// Recovered constants: low #EA4E3D (<20%), normal #65C466, black text.
// The ring animates via a CSS stroke-dashoffset transition; values come
// from the Battery Status API when available, else a simulated 78%.

import type { CSSProperties } from 'react';
import { useLauncher } from '@/lib/launcher/store';
import type { WidgetProps } from './registry';

const INK = '#1C1C1E';
const LOW = '#EA4E3D';
const OK = '#65C466';

export function BatteryWidget({ width, height }: WidgetProps) {
  const level = useLauncher((s) => s.batteryLevel);
  const charging = useLauncher((s) => s.batteryCharging);
  const blurEnabled = useLauncher((s) => s.prefs.blurEnabled);

  const pct = Math.max(0, Math.min(100, Math.round(level * 100)));
  const color = pct <= 20 ? LOW : OK;

  const ring = Math.max(64, Math.min(150, Math.min(width - 26, height - 58)));
  const stroke = Math.max(8, Math.round(ring * 0.082));
  const r = (ring - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div style={card(width, height, blurEnabled)}>
      <div className="flex h-full w-full flex-col items-center justify-center" style={{ padding: 12 }}>
        <div className="relative flex items-center justify-center" style={{ width: ring, height: ring }}>
          <svg width={ring} height={ring} viewBox={`0 0 ${ring} ${ring}`} aria-hidden>
            <circle
              cx={ring / 2}
              cy={ring / 2}
              r={r}
              fill="none"
              stroke="rgba(28,28,29,0.08)"
              strokeWidth={stroke}
            />
            <circle
              cx={ring / 2}
              cy={ring / 2}
              r={r}
              fill="none"
              stroke={color}
              strokeWidth={stroke}
              strokeLinecap="round"
              strokeDasharray={c}
              strokeDashoffset={c * (1 - pct / 100)}
              transform={`rotate(-90 ${ring / 2} ${ring / 2})`}
              style={{
                transition: 'stroke-dashoffset 0.8s cubic-bezier(0.2, 0, 0, 1), stroke 0.4s ease',
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="tabular-nums" style={{ fontSize: Math.round(ring * 0.24), fontWeight: 500, color: INK, lineHeight: 1 }}>
              {pct}
              <span style={{ fontSize: '0.55em', fontWeight: 500 }}>%</span>
            </span>
            {charging && (
              <span style={{ marginTop: 2 }}>
                <Bolt size={Math.round(ring * 0.12)} color={OK} />
              </span>
            )}
          </div>
        </div>
        <span
          style={{
            marginTop: 8,
            fontSize: 10.5,
            fontWeight: 500,
            color: 'rgba(60,60,67,0.55)',
            letterSpacing: '0.02em',
          }}
        >
          {charging ? 'Charging' : 'Battery'}
        </span>
      </div>
    </div>
  );
}

/** Slim charging bolt (original SVG, no binary asset). */
function Bolt({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size * 1.18} viewBox="0 0 34 40" aria-label="Charging" role="img">
      <path
        d="M19.5 0 L4 22 H14 L11 40 L30 15 H18.5 Z"
        fill={color}
        stroke="rgba(28,28,29,0.18)"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  );
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
