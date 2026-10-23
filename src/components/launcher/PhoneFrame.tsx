'use client';

// Device frame: a 390×844 reference viewport, scaled to fit the window.
// Desktop: presented like a phone with an ambient wallpaper glow.
// Mobile-sized windows: edge-to-edge, no bezel.

import { useEffect, useState, type ReactNode } from 'react';
import { useLauncher } from '@/lib/launcher/store';
import { wallpaperCss } from './Wallpaper';

export const FRAME_W = 390;
export const FRAME_H = 844;

export function PhoneFrame({ children }: { children: ReactNode }) {
  const [scale, setScale] = useState(1);
  const [compact, setCompact] = useState(false);
  const wallpaper = useLauncher((s) => s.prefs.wallpaper);

  useEffect(() => {
    const fit = () => {
      const mobile = window.innerWidth < 500;
      setCompact(mobile);
      const pad = mobile ? 0 : 32;
      const s = Math.min(
        (window.innerHeight - pad) / FRAME_H,
        (window.innerWidth - pad) / FRAME_W,
        1,
      );
      setScale(Math.max(0.3, s));
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  return (
    <main
      className={`flex h-screen w-full items-center justify-center overflow-hidden bg-[#0b0b0d] ${compact ? '' : 'p-4'}`}
    >
      {/* ambient desktop backdrop — a blurred, enlarged echo of the wallpaper */}
      {!compact && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 scale-125 opacity-40 blur-3xl"
          style={wallpaperCss(wallpaper)}
        />
      )}
      <div
        className="relative"
        style={{
          width: FRAME_W * scale,
          height: FRAME_H * scale,
        }}
      >
        <div
          data-phone-frame
          className={`absolute left-0 top-0 origin-top-left overflow-hidden bg-black ${
            compact
              ? ''
              : 'rounded-[54px] border-[10px] border-[#1a1a1c] shadow-[0_40px_120px_rgba(0,0,0,0.65),inset_0_0_0_2px_rgba(255,255,255,0.08)]'
          }`}
          style={{
            width: FRAME_W,
            height: FRAME_H,
            transform: `scale(${scale})`,
            borderRadius: compact ? 0 : 54,
          }}
        >
          {/* dynamic island (desktop presentation only) */}
          {!compact && (
            <div className="absolute left-1/2 top-[10px] z-50 h-[26px] w-[104px] -translate-x-1/2 rounded-full bg-black" />
          )}
          {children}
        </div>
      </div>
    </main>
  );
}
