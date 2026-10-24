'use client';

// Glass dock: 4 slots, no labels (per the recovered spec),
// radius = 0.3 × dock height.

import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { useLauncher } from '@/lib/launcher/store';
import { displayName } from '@/lib/launcher/apps';
import { GRID, MOTION, glassStyle } from '@/lib/launcher/glass';
import { AppIcon } from './AppIcon';
import { useDrag } from './DragLayer';

const DOCK_H = 92;
const DOCK_RADIUS = DOCK_H * GRID.dockRadiusRatio; // 0.3 × dock height

export function Dock() {
  const dock = useLauncher((s) => s.layout.dock);
  const prefs = useLauncher((s) => s.prefs);
  const editMode = useLauncher((s) => s.editMode);
  const setOverlay = useLauncher((s) => s.setOverlay);
  const dragging = useLauncher((s) => s.dragging);
  const { start } = useDrag();
  const pressTimers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const iconSize = Math.round(390 * GRID.iconSizeRatio * prefs.iconScale);

  // swipe up anywhere on the dock opens the drawer (window-level tracking
  // so fast teleports still register)
  const onStripPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const x0 = e.clientX;
    const y0 = e.clientY;
    let opened = false;
    const onMove = (ev: PointerEvent) => {
      if (opened) return;
      const dx = ev.clientX - x0;
      const dy = ev.clientY - y0;
      if (dy < -36 && Math.abs(dy) > Math.abs(dx)) {
        opened = true;
        cleanup();
        if (!useLauncher.getState().dragging) setOverlay({ kind: 'drawer' });
      }
    };
    const cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
    const onUp = () => cleanup();
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  };

  const onIconPointerDown = (e: ReactPointerEvent<HTMLDivElement>, i: number, appId: string) => {
    if (editMode) {
      start({ from: 'dock', appId, originDockIndex: i }, e);
      return;
    }
    pressTimers.current[i] = setTimeout(() => {
      setOverlay({ kind: 'edit-menu', appId, origin: { x: e.clientX, y: e.clientY } });
      useLauncher.getState().setEditMode(true);
    }, MOTION.longPressMs);
  };

  const clearPress = (i: number) => {
    if (pressTimers.current[i]) {
      clearTimeout(pressTimers.current[i]);
      delete pressTimers.current[i];
    }
  };

  return (
    <div
      className="pointer-events-none absolute inset-x-0 bottom-0 z-30 flex justify-center pb-6"
      style={{ height: DOCK_H + 24, pointerEvents: dragging ? 'none' : 'auto' }}
      onPointerDown={onStripPointerDown}
    >
      <div
        className={`pointer-events-auto relative mx-4 flex w-full items-center justify-around px-3 ${dragging ? 'drag-on' : ''}`}
        style={glassStyle(DOCK_RADIUS)}
        role="toolbar"
        aria-label="Dock"
      >
        {[0, 1, 2, 3].map((i) => {
          const appId = dock[i];
          return (
            <div
              key={i}
              data-drop="dock"
              data-index={i}
              data-occupant={appId ?? undefined}
              className="flex h-[72px] w-[76px] items-center justify-center"
            >
              {appId ? (
                <div
                  data-item-key={`dock-${i}-${appId}`}
                  data-page={-2}
                  className="drag-item"
                  role="button"
                  aria-label={`Open ${displayName(appId, prefs)}`}
                  onPointerDown={(e) => onIconPointerDown(e, i, appId)}
                  onPointerUp={() => clearPress(i)}
                  onPointerLeave={() => clearPress(i)}
                  onPointerCancel={() => clearPress(i)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!editMode) useLauncher.getState().launchApp(appId);
                  }}
                >
                  <AppIcon appId={appId} size={iconSize} label={false} />
                </div>
              ) : (
                <span className="h-2 w-2 rounded-full bg-white/10" aria-hidden />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
