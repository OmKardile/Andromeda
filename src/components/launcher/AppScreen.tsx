'use client';

// AppScreen — the host overlay for functional app screens
// (Settings / Calculator / Notes / ...). Apps without a screen get a
// polished generic screen. Opens with an iOS-style zoom (scale 0.88 → 1,
// corner radius 44 → 0) and closes with the same motion in reverse.
//
// Implementation notes:
//  - Stays mounted after the first app launch and drives open/closed
//    purely through CSS animations (appIn / appOut with fill-mode both),
//    so no setState-in-effect is needed and closed apps keep their state
//    (like iOS app switching).
//  - Honors Dark Mode for the shell background.

import { useState } from 'react';
import { useLauncher } from '@/lib/launcher/store';
import { getApp } from '@/lib/launcher/apps';
import { MOTION } from '@/lib/launcher/glass';
import { GenericAppScreen } from './apps/GenericAppScreen';
import { SettingsScreen } from './apps/SettingsScreen';
import { CalculatorApp } from './apps/CalculatorApp';
import { NotesApp } from './apps/NotesApp';
import { ClockApp } from './apps/ClockApp';
import { WeatherApp } from './apps/WeatherApp';
import { PhotosApp } from './apps/PhotosApp';
import { CalendarApp } from './apps/CalendarApp';
import { MusicApp } from './apps/MusicApp';
import { RemindersApp } from './apps/RemindersApp';

export function AppScreen() {
  const overlay = useLauncher((s) => s.overlay);
  const closeOverlay = useLauncher((s) => s.closeOverlay);
  const darkMode = useLauncher((s) => s.prefs.darkMode);

  const isApp = overlay.kind === 'app';

  // "adjusting state when props change" — the documented render-time pattern.
  // Keeps the latest app mounted through close, so the exit animation can play
  // (and revisiting an app restores its state, like iOS app switching).
  const [appId, setAppId] = useState<string | null>(null);
  if (isApp && appId !== overlay.appId) setAppId(overlay.appId);
  if (appId === null) return null;

  const app = getApp(appId);

  return (
    <div
      className="absolute inset-0 z-[55] flex flex-col"
      style={{
        background: darkMode ? '#0B0B0D' : '#f7f7fa',
        animation: `${isApp ? 'appIn' : 'appOut'} ${MOTION.overlayMs}ms cubic-bezier(0.25,0.1,0.25,1) both`,
        pointerEvents: isApp ? undefined : 'none',
      }}
      role="dialog"
      aria-label={app?.name ?? 'App'}
      aria-hidden={!isApp}
      inert={!isApp}
    >
      <style>{`
        @keyframes appIn { from { transform: scale(0.88); opacity: 0; border-radius: 44px; } to { transform: none; opacity: 1; border-radius: 0; } }
        @keyframes appOut { from { transform: none; opacity: 1; border-radius: 0; } to { transform: scale(0.88); opacity: 0; border-radius: 44px; } }
      `}</style>

      {app?.screen === 'settings' && <SettingsScreen />}
      {app?.screen === 'calculator' && <CalculatorApp />}
      {app?.screen === 'notes' && <NotesApp />}
      {app?.screen === 'clock' && <ClockApp />}
      {app?.screen === 'weather' && <WeatherApp />}
      {app?.screen === 'photos' && <PhotosApp />}
      {app?.screen === 'calendar' && <CalendarApp />}
      {app?.screen === 'music' && <MusicApp />}
      {app?.screen === 'reminders' && <RemindersApp />}
      {app && !app.screen && <GenericAppScreen appId={app.id} onClose={closeOverlay} />}
    </div>
  );
}
