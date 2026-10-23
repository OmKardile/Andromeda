'use client';

// Weather client — talks to /api/weather (open-meteo proxy) and falls back to
// a deterministic mock when upstream is rate-limited or offline.

import type { CityDef, WeatherData } from './types';

export async function fetchWeather(city: CityDef, unit: 'C' | 'F'): Promise<WeatherData> {
  const params = new URLSearchParams({
    lat: String(city.lat),
    lon: String(city.lon),
    name: city.name,
    country: city.country,
    unit,
  });
  const res = await fetch(`/api/weather?${params.toString()}`);
  if (!res.ok) throw new Error(`weather ${res.status}`);
  const data = (await res.json()) as WeatherData;
  return data;
}

export function cToF(c: number): number {
  return (c * 9) / 5 + 32;
}

export function fmtTemp(c: number, unit: 'C' | 'F'): string {
  const v = Math.round(unit === 'C' ? c : cToF(c));
  return `${v}°`;
}

/** WMO weather code -> { label, emoji-ish glyph } — drawn from the spec. */
export function wmoInfo(code: number, isDay = true): { label: string; glyph: string } {
  const map: Record<number, [string, string]> = {
    0: ['Clear sky', 'sun'],
    1: ['Mainly clear', 'sun'],
    2: ['Partly cloudy', 'cloud-sun'],
    3: ['Overcast', 'cloud'],
    45: ['Fog', 'cloud-fog'],
    48: ['Rime fog', 'cloud-fog'],
    51: ['Light drizzle', 'cloud-drizzle'],
    53: ['Drizzle', 'cloud-drizzle'],
    55: ['Heavy drizzle', 'cloud-drizzle'],
    61: ['Light rain', 'cloud-rain'],
    63: ['Rain', 'cloud-rain'],
    65: ['Heavy rain', 'cloud-rain'],
    71: ['Light snow', 'cloud-snow'],
    73: ['Snow', 'cloud-snow'],
    75: ['Heavy snow', 'cloud-snow'],
    77: ['Snow grains', 'cloud-snow'],
    80: ['Rain showers', 'cloud-rain'],
    81: ['Rain showers', 'cloud-rain'],
    82: ['Violent showers', 'cloud-rain'],
    85: ['Snow showers', 'cloud-snow'],
    86: ['Snow showers', 'cloud-snow'],
    95: ['Thunderstorm', 'cloud-lightning'],
    96: ['Thunderstorm, hail', 'cloud-lightning'],
    99: ['Thunderstorm, hail', 'cloud-lightning'],
  };
  const [label, glyph] = map[code] ?? ['Unknown', 'cloud'];
  return { label: isDay ? label : `${label} · night`, glyph };
}
