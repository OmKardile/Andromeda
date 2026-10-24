// Andromeda launcher — glass system.
// Constants recovered from the decompiled app:
//   base tint   #66FFFFFF  -> rgba(255,255,255,0.40)
//   dim overlay #33EFEFEF  -> rgba(239,239,239,0.20)
//   scrim       #BE000000 + #4D000000..#99000000 steps
//   radii       dock 0.3×dockHeight, folder icon 0.25×iconSize,
//               folder sheet 30dp, cards 20dp, pills h/2
//   overlay transition 320ms linear, workspace scale 0.95
//   folder animation 350ms, PathInterpolator(0.2, 0, 0, 1)
//   drop interpolator anticipate-overshoot cubic-bezier(.61,.27,1,1.32)

import { useLauncher } from './store';

export const GLASS = {
  baseTint: 'rgba(255,255,255,0.40)',        // #66FFFFFF
  dimOverlay: 'rgba(239,239,239,0.20)',      // #33EFEFEF (SRC_ATOP dim)
  scrimLight: 'rgba(0,0,0,0.30)',            // #4D000000
  scrimDark: 'rgba(0,0,0,0.60)',             // #99000000
  scrimBase: 'rgba(0,0,0,0.745)',            // #BE000000
  lockDim: 177 / 255,                        // 69.8% wallpaper dim
  blurPx: 24,                                // RenderScript r10 on 12% scale ≈ 24px CSS
  edgeHighlight: 'rgba(255,255,255,0.45)',
  edgeShadow: 'rgba(0,0,0,0.06)',
} as const;

export const MOTION = {
  overlayMs: 320,                                  // overlay transitions, linear
  folderMs: 350,                                   // folder open/close
  folderEase: 'cubic-bezier(0.2, 0, 0, 1)',         // PathInterpolator(0.2,0,0,1)
  dropEase: 'cubic-bezier(0.61, 0.27, 1, 1.32)',    // anticipate-overshoot
  crossfadeMs: 200,                                // dots <-> search pill
  idleToPillMs: 2000,                              // 2s idle
  longPressMs: 300,                                 // drag start
  dwellMs: 650,                                     // push-aside dwell
  dragLiftScale: 1.15,
  workspaceScale: 0.95,
  sheetMs: 267,                                     // widget picker sheet
} as const;

export const GRID = {
  cols: 4,
  rows: 6,
  /** iconSize = 0.153 × minDim (390 reference frame) */
  iconSizeRatio: 0.153,
  dockSlots: 4,
  /** folder icon radius = 0.25 × iconSize */
  folderIconRadiusRatio: 0.25,
  /** dock radius = 0.3 × dock height */
  dockRadiusRatio: 0.3,
} as const;

/** Compose a glass panel style from the recovered constants.
 *  Honors the global blur preference: when blur is disabled, panels fall
 *  back to near-opaque tints (matching the widget fallbacks) instead of
 *  backdrop-filtering — the pref is a global kill-switch, not per-widget. */
export function glassStyle(radius: number, opts?: { dark?: boolean; strength?: number }): React.CSSProperties {
  const strength = opts?.strength ?? 1;
  const blurOn = useLauncher.getState()?.prefs?.blurEnabled !== false;
  const tint = opts?.dark
    ? `rgba(30,30,32,${(blurOn ? 0.55 : 0.86) * strength})`
    : blurOn
      ? GLASS.baseTint
      : 'rgba(255,255,255,0.94)';
  return {
    background: tint,
    ...(blurOn
      ? {
          backdropFilter: `blur(${GLASS.blurPx}px) saturate(${Math.round(160 * strength)}%)`,
          WebkitBackdropFilter: `blur(${GLASS.blurPx}px) saturate(${Math.round(160 * strength)}%)`,
        }
      : {}),
    borderRadius: radius,
    boxShadow: `inset 0 0 0 1px rgba(255,255,255,0.28), inset 0 0 0 2px rgba(0,0,0,0.015), 0 8px 28px rgba(0,0,0,${0.16 * strength})`,
  };
}

/** Text shadow used on labels above busy wallpapers (from the launcher spec). */
export const labelShadow: React.CSSProperties = {
  textShadow: '0 1px 3px rgba(0,0,0,0.55)',
};

/** Badge pill color — #FF3B30 with count. */
export const badgeStyle: React.CSSProperties = {
  background: '#FF3B30',
  color: '#fff',
};

export function pillRadius(heightPx: number): number {
  return heightPx / 2;
}
