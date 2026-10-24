'use client';

// Launcher — the root of the phone experience.
// Layers (bottom → top):
//   wallpaper → workspace (pages + zero page) → dock → page indicator
//   → overlays (drawer / search / folder / app screen / context menu)
//   → edit banner → drag layer → shade (control/notification) → lock screen
//   → brightness dim

import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import { useLauncher } from '@/lib/launcher/store';
import { Wallpaper } from './Wallpaper';
import { StatusBar } from './StatusBar';
import { Workspace } from './Workspace';
import { Dock } from './Dock';
import { PageIndicator } from './PageIndicator';
import { AppDrawer } from './AppDrawer';
import { SearchOverlay } from './SearchOverlay';
import { FolderOverlay } from './Folder';
import { AppScreen } from './AppScreen';
import { ContextMenu } from './ContextMenu';
import { WidgetPicker } from './WidgetPicker';
import { WallpaperPicker } from './WallpaperPicker';
import { DragLayer } from './DragLayer';
import { LockScreen } from './LockScreen';
import { ControlCenter } from './ControlCenter';
import { NotificationCenter } from './NotificationCenter';
import { fetchWeather } from '@/lib/launcher/weather';
import { CITIES } from '@/lib/launcher/storage';

export function Launcher() {
  const hydrate = useLauncher((s) => s.hydrate);
  const prefs = useLauncher((s) => s.prefs);
  const overlay = useLauncher((s) => s.overlay);
  const editMode = useLauncher((s) => s.editMode);
  const locked = useLauncher((s) => s.locked);
  const setEditMode = useLauncher((s) => s.setEditMode);
  const setWeather = useLauncher((s) => s.setWeather);
  const setBattery = useLauncher((s) => s.setBattery);

  const [widgetPickerOpen, setWidgetPickerOpen] = useState(false);
  const [wallpaperPickerOpen, setWallpaperPickerOpen] = useState(false);

  // hydrate persisted state once
  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // 1-second ticker driving clock widgets + the music engine
  useEffect(() => {
    const t = setInterval(() => {
      const st = useLauncher.getState();
      st.bumpTick();
      st.tickMusic();
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // battery
  useEffect(() => {
    type BatteryManagerLike = {
      level: number;
      charging: boolean;
      addEventListener: (t: string, cb: () => void) => void;
    };
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryManagerLike> };
    if (!nav.getBattery) {
      setBattery(0.78, false, false);
      return;
    }
    let bat: BatteryManagerLike | null = null;
    nav.getBattery().then((b) => {
      bat = b;
      const sync = () => setBattery(b.level, b.charging, true);
      sync();
      b.addEventListener('levelchange', sync);
      b.addEventListener('chargingchange', sync);
    });
    return () => {
      void bat;
    };
  }, [setBattery]);

  // weather fetch + auto refresh
  useEffect(() => {
    if (!prefs.city) return;
    let cancelled = false;
    const load = async () => {
      try {
        const w = await fetchWeather(prefs.city, prefs.tempUnit);
        if (!cancelled) setWeather(w);
      } catch {
        // keep previous data
      }
    };
    load();
    const interval = Math.max(1, Math.min(24, prefs.autoRefreshH)) * 3600_000;
    const t = setInterval(load, interval);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [prefs.city, prefs.autoRefreshH, prefs.tempUnit, setWeather]);

  // ESC closes overlays / shade / edit mode
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = useLauncher.getState();
      if (e.key !== 'Escape') return;
      if (st.shade !== 'none') st.setShade('none');
      else if (st.overlay.kind !== 'none') st.closeOverlay();
      else if (st.editMode) st.setEditMode(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // keep default city in sync with the bundled list shape
  useEffect(() => {
    if (!prefs.city?.lat && CITIES[0]) {
      useLauncher.getState().setPrefs({ city: CITIES[0] as unknown as typeof prefs.city });
    }
  }, [prefs.city]);

  const overlayOpen = overlay.kind !== 'none';
  const shadeAvailable = !locked && !overlayOpen && !editMode;

  return (
    <DragLayer>
      <div className="relative h-full w-full select-none overflow-hidden bg-black font-[system-ui]">
        <Wallpaper wp={prefs.wallpaper} dim={overlayOpen ? 0.06 : 0} />

        <StatusBar />

        <div
          className="absolute inset-0 transition-transform duration-[320ms] ease-[cubic-bezier(0.25,0.1,0.25,1)]"
          style={{
            transform: overlay.kind === 'drawer' || overlay.kind === 'search' ? 'scale(0.95) translateY(6px)' : 'none',
          }}
        >
          <Workspace />
          <Dock />
          <PageIndicator />
        </div>

        {/* shade handles — left half opens notifications, right half control center */}
        {shadeAvailable && (
          <>
            <button
              type="button"
              className="absolute left-0 top-0 z-[46] h-[30px] w-1/2"
              onClick={() => useLauncher.getState().setShade('notifications')}
              aria-label="Open Notification Center"
            />
            <button
              type="button"
              className="absolute right-0 top-0 z-[46] h-[30px] w-1/2"
              onClick={() => useLauncher.getState().setShade('control')}
              aria-label="Open Control Center"
            />
          </>
        )}

        {/* home indicator (hideNav pref) */}
        {!prefs.hideNav && (
          <div className="pointer-events-none absolute bottom-2 left-1/2 z-40 h-[5px] w-[134px] -translate-x-1/2 rounded-full bg-white/70 mix-blend-overlay" />
        )}

        <AppDrawer />
        <SearchOverlay />
        <FolderOverlay key={overlay.kind === 'folder' ? overlay.folderId : 'none'} />
        <AppScreen />

        <ContextMenu
          onOpenWidgetPicker={() => setWidgetPickerOpen(true)}
          onOpenWallpaperPicker={() => setWallpaperPickerOpen(true)}
        />

        <WidgetPicker open={widgetPickerOpen} onClose={() => setWidgetPickerOpen(false)} />
        <WallpaperPicker open={wallpaperPickerOpen} onClose={() => setWallpaperPickerOpen(false)} />

        {/* edit-mode banner */}
        {editMode && !overlayOpen && (
          <div className="absolute inset-x-0 top-[58px] z-[62] flex justify-end px-4">
            <button
              className="flex items-center gap-1.5 rounded-full bg-white/90 px-4 py-1.5 text-[13px] font-semibold text-black shadow-lg backdrop-blur"
              onClick={() => setEditMode(false)}
            >
              <Check size={14} strokeWidth={3} />
              Done
            </button>
          </div>
        )}

        {/* shade (control / notification centers) */}
        <ControlCenter />
        <NotificationCenter />

        {/* lock screen on top of everything */}
        <LockScreen />

        {/* global brightness dim (control center / settings slider) */}
        {prefs.brightness < 0.995 && (
          <div
            className="pointer-events-none absolute inset-0 z-[95] transition-opacity duration-200"
            style={{ background: 'rgba(0,0,0,1)', opacity: (1 - prefs.brightness) * 0.75 }}
            aria-hidden
          />
        )}
      </div>
    </DragLayer>
  );
}
