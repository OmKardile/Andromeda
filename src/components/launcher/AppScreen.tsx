'use client';

// AppScreen — the host overlay for functional app screens
// (Settings / Calculator / Notes / ...). Apps without a screen get a
// polished generic screen. The apps-suite agent (Task 6-c) fills the map.

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

export function AppScreen() {
  const overlay = useLauncher((s) => s.overlay);
  const closeOverlay = useLauncher((s) => s.closeOverlay);

  if (overlay.kind !== 'app') return null;
  const app = getApp(overlay.appId);

  return (
    <div
      className="absolute inset-0 z-[55] flex flex-col bg-[#f7f7fa]"
      style={{ animation: `appIn ${MOTION.overlayMs}ms cubic-bezier(0.25,0.1,0.25,1) both` }}
      role="dialog"
      aria-label={app?.name ?? 'App'}
    >
      <style>{`@keyframes appIn { from { transform: scale(0.88); opacity: 0; border-radius: 44px; } to { transform: none; opacity: 1; border-radius: 0; } }`}</style>

      {app?.screen === 'settings' && <SettingsScreen />}
      {app?.screen === 'calculator' && <CalculatorApp />}
      {app?.screen === 'notes' && <NotesApp />}
      {app?.screen === 'clock' && <ClockApp />}
      {app?.screen === 'weather' && <WeatherApp />}
      {app?.screen === 'photos' && <PhotosApp />}
      {app?.screen === 'calendar' && <CalendarApp />}
      {app && !app.screen && <GenericAppScreen appId={app.id} onClose={closeOverlay} />}
    </div>
  );
}
