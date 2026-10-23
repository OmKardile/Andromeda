'use client';

// Weather widget — current conditions, hourly strip and forecast.
// Recovered constants: padding 2dp small / 12dp text variants, temps like
// "24°", "H:"/"L:" labels, iOS-Weather-style range bars. All glyphs are
// original inline SVG (no binary assets) mapped from wmoInfo(code).glyph.

import type { CSSProperties, ReactNode } from 'react';
import { useLauncher } from '@/lib/launcher/store';
import { fmtTemp, wmoInfo } from '@/lib/launcher/weather';
import type { WeatherData, WeatherHour } from '@/lib/launcher/types';
import type { WidgetProps } from './registry';

const INK = '#1C1C1E';
const MUTED = 'rgba(60,60,67,0.55)';
const SUN = '#FFB340';
const SUN_RAY = '#FF9F0A';
const CLOUD_EDGE = '#B7C3CC';
const RAIN = '#3FA8DC';
const SNOW = '#7ED0E8';
const FOG = '#9FB0BC';
const HAIRLINE = 'rgba(28,28,29,0.08)';

export function WeatherWidget({ width, height }: WidgetProps) {
  const weather = useLauncher((s) => s.weather);
  const unit = useLauncher((s) => s.prefs.tempUnit);
  const blurEnabled = useLauncher((s) => s.prefs.blurEnabled);

  // /api/weather always returns °C; fmtTemp converts to the preferred unit.
  const fmt = (v: number) => fmtTemp(v, unit);

  if (!weather) return <LoadingCard width={width} height={height} blurEnabled={blurEnabled} />;

  const tall = height > 235; // 4×4 layout
  const now = wmoInfo(weather.now.weatherCode, weather.now.isDay);
  const today = wmoInfo(weather.today.weatherCode, true);

  return (
    <div style={card(width, height, blurEnabled)}>
      {weather.mock && <MockBadge />}
      {tall ? (
        <FullLayout weather={weather} fmt={fmt} nowGlyph={now} todayGlyph={today} />
      ) : (
        <SmallLayout weather={weather} fmt={fmt} nowGlyph={now} />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Small (4×2): current on the left, next 4 hours on the right
// ---------------------------------------------------------------------------

function SmallLayout({
  weather,
  fmt,
  nowGlyph,
}: {
  weather: WeatherData;
  fmt: (v: number) => string;
  nowGlyph: { label: string; glyph: string };
}) {
  const hours = upcomingHours(weather.hours, 4);
  return (
    <div className="flex h-full w-full" style={{ padding: '12px 16px', gap: 14 }}>
      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <span className="truncate" style={{ fontSize: 12.5, fontWeight: 600, color: INK }}>
          {weather.city.name}
        </span>
        <div className="flex items-center" style={{ gap: 8, marginTop: 2 }}>
          <WeatherGlyph glyph={nowGlyph.glyph} size={38} />
          <span className="tabular-nums" style={{ fontSize: 48, fontWeight: 300, lineHeight: 1.05, color: INK, letterSpacing: '-0.02em' }}>
            {fmt(weather.now.temperature)}
          </span>
        </div>
        <span className="truncate" style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>
          {nowGlyph.label}
        </span>
        <div className="tabular-nums" style={{ fontSize: 12, marginTop: 3, color: INK }}>
          <span style={{ color: MUTED }}>H:</span>{' '}
          <span style={{ fontWeight: 600 }}>{fmt(weather.today.max)}</span>
          <span style={{ color: MUTED }}>{'  L:'}</span>{' '}
          <span style={{ fontWeight: 600 }}>{fmt(weather.today.min)}</span>
        </div>
      </div>
      <div className="flex flex-col justify-center" style={{ width: 118 }}>
        {hours.map((h, i) => (
          <div
            key={h.time}
            className="flex items-center"
            style={{
              gap: 6,
              padding: '3.5px 2px',
              borderTop: i === 0 ? undefined : `1px solid ${HAIRLINE}`,
            }}
          >
            <span style={{ fontSize: 9.5, fontWeight: 500, color: MUTED, width: 26 }}>
              {i === 0 ? 'Now' : hourLabel(h)}
            </span>
            <WeatherGlyph glyph={wmoInfo(h.weatherCode, true).glyph} size={17} />
            <span className="tabular-nums" style={{ fontSize: 11.5, fontWeight: 600, color: INK, marginLeft: 'auto' }}>
              {fmt(h.temperature)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Full (4×4): current + 8-hour strip + 5-day forecast with range bars
// ---------------------------------------------------------------------------

function FullLayout({
  weather,
  fmt,
  nowGlyph,
  todayGlyph,
}: {
  weather: WeatherData;
  fmt: (v: number) => string;
  nowGlyph: { label: string; glyph: string };
  todayGlyph: { label: string; glyph: string };
}) {
  const hours = upcomingHours(weather.hours, 8);
  const days = weather.days.slice(0, 5);
  const weekMin = Math.min(...days.map((d) => d.min));
  const weekMax = Math.max(...days.map((d) => d.max));
  const range = Math.max(1, weekMax - weekMin);

  return (
    <div className="flex h-full w-full flex-col" style={{ padding: '14px 16px' }}>
      {/* current */}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <span className="truncate" style={{ fontSize: 13, fontWeight: 600, color: INK }}>
            {weather.city.name}
          </span>
          <div className="flex items-center" style={{ gap: 10, marginTop: 1 }}>
            <WeatherGlyph glyph={nowGlyph.glyph} size={34} />
            <span className="tabular-nums" style={{ fontSize: 46, fontWeight: 300, lineHeight: 1.04, color: INK, letterSpacing: '-0.02em' }}>
              {fmt(weather.now.temperature)}
            </span>
          </div>
          <span className="truncate" style={{ fontSize: 11.5, color: MUTED }}>
            {nowGlyph.label} · H:{fmt(weather.today.max)} L:{fmt(weather.today.min)}
          </span>
        </div>
        <div className="tabular-nums text-right" style={{ fontSize: 9.5, color: MUTED, lineHeight: 1.6, paddingTop: 2 }}>
          <div>{weather.now.windSpeed} km/h wind</div>
          <div>{weather.now.humidity}% humidity</div>
          <div>Feels {fmt(weather.now.apparentTemperature)}</div>
        </div>
      </div>

      {/* 8-hour strip */}
      <div
        className="flex items-end justify-between"
        style={{ borderTop: `1px solid ${HAIRLINE}`, borderBottom: `1px solid ${HAIRLINE}`, padding: '7px 0', marginTop: 9 }}
      >
        {hours.map((h, i) => (
          <div key={h.time} className="flex flex-col items-center" style={{ gap: 2 }}>
            <span style={{ fontSize: 9.5, fontWeight: 500, color: MUTED }}>
              {i === 0 ? 'Now' : hourLabel(h)}
            </span>
            <WeatherGlyph glyph={wmoInfo(h.weatherCode, true).glyph} size={16} />
            <span className="tabular-nums" style={{ fontSize: 10.5, fontWeight: 600, color: INK }}>
              {fmt(h.temperature)}
            </span>
          </div>
        ))}
      </div>

      {/* 5-day forecast */}
      <div className="flex flex-1 flex-col" style={{ paddingTop: 7, gap: 4 }}>
        {days.map((d, i) => {
          const left = ((d.min - weekMin) / range) * 100;
          const w = ((d.max - d.min) / range) * 100;
          const nowPct = Math.max(0, Math.min(100, ((weather.now.temperature - weekMin) / range) * 100));
          const label =
            i === 0
              ? 'Today'
              : new Date(`${d.date}T12:00:00`).toLocaleDateString('en-US', { weekday: 'short' });
          return (
            <div key={d.date} className="flex flex-1 items-center" style={{ gap: 7 }}>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: INK, width: 36 }}>{label}</span>
              <WeatherGlyph glyph={(i === 0 ? todayGlyph : wmoInfo(d.weatherCode, true)).glyph} size={14} />
              <span className="tabular-nums" style={{ fontSize: 10, color: MUTED, width: 22, textAlign: 'right' }}>
                {fmt(d.min)}
              </span>
              <div className="relative flex-1" style={{ height: 4, borderRadius: 999, background: 'rgba(28,28,29,0.08)' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: `${left}%`,
                    width: `${Math.max(w, 7)}%`,
                    top: 0,
                    bottom: 0,
                    borderRadius: 999,
                    background: 'linear-gradient(90deg, #57C7E3, #FFB648)',
                  }}
                />
                {i === 0 && (
                  <span
                    style={{
                      position: 'absolute',
                      left: `calc(${nowPct}% - 4px)`,
                      top: -2,
                      width: 8,
                      height: 8,
                      borderRadius: 999,
                      background: '#FFFFFF',
                      boxShadow: '0 0 0 1.5px rgba(0,0,0,0.18)',
                    }}
                  />
                )}
              </div>
              <span className="tabular-nums" style={{ fontSize: 10.5, fontWeight: 600, color: INK, width: 22 }}>
                {fmt(d.max)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Shared bits
// ---------------------------------------------------------------------------

/** Hours starting at the current hour ("Now" is the first). */
function upcomingHours(hours: WeatherHour[], count: number): WeatherHour[] {
  const cutoff = Date.now() - 45 * 60_000;
  return hours.filter((h) => new Date(h.time).getTime() >= cutoff).slice(0, count);
}

function hourLabel(h: WeatherHour): string {
  const hr = new Date(h.time).getHours();
  const h12 = hr % 12 === 0 ? 12 : hr % 12;
  return `${h12}${hr < 12 ? 'AM' : 'PM'}`;
}

function MockBadge(): ReactNode {
  return (
    <span
      style={{
        position: 'absolute',
        top: 8,
        right: 10,
        zIndex: 2,
        fontSize: 8,
        fontWeight: 700,
        letterSpacing: '0.09em',
        color: 'rgba(255,255,255,0.92)',
        background: 'rgba(28,28,29,0.38)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        borderRadius: 999,
        padding: '2px 7px',
        pointerEvents: 'none',
      }}
    >
      DEMO DATA
    </span>
  );
}

/** Glass shimmer while the first fetch is in flight. */
function LoadingCard({ width, height, blurEnabled }: { width: number; height: number; blurEnabled: boolean }) {
  return (
    <div style={card(width, height, blurEnabled)}>
      <div className="flex h-full w-full flex-col items-center justify-center" style={{ gap: 9 }}>
        <div className="animate-pulse">
          <WeatherGlyph glyph="sun" size={36} />
        </div>
        <span className="animate-pulse" style={{ fontSize: 12, fontWeight: 500, color: MUTED }}>
          Fetching weather…
        </span>
        <div
          className="animate-pulse"
          style={{ width: Math.min(150, width * 0.45), height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.55)' }}
        />
      </div>
    </div>
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

// ---------------------------------------------------------------------------
// Weather glyphs — original inline SVGs, no emoji, no copied assets
// ---------------------------------------------------------------------------

export function WeatherGlyph({ glyph, size = 24 }: { glyph: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 64 64',
    'aria-hidden': true as const,
    style: { display: 'block', flexShrink: 0 } as CSSProperties,
  };
  switch (glyph) {
    case 'sun':
      return (
        <svg {...common}>
          <Rays cx={32} cy={32} r1={17.5} r2={23} color={SUN_RAY} />
          <circle cx={32} cy={32} r={11.5} fill={SUN} stroke={SUN_RAY} strokeWidth={1.5} />
        </svg>
      );
    case 'cloud-sun':
      return (
        <svg {...common}>
          <Rays cx={45} cy={19} r1={10} r2={14.5} color={SUN_RAY} />
          <circle cx={45} cy={19} r={7} fill={SUN} stroke={SUN_RAY} strokeWidth={1.2} />
          <Cloud cx={28} cy={38} s={0.92} />
        </svg>
      );
    case 'cloud-fog':
      return (
        <svg {...common}>
          <Cloud cx={32} cy={28} s={0.95} />
          <g stroke={FOG} strokeWidth={3.2} strokeLinecap="round">
            <line x1={19} y1={46} x2={45} y2={46} />
            <line x1={23} y1={53} x2={41} y2={53} />
          </g>
        </svg>
      );
    case 'cloud-drizzle':
      return (
        <svg {...common}>
          <Cloud cx={32} cy={28} s={0.95} />
          <g stroke={RAIN} strokeWidth={2.6} strokeLinecap="round">
            <line x1={23} y1={42} x2={21.5} y2={48} />
            <line x1={32} y1={44} x2={30.5} y2={50} />
            <line x1={41} y1={42} x2={39.5} y2={48} />
          </g>
        </svg>
      );
    case 'cloud-snow':
      return (
        <svg {...common}>
          <Cloud cx={32} cy={27} s={0.95} />
          <Flake cx={22} cy={46} />
          <Flake cx={32} cy={51} />
          <Flake cx={42} cy={46} />
        </svg>
      );
    case 'cloud-lightning':
      return (
        <svg {...common}>
          <Cloud cx={32} cy={26} s={0.98} />
          <path d="M33,36 L23,50 H29.5 L27,59 L40,46 H33.5 Z" fill={SUN} stroke={SUN_RAY} strokeWidth={1.2} strokeLinejoin="round" />
        </svg>
      );
    case 'cloud-rain':
      return (
        <svg {...common}>
          <Cloud cx={32} cy={25} s={0.98} />
          <g stroke={RAIN} strokeWidth={3} strokeLinecap="round">
            <line x1={23} y1={40} x2={20} y2={51} />
            <line x1={32} y1={42} x2={29} y2={53} />
            <line x1={41} y1={40} x2={38} y2={51} />
          </g>
        </svg>
      );
    case 'cloud':
    default:
      return (
        <svg {...common}>
          <Cloud cx={32} cy={33} s={1} />
        </svg>
      );
  }
}

/** Eight rays around a center. */
function Rays({ cx, cy, r1, r2, color }: { cx: number; cy: number; r1: number; r2: number; color: string }) {
  return (
    <g stroke={color} strokeWidth={3} strokeLinecap="round">
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i * 45 * Math.PI) / 180;
        return (
          <line
            key={i}
            x1={cx + r1 * Math.sin(a)}
            y1={cy - r1 * Math.cos(a)}
            x2={cx + r2 * Math.sin(a)}
            y2={cy - r2 * Math.cos(a)}
          />
        );
      })}
    </g>
  );
}

/** Cloud silhouette — stroke pass then fill pass keeps the union clean. */
function Cloud({ cx, cy, s }: { cx: number; cy: number; s: number }) {
  const shapes = (fill: string, stroke?: string) => (
    <g fill={fill} stroke={stroke} strokeWidth={stroke ? 3.4 : undefined} strokeLinejoin="round">
      <circle cx={cx - 13 * s} cy={cy + 3 * s} r={11 * s} />
      <circle cx={cx + 3 * s} cy={cy - 2 * s} r={15 * s} />
      <circle cx={cx + 15 * s} cy={cy + 4 * s} r={9.5 * s} />
      <rect x={cx - 14 * s} y={cy + 2 * s} width={30 * s} height={11 * s} rx={5.5 * s} />
    </g>
  );
  return (
    <>
      {shapes('none', CLOUD_EDGE)}
      {shapes('#FFFFFF')}
    </>
  );
}

/** Six-point snowflake. */
function Flake({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g stroke={SNOW} strokeWidth={1.9} strokeLinecap="round">
      <line x1={cx} y1={cy - 3.2} x2={cx} y2={cy + 3.2} />
      <line x1={cx - 2.77} y1={cy - 1.6} x2={cx + 2.77} y2={cy + 1.6} />
      <line x1={cx - 2.77} y1={cy + 1.6} x2={cx + 2.77} y2={cy - 1.6} />
    </g>
  );
}
