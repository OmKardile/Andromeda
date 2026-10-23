'use client';

// Weather — iOS-weather-style detail screen: city + big thin temperature,
// condition, H:L, horizontally scrolling hourly strip, 7-day forecast with
// min–max range bars, Open-Meteo attribution. Glyphs are inline SVG via
// lucide (no emoji characters). Falls back to a skeleton while loading.

import type { ComponentType } from 'react';
import {
  ChevronLeft,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Sun,
} from 'lucide-react';
import { useLauncher } from '@/lib/launcher/store';
import { fetchWeather, fmtTemp, wmoInfo } from '@/lib/launcher/weather';

type GlyphProps = { size?: number | string; strokeWidth?: number; className?: string };

const GLYPHS: Record<string, ComponentType<GlyphProps>> = {
  sun: Sun,
  'cloud-sun': CloudSun,
  cloud: Cloud,
  'cloud-fog': CloudFog,
  'cloud-drizzle': CloudDrizzle,
  'cloud-rain': CloudRain,
  'cloud-snow': CloudSnow,
  'cloud-lightning': CloudLightning,
};

function Glyph({ name, size = 24 }: { name: string; size?: number }) {
  const C = GLYPHS[name] ?? Cloud;
  return <C size={size} strokeWidth={1.6} aria-hidden />;
}

function dayLabel(dateStr: string, index: number): string {
  if (index === 0) return 'Today';
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString('en-US', { weekday: 'short' });
}

function hourLabel(timeStr: string, index: number): string {
  if (index === 0) return 'Now';
  return new Date(timeStr).toLocaleTimeString('en-US', { hour: 'numeric' });
}

function WeatherSkeleton() {
  return (
    <div
      className="flex min-h-0 flex-1 flex-col bg-gradient-to-b from-[#2C2C2E] to-[#1C1C1E]"
      aria-label="Loading weather"
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 pt-[58px]">
        <div className="h-7 w-32 animate-pulse rounded-full bg-white/15" />
        <div className="h-20 w-44 animate-pulse rounded-2xl bg-white/10" />
        <div className="h-5 w-40 animate-pulse rounded-full bg-white/10" />
        <div className="mt-6 flex w-full gap-3">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-20 flex-1 animate-pulse rounded-2xl bg-white/10" />
          ))}
        </div>
        <div className="mt-4 h-40 w-full animate-pulse rounded-2xl bg-white/[0.07]" />
      </div>
    </div>
  );
}

export function WeatherApp() {
  const weather = useLauncher((s) => s.weather);
  const setWeather = useLauncher((s) => s.setWeather);
  const prefs = useLauncher((s) => s.prefs);

  if (!weather) return <WeatherSkeleton />;

  // weather data is ALWAYS in °C — convert for display per the prefs unit
  const temp = (v: number) => fmtTemp(v, prefs.tempUnit);

  const isDay = weather.now.isDay;
  const info = wmoInfo(weather.now.weatherCode, isDay);
  const days = weather.days.slice(0, 7);
  const weekMin = Math.min(...days.map((d) => d.min));
  const weekMax = Math.max(...days.map((d) => d.max));
  const span = Math.max(1, weekMax - weekMin);
  const nowTemp = weather.now.temperature;

  return (
    <div
      className="launcher-scroll flex min-h-0 flex-1 flex-col overflow-y-auto"
      style={{
        background: isDay
          ? 'linear-gradient(180deg, #2FA8C4 0%, #7FD4E8 100%)'
          : 'linear-gradient(180deg, #1C1C1E 0%, #3A3A3C 100%)',
      }}
      aria-label={`Weather for ${weather.city.name}`}
    >
      {/* back to home */}
      <button
        type="button"
        onClick={() => useLauncher.getState().closeOverlay()}
        className="absolute left-3 top-[62px] z-10 flex h-11 w-11 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md active:bg-black/35"
        aria-label="Back to home"
      >
        <ChevronLeft size={22} />
      </button>

      <div className="flex flex-col px-5 pb-8 pt-[70px] text-white">
        {/* header */}
        <h1 className="text-center text-[32px] font-medium">{weather.city.name}</h1>
        <div className="mt-1 text-center text-[84px] font-thin leading-none tabular-nums">
          {temp(nowTemp)}
        </div>
        <div className="mt-1 text-center text-[17px] text-white/85">{info.label}</div>
        <div className="text-center text-[17px] font-medium text-white/85">
          H:{temp(weather.today.max)} L:{temp(weather.today.min)}
        </div>

        {/* hourly strip */}
        <div className="mt-6 rounded-[18px] border border-white/15 bg-white/10 px-2 py-2 backdrop-blur-sm">
          <div className="launcher-scroll flex gap-1 overflow-x-auto">
            {weather.hours.slice(0, 8).map((h, i) => (
              <div
                key={h.time}
                className="flex w-[62px] shrink-0 flex-col items-center gap-1.5 rounded-xl py-2"
              >
                <span className="text-[13px] font-medium text-white/85">{hourLabel(h.time, i)}</span>
                <Glyph name={wmoInfo(h.weatherCode, isDay).glyph} size={22} />
                <span className="text-[17px] font-semibold tabular-nums">{temp(h.temperature)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 7-day forecast */}
        <div className="mt-5 rounded-[18px] border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
          {days.map((d, i) => {
            const left = ((d.min - weekMin) / span) * 100;
            const width = ((d.max - d.min) / span) * 100;
            const isToday = i === 0;
            const nowPos = Math.min(100, Math.max(0, ((nowTemp - weekMin) / span) * 100));
            return (
              <div key={d.date} className="relative flex items-center gap-2 py-[7px]">
                {i > 0 && <span className="absolute inset-x-0 top-0 h-px bg-white/15" aria-hidden />}
                <span className="w-12 text-[15px] font-medium">{dayLabel(d.date, i)}</span>
                <Glyph name={wmoInfo(d.weatherCode, true).glyph} size={20} />
                <span className="w-9 text-right text-[15px] tabular-nums text-white/60">
                  {temp(d.min)}
                </span>
                <div className="relative h-[5px] flex-1 rounded-full bg-white/20">
                  <div
                    className="absolute top-0 h-full rounded-full"
                    style={{
                      left: `${left}%`,
                      width: `${Math.max(width, 6)}%`,
                      background: 'linear-gradient(90deg, #63C7F2, #F5D653, #F0854B)',
                    }}
                  />
                  {isToday && (
                    <span
                      className="absolute top-1/2 h-[11px] w-[11px] -translate-y-1/2 rounded-full border-2 border-[#4FBAD0] bg-white"
                      style={{ left: `calc(${nowPos}% - 5.5px)` }}
                      aria-label="Current temperature"
                    />
                  )}
                </div>
                <span className="w-9 text-right text-[15px] font-medium tabular-nums">
                  {temp(d.max)}
                </span>
              </div>
            );
          })}
        </div>

        {/* footer */}
        <div className="mt-6 flex items-center justify-center gap-2">
          <p className="text-[12px] text-white/60">Powered by Open-Meteo</p>
          {weather.mock && (
            <span className="rounded-full border border-white/25 bg-white/10 px-2 py-[2px] text-[10px] font-semibold uppercase tracking-wide text-white/75">
              demo data
            </span>
          )}
        </div>
        <button
          type="button"
          className="mx-auto mt-3 flex h-9 items-center rounded-full bg-white/15 px-4 text-[13px] font-semibold text-white active:bg-white/25"
          onClick={async () => {
            try {
              setWeather(await fetchWeather(prefs.city, prefs.tempUnit));
            } catch {
              // keep showing whatever we already have
            }
          }}
          aria-label="Refresh weather"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
