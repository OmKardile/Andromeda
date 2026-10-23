'use client';

// App drawer: swipe-up overlay, glass scrim, alphabetical 4-col grid,
// search field, long-press-drag apps onto the workspace.
// Workspace scales to 0.95 beneath (320ms).

import { useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { useLauncher } from '@/lib/launcher/store';
import { displayName, visibleApps } from '@/lib/launcher/apps';
import { MOTION, glassStyle } from '@/lib/launcher/glass';
import { AppIcon } from './AppIcon';
import { useDrag } from './DragLayer';

export function AppDrawer() {
  const overlay = useLauncher((s) => s.overlay);
  const prefs = useLauncher((s) => s.prefs);
  const closeOverlay = useLauncher((s) => s.closeOverlay);
  const launchApp = useLauncher((s) => s.launchApp);
  const { start } = useDrag();
  const [query, setQuery] = useState('');
  const pressTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = overlay.kind === 'drawer';

  const apps = useMemo(() => {
    const list = visibleApps(prefs);
    const q = query.trim().toLowerCase();
    const named = list.map((a) => ({ a, name: displayName(a.id, prefs) }));
    return (q ? named.filter((x) => x.name.toLowerCase().includes(q)) : named).sort((x, y) =>
      x.name.localeCompare(y.name),
    );
  }, [prefs, query]);

  if (!open) return null;

  const onIconPointerDown = (e: ReactPointerEvent<HTMLDivElement>, appId: string) => {
    pressTimers.current[appId] = setTimeout(() => {
      // long-press -> drag out of the drawer (drawer closes automatically)
      start({ from: 'drawer-app', appId }, e);
    }, MOTION.longPressMs);
  };
  const clearPress = (appId: string) => {
    if (pressTimers.current[appId]) {
      clearTimeout(pressTimers.current[appId]);
      delete pressTimers.current[appId];
    }
  };

  const scheduleClose = () => {
    closeTimer.current = setTimeout(closeOverlay, 80);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  return (
    <div className="absolute inset-0 z-40" role="dialog" aria-label="App drawer">
      {/* scrim — full-screen blur + dim (recovered scrim values) */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0,0,0,0.52)',
          backdropFilter: `blur(${22}px) saturate(130%)`,
          animation: `fadeIn ${MOTION.overlayMs}ms ease both`,
        }}
        onPointerDown={(e) => {
          // swipe down to close
          const y0 = e.clientY;
          const onMove = (ev: PointerEvent) => {
            if (ev.clientY - y0 > 44) {
              window.removeEventListener('pointermove', onMove);
              closeOverlay();
            }
          };
          window.addEventListener('pointermove', onMove);
          window.addEventListener('pointerup', () => window.removeEventListener('pointermove', onMove), { once: true });
        }}
      />
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>

      <div
        className="absolute inset-x-0 top-0 flex h-full flex-col px-4 pb-6 pt-[60px]"
        style={{ animation: `drawerUp ${MOTION.overlayMs}ms cubic-bezier(0.25,0.1,0.25,1) both` }}
      >
        <style>{`@keyframes drawerUp { from { transform: translateY(6%); opacity: 0.4; } to { transform: translateY(0); opacity: 1; } }`}</style>

        {/* search field */}
        <div
          className="mb-4 flex items-center gap-2 px-3 py-2"
          style={glassStyle(14, { dark: true })}
        >
          <Search size={15} className="shrink-0 text-white/80" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search apps"
            className="w-full bg-transparent text-[14px] text-white placeholder:text-white/50 focus:outline-none"
            aria-label="Search apps"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} aria-label="Clear">
              <X size={14} className="text-white/70" />
            </button>
          )}
        </div>

        {/* grid */}
        <div className="flex-1 overflow-y-auto overscroll-contain pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="grid grid-cols-4 gap-y-5">
            {apps.map(({ a, name }) => (
              <div
                key={a.id}
                data-item-key={`drawer-${a.id}`}
                className="drag-item flex justify-center"
                onPointerDown={(e) => onIconPointerDown(e, a.id)}
                onPointerUp={() => clearPress(a.id)}
                onPointerLeave={() => clearPress(a.id)}
                onPointerCancel={() => clearPress(a.id)}
                onClick={(e) => {
                  e.stopPropagation();
                  cancelClose();
                  if (!useLauncher.getState().dragging) launchApp(a.id);
                }}
              >
                <AppIcon appId={a.id} size={58} labelSize={10} />
              </div>
            ))}
          </div>
          {apps.length === 0 && (
            <p className="mt-16 text-center text-sm text-white/70">No apps found for “{query}”</p>
          )}
        </div>

        {/* close chevron */}
        <button
          className="mx-auto mt-2 flex h-9 w-9 items-center justify-center rounded-full text-white/85"
          style={glassStyle(18, { dark: true })}
          onClick={scheduleClose}
          onPointerEnter={cancelClose}
          aria-label="Close drawer"
        >
          <ChevronDown size={18} />
        </button>
      </div>
    </div>
  );
}
