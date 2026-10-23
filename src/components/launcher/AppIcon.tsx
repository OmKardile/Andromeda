'use client';

// App icon: iOS-style squircle with gradient, glyph, label, badge, jiggle.

import { memo } from 'react';
import { getApp, displayName } from '@/lib/launcher/apps';
import { useLauncher } from '@/lib/launcher/store';
import { labelShadow } from '@/lib/launcher/glass';

export const SQUIRCLE_RADIUS = '22.4%';

interface AppIconProps {
  appId: string;
  size: number;
  label?: boolean;
  /** label font size in px — flexible icon text pref scales this */
  labelSize?: number;
  jiggle?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  badge?: number;
}

function AppIconBase({
  appId,
  size,
  label = true,
  labelSize = 11,
  jiggle = false,
  onPointerDown,
}: AppIconProps) {
  const app = getApp(appId);
  const prefs = useLauncher((s) => s.prefs);
  const name = displayName(appId, prefs);
  if (!app) return null;

  const Icon = app.icon;
  const badgeCount = prefs.badgesEnabled ? demoBadge(appId) : 0;

  return (
    <div
      className="flex select-none flex-col items-center gap-[3px]"
      style={{ width: size + 12 }}
      onPointerDown={onPointerDown}
    >
      <div
        className={`relative ${jiggle ? 'animate-jiggle' : ''}`}
        style={{ width: size, height: size, transformOrigin: '50% 100%' }}
      >
        <div
          className="flex h-full w-full items-center justify-center shadow-[0_4px_12px_rgba(0,0,0,0.18)]"
          style={{
            background: app.bg,
            borderRadius: SQUIRCLE_RADIUS,
          }}
        >
          <Icon
            size={Math.round(size * 0.5)}
            strokeWidth={1.7}
            color={app.fg ?? '#FFFFFF'}
          />
        </div>
        {badgeCount > 0 && (
          <span
            className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-semibold text-white"
            style={{ background: '#FF3B30' }}
            aria-label={`${badgeCount} notifications`}
          >
            {badgeCount > 99 ? '99+' : badgeCount}
          </span>
        )}
      </div>
      {label && (
        <span
          className="max-w-full truncate text-center font-medium leading-tight text-white"
          style={{ ...labelShadow, fontSize: labelSize }}
        >
          {name}
        </span>
      )}
    </div>
  );
}

/** Deterministic pseudo-notification counts (demo of the badge system). */
function demoBadge(appId: string): number {
  const b = demoBadgeMap[appId];
  return b?.[Math.floor(Date.now() / 60_000) % b.length] ?? 0;
}

const demoBadgeMap: Record<string, number[]> = {
  messages: [3, 5, 12],
  mail: [1, 8, 2],
  appstore: [2, 4, 1],
  podcasts: [1, 0, 3],
  reminders: [4, 6, 1],
};

export const AppIcon = memo(AppIconBase);
