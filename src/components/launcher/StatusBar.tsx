'use client';

// iOS-style status bar: time on the left, signal/wifi/battery on the right.

import { useEffect, useState } from 'react';
import { Wifi } from 'lucide-react';
import { useLauncher } from '@/lib/launcher/store';

function formatTime(d: Date): string {
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12 === 0 ? 12 : h % 12;
  return `${h}:${m} ${suffix}`;
}

export function StatusBar() {
  const [now, setNow] = useState<Date | null>(null);
  const level = useLauncher((s) => s.batteryLevel);
  const charging = useLauncher((s) => s.batteryCharging);

  useEffect(() => {
    // async set (after hydration) to keep SSR/client markup consistent
    const t0 = setTimeout(() => setNow(new Date()), 0);
    const t = setInterval(() => setNow(new Date()), 15_000);
    return () => {
      clearTimeout(t0);
      clearInterval(t);
    };
  }, []);

  const pct = Math.round(level * 100);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 flex h-[54px] items-end justify-between px-7 pb-1 text-white">
      <span className="w-20 text-[15px] font-semibold tracking-tight" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
        {now ? formatTime(now) : '9:41 AM'}
      </span>
      <div className="flex items-center gap-1.5" aria-label="status icons">
        {/* cellular bars */}
        <svg width="18" height="12" viewBox="0 0 18 12" aria-hidden className="drop-shadow">
          <rect x="0" y="8" width="3" height="4" rx="1" fill="white" />
          <rect x="5" y="6" width="3" height="6" rx="1" fill="white" />
          <rect x="10" y="3.5" width="3" height="8.5" rx="1" fill="white" />
          <rect x="15" y="1" width="3" height="11" rx="1" fill="white" opacity="0.4" />
        </svg>
        <Wifi size={16} className="drop-shadow" strokeWidth={2.2} />
        {/* battery */}
        <div className="relative ml-0.5 flex h-[12px] w-[25px] items-center">
          <div
            className="h-[11px] w-[22px] rounded-[3.5px] border border-white/60 p-[1.5px]"
            aria-label={`battery ${pct}%`}
          >
            <div
              className="h-full rounded-[2px] bg-white transition-[width] duration-500"
              style={{
                width: `${Math.max(6, Math.min(100, pct))}%`,
                background: charging ? '#65C466' : undefined,
              }}
            />
          </div>
          <div className="absolute -right-[3px] h-[4px] w-[2px] rounded-r-sm bg-white/60" />
          {charging && (
            <svg width="9" height="10" viewBox="0 0 9 10" className="absolute left-[9px]">
              <path d="M5.2 0 0 5.6h3.4L3.6 10 9 4.3H5.4L5.2 0z" fill="#111" stroke="white" strokeWidth="0.7" />
            </svg>
          )}
        </div>
      </div>
    </div>
  );
}
