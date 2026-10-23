'use client';

// Suggestions widget — frecency-ranked app suggestions.
// Ranking comes from suggestedApps() (usage stats tracked by launchApp);
// with no history it falls back to the dock apps (phone / messages /
// camera / settings). Icons replicate the launcher's squircle style.

import { Sparkles } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { useLauncher } from '@/lib/launcher/store';
import { getApp, displayName, suggestedApps } from '@/lib/launcher/apps';
import type { AppDef } from '@/lib/launcher/types';
import type { WidgetProps } from './registry';

const INK = '#1C1C1E';
const DOCK_FALLBACK = ['phone', 'messages', 'camera', 'settings'];
const SLOTS = 4;

export function SuggestionsWidget({ width, height }: WidgetProps) {
  const prefs = useLauncher((s) => s.prefs);
  const launchApp = useLauncher((s) => s.launchApp);
  const blurEnabled = useLauncher((s) => s.prefs.blurEnabled);

  const ranked = suggestedApps(prefs, SLOTS);
  const fallback = DOCK_FALLBACK.filter((id) => !ranked.some((a) => a.id === id))
    .map((id) => getApp(id))
    .filter((a): a is AppDef => Boolean(a));
  const apps: (AppDef | undefined)[] = [...ranked, ...fallback].slice(0, SLOTS);

  const iconSize = Math.min(52, Math.max(40, Math.round(Math.min(width / (SLOTS + 0.6), height - 74))));
  const twoRows = width < 260; // narrow cards stack 2×2
  const cols = twoRows ? 2 : SLOTS;

  return (
    <div style={card(width, height, blurEnabled)}>
      <div
        className="flex h-full w-full flex-col"
        style={{ padding: `${Math.max(10, height * 0.07)}px 14px ${Math.max(8, height * 0.05)}px` }}
      >
        <div className="flex items-center" style={{ gap: 5, marginBottom: Math.max(6, height * 0.045) }}>
          <Sparkles size={11} color="#FF9F0A" strokeWidth={2.4} />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: INK }}>Suggested</span>
        </div>
        <div
          className={`grid flex-1 ${twoRows ? 'content-center' : 'content-center'}`}
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`, gap: twoRows ? 8 : 4 }}
        >
          {apps.map((app, i) =>
            app ? (
              <SuggestionSlot key={app.id} app={app} name={displayName(app.id, prefs)} iconSize={iconSize} onLaunch={() => launchApp(app.id)} />
            ) : (
              <div key={`empty-${i}`} />
            ),
          )}
        </div>
      </div>
    </div>
  );
}

function SuggestionSlot({
  app,
  name,
  iconSize,
  onLaunch,
}: {
  app: AppDef;
  name: string;
  iconSize: number;
  onLaunch: () => void;
}): ReactNode {
  const Icon = app.icon;
  return (
    <button
      type="button"
      onClick={onLaunch}
      aria-label={`Open ${name}`}
      className="flex cursor-pointer flex-col items-center outline-none transition-transform duration-150 active:scale-90"
      style={{ gap: 4, background: 'transparent', border: 'none', padding: 0 }}
    >
      <span
        className="flex items-center justify-center"
        style={{
          width: iconSize,
          height: iconSize,
          borderRadius: '22.4%',
          background: app.bg,
          boxShadow: '0 2px 8px rgba(0,0,0,0.16), inset 0 0 0 1px rgba(255,255,255,0.25)',
        }}
      >
        <Icon size={Math.round(iconSize * 0.5)} strokeWidth={1.7} color={app.fg ?? '#FFFFFF'} />
      </span>
      <span
        className="max-w-full truncate text-center"
        style={{ fontSize: 10, fontWeight: 500, color: 'rgba(60,60,67,0.75)' }}
      >
        {name}
      </span>
    </button>
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
