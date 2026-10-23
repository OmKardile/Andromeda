// /api/weather — open-meteo proxy with a deterministic mock fallback,
// so the launcher always renders plausible weather even when upstream is
// rate-limited or unreachable.
// NOTE: always returns temperatures in °C — clients convert via fmtTemp().

import { NextResponse } from 'next/server';
import type { CityDef, WeatherData } from '@/lib/launcher/types';

export const dynamic = 'force-dynamic';

// deterministic pseudo-random from a seed
function seeded(seed: number): () => number {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function mockWeather(city: CityDef): WeatherData {
  const rand = seeded(Math.round((city.lat + 1) * 97 + (city.lon + 1) * 31 + new Date().getDate()));
  const base = 18 + rand() * 12;
  const codes = [0, 1, 2, 3, 61, 80];
  const code = codes[Math.floor(rand() * codes.length)];
  const dayMs = 86_400_000;
  const now = new Date();
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now.getTime() + i * dayMs);
    return {
      date: d.toISOString().slice(0, 10),
      weatherCode: codes[Math.floor(rand() * codes.length)],
      max: Math.round(base + rand() * 6 - 2),
      min: Math.round(base - rand() * 6 - 2),
    };
  });
  const hours = Array.from({ length: 24 }, (_, i) => {
    const d = new Date(now.getTime() + i * 3_600_000);
    const h = d.getHours();
    const diurnal = Math.sin(((h - 4) / 24) * Math.PI * 2) * 5;
    return {
      time: d.toISOString(),
      temperature: Math.round(base + diurnal + rand() * 2),
      weatherCode: code,
    };
  });
  return {
    city,
    now: {
      temperature: Math.round(base),
      weatherCode: code,
      isDay: now.getHours() > 6 && now.getHours() < 19,
      windSpeed: Math.round(rand() * 22 + 2),
      humidity: Math.round(rand() * 40 + 40),
      apparentTemperature: Math.round(base - 1),
    },
    today: days[0],
    days,
    hours,
    fetchedAt: Date.now(),
    mock: true,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const lat = Number(url.searchParams.get('lat'));
  const lon = Number(url.searchParams.get('lon'));
  const name = url.searchParams.get('name') ?? 'Current location';
  const country = url.searchParams.get('country') ?? '';

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return NextResponse.json({ error: 'lat/lon required' }, { status: 400 });
  }

  const city: CityDef = { id: `${lat},${lon}`, name, country, lat, lon };

  try {
    const params = new URLSearchParams({
      latitude: String(lat),
      longitude: String(lon),
      current: 'temperature_2m,weather_code,is_day,wind_speed_10m,relative_humidity_2m,apparent_temperature',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min',
      hourly: 'temperature_2m,weather_code',
      forecast_days: '7',
      timezone: 'auto',
    });

    const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const raw = await res.json();

    const data: WeatherData = {
      city,
      now: {
        temperature: Math.round(raw.current?.temperature_2m ?? 0),
        weatherCode: raw.current?.weather_code ?? 0,
        isDay: raw.current?.is_day === 1,
        windSpeed: Math.round(raw.current?.wind_speed_10m ?? 0),
        humidity: Math.round(raw.current?.relative_humidity_2m ?? 0),
        apparentTemperature: Math.round(raw.current?.apparent_temperature ?? raw.current?.temperature_2m ?? 0),
      },
      today: {
        date: (raw.daily?.time?.[0] ?? new Date().toISOString().slice(0, 10)) as string,
        weatherCode: raw.daily?.weather_code?.[0] ?? 0,
        max: Math.round(raw.daily?.temperature_2m_max?.[0] ?? 0),
        min: Math.round(raw.daily?.temperature_2m_min?.[0] ?? 0),
      },
      days: (raw.daily?.time ?? []).map((d: string, i: number) => ({
        date: d,
        weatherCode: raw.daily.weather_code[i] ?? 0,
        max: Math.round(raw.daily.temperature_2m_max[i] ?? 0),
        min: Math.round(raw.daily.temperature_2m_min[i] ?? 0),
      })),
      hours: (raw.hourly?.time ?? []).slice(0, 24).map((t: string, i: number) => ({
        time: t,
        temperature: Math.round(raw.hourly.temperature_2m[i] ?? 0),
        weatherCode: raw.hourly.weather_code[i] ?? 0,
      })),
      fetchedAt: Date.now(),
    };
    if (data.days.length === 0) throw new Error('empty upstream payload');
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'public, max-age=1800' },
    });
  } catch {
    // graceful fallback — the widget stays alive with plausible data
    return NextResponse.json(mockWeather(city), {
      headers: { 'Cache-Control': 'no-store' },
    });
  }
}
