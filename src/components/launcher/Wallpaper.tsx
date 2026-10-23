'use client';

// Wallpaper renderer: image / solid / gradient / emoji variants.
// The emoji variant renders through the deterministic EmojiDrawer engine
// (grid S/M/L, ring, golden-angle spiral) shared with the picker preview.

import type { WallpaperDef } from '@/lib/launcher/types';
import { GLASS } from '@/lib/launcher/glass';
import { EmojiDrawer } from './EmojiDrawer';

export function wallpaperCss(wp: WallpaperDef): React.CSSProperties {
  switch (wp.type) {
    case 'image':
      return {
        backgroundImage: `url(${wp.src})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    case 'solid':
      return { background: wp.color };
    case 'gradient':
      return { background: `linear-gradient(165deg, ${wp.from}, ${wp.to})` };
    case 'emoji':
      return { background: wp.bg };
    default:
      return { background: '#079ECB' };
  }
}

export function Wallpaper({ wp, dim = 0 }: { wp: WallpaperDef; dim?: number }) {
  return (
    <div className="absolute inset-0 overflow-hidden" style={wallpaperCss(wp)} aria-hidden>
      {wp.type === 'emoji' && (
        <EmojiDrawer emojis={wp.emojis} layout={wp.layout} bg={wp.bg} className="absolute inset-0" />
      )}
      {dim > 0 && (
        <div
          className="absolute inset-0"
          style={{ background: `rgba(0,0,0,${dim})` }}
        />
      )}
      {/* subtle vignette for icon legibility */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(120% 80% at 50% 0%, transparent 55%, rgba(0,0,0,${0.16 + dim * 0.2}) 100%)`,
        }}
      />
    </div>
  );
}

export const WALLPAPER_BLUR_PX = GLASS.blurPx;
