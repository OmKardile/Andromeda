'use client';

// Wallpaper picker sheet: photos, gradients, solids. (Emoji drawer arrives
// with the wallpaper engine module — see EMOJI tab stub.)

import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useLauncher } from '@/lib/launcher/store';
import {
  GRADIENT_PRESETS,
  PHOTOS,
  SOLID_COLORS,
  WALLPAPER_IMAGES,
} from '@/lib/launcher/storage';
import { MOTION, glassStyle } from '@/lib/launcher/glass';
import { EmojiWallpaperTab } from './EmojiWallpaperTab';

const TABS = ['Photos', 'Gradients', 'Solid', 'Emoji'] as const;

export function WallpaperPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const wallpaper = useLauncher((s) => s.prefs.wallpaper);
  const setPrefs = useLauncher((s) => s.setPrefs);
  const [tab, setTab] = useState<(typeof TABS)[number]>('Photos');

  if (!open) return null;

  const apply = (w: typeof wallpaper) => {
    setPrefs({ wallpaper: w });
    onClose();
  };

  const currentKey = (w: typeof wallpaper) =>
    w.type === 'image' ? w.src : w.type === 'solid' ? w.color : w.type === 'gradient' ? w.from + w.to : 'emoji';

  return (
    <div className="absolute inset-0 z-[70] flex items-end" role="dialog" aria-label="Wallpaper picker">
      <button
        className="absolute inset-0 bg-black/45"
        style={{ backdropFilter: 'blur(6px)' }}
        onClick={onClose}
        aria-label="Close"
      />
      <div
        className="relative w-full rounded-t-[28px] bg-[#1c1c1e]/95 px-5 pb-8 pt-4 text-white"
        style={{
          animation: `sheetUp ${MOTION.sheetMs}ms cubic-bezier(0.2,0,0,1)`,
          backdropFilter: 'blur(30px)',
        }}
      >
        <style>{`@keyframes sheetUp { from { transform: translateY(100%);} to { transform: translateY(0);} }`}</style>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/30" />
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Wallpaper</h2>
          <button className="rounded-full bg-white/15 p-1.5" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* tabs */}
        <div className="mb-4 flex gap-1 rounded-full bg-white/10 p-1" role="tablist">
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              className={`flex-1 rounded-full py-1.5 text-xs font-semibold transition-colors ${
                tab === t ? 'bg-white text-black' : 'text-white/70'
              }`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === 'Photos' && (
          <div className="grid max-h-[380px] grid-cols-3 gap-2 overflow-y-auto">
            {[...WALLPAPER_IMAGES, ...PHOTOS].map((src) => (
              <button
                key={src}
                className="relative aspect-[9/16] overflow-hidden rounded-xl"
                style={{
                  backgroundImage: `url(${src})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  outline: currentKey({ type: 'image', src }) === src ? '2px solid #fff' : undefined,
                  outlineOffset: 2,
                }}
                onClick={() => apply({ type: 'image', src })}
                aria-label={`Wallpaper ${src}`}
              >
                {wallpaper.type === 'image' && wallpaper.src === src && (
                  <span className="absolute bottom-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-black">
                    <Check size={12} strokeWidth={3} />
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {tab === 'Gradients' && (
          <div className="grid max-h-[380px] grid-cols-3 gap-2 overflow-y-auto">
            {GRADIENT_PRESETS.map((g) => (
              <button
                key={g.from + g.to}
                className="relative aspect-[9/16] rounded-xl"
                style={{
                  background: `linear-gradient(165deg, ${g.from}, ${g.to})`,
                  outline:
                    currentKey({ type: 'gradient', from: g.from, to: g.to }) === g.from + g.to
                      ? '2px solid #fff'
                      : undefined,
                  outlineOffset: 2,
                }}
                onClick={() => apply({ type: 'gradient', ...g })}
                aria-label={`Gradient ${g.from}`}
              />
            ))}
          </div>
        )}

        {tab === 'Solid' && (
          <div className="grid max-h-[380px] grid-cols-6 gap-2 overflow-y-auto">
            {SOLID_COLORS.map((c) => (
              <button
                key={c}
                className="relative aspect-square rounded-full"
                style={{
                  background: c,
                  outline: wallpaper.type === 'solid' && wallpaper.color === c ? '2px solid #fff' : undefined,
                  outlineOffset: 3,
                }}
                onClick={() => apply({ type: 'solid', color: c })}
                aria-label={`Color ${c}`}
              >
                {wallpaper.type === 'solid' && wallpaper.color === c && (
                  <Check size={14} strokeWidth={3} className="absolute inset-0 m-auto text-white drop-shadow" />
                )}
              </button>
            ))}
          </div>
        )}

        {tab === 'Emoji' && <EmojiWallpaperTab onPick={(w) => setPrefs({ wallpaper: w })} current={wallpaper} />}
      </div>
    </div>
  );
}
