'use client';

// Workspace — the pager.
//  • pages -1..3 where -1 is the zero page (widget host)
//  • swipe: horizontal pan with transition styles
//    (default / rotation / flip / zoom in / alpha — from scroll_type)
//  • long-press 300ms on an item -> edit mode + context menu;
//    keep holding and move -> drag (DragLayer)
//  • in edit mode, drag starts immediately
//  • swipe up from the bottom -> app drawer

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { useLauncher } from '@/lib/launcher/store';
import { getApp } from '@/lib/launcher/apps';
import { GRID, MOTION } from '@/lib/launcher/glass';
import type { PageTransition, PlacedItem } from '@/lib/launcher/types';
import { AppIcon } from './AppIcon';
import { WidgetHost } from './WidgetHost';
import { useDrag } from './DragLayer';
import { ZeroPage } from './ZeroPage';

export function useMetrics() {
  return useMemo(() => {
    const frameW = 390;
    const iconSize = Math.round(frameW * GRID.iconSizeRatio);
    const gridW = frameW - 16; // 8px side padding
    const cellW = gridW / GRID.cols;
    const topPad = 64; // status bar
    const bottomPad = 170; // indicator + dock
    const gridH = 844 - topPad - bottomPad;
    const cellH = gridH / GRID.rows;
    return { frameW, iconSize, cellW, cellH, gridW, gridH, topPad };
  }, []);
}

export function Workspace() {
  const metrics = useMetrics();
  const layout = useLauncher((s) => s.layout);
  const page = useLauncher((s) => s.page);
  const setPage = useLauncher((s) => s.setPage);
  const setOverlay = useLauncher((s) => s.setOverlay);
  const editMode = useLauncher((s) => s.editMode);
  const dragging = useLauncher((s) => s.dragging);
  const prefs = useLauncher((s) => s.prefs);
  const { start } = useDrag();

  const rootRef = useRef<HTMLDivElement>(null);
  const [dragX, setDragX] = useState(0);
  const [swiping, setSwiping] = useState(false);

  const gesture = useRef<{
    x0: number;
    y0: number;
    t0: number;
    mode: 'idle' | 'swipe' | 'press' | 'dead';
    item?: { placedKey: string; appId?: string; widget?: PlacedItem['item'] };
    longPressed: boolean;
    timer?: ReturnType<typeof setTimeout>;
  }>({ x0: 0, y0: 0, t0: 0, mode: 'idle', longPressed: false });

  const pageW = metrics.frameW;

  const itemUnder = useCallback(
    (el: HTMLElement | null, pageHint = page): { placedKey: string; placed: PlacedItem; pageIdx: number } | null => {
      const target = el?.closest<HTMLElement>('[data-item-key]');
      if (!target?.dataset.itemKey) return null;
      const pageIdx = Number(target.dataset.page ?? pageHint);
      const placed = (layout.pages[pageIdx] ?? []).find((p) => p.key === target.dataset.itemKey);
      if (!placed) return null;
      return { placedKey: placed.key, placed, pageIdx };
    },
    [layout.pages, page],
  );

  const beginItemDrag = useCallback(
    (found: { placedKey: string; placed: PlacedItem; pageIdx: number }, e: ReactPointerEvent) => {
      const { placedKey, placed, pageIdx } = found;
      if (placed.item.type === 'app') {
        start({ from: 'page', appId: placed.item.appId, placedKey, originPage: pageIdx }, e);
      } else if (placed.item.type === 'widget') {
        start({ from: 'page', widget: placed.item.widget, placedKey, originPage: pageIdx }, e);
      } else if (placed.item.type === 'folder') {
        // folders are not draggable in v1 — open instead
        setOverlay({ kind: 'folder', folderId: placed.item.folderId });
      }
    },
    [setOverlay, start],
  );

  // ----- gesture arbitration -----
  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (dragging) return;
      const g = gesture.current;
      g.x0 = e.clientX;
      g.y0 = e.clientY;
      g.t0 = performance.now();
      g.longPressed = false;
      g.mode = 'press';

      const found = itemUnder(e.target as HTMLElement);

      if (editMode && found && found.placed.item.type !== 'folder') {
        // immediate drag in edit mode
        beginItemDrag(found, e);
        g.mode = 'dead';
        return;
      }

      // long-press timer: edit mode + context menu (drag continues on move)
      const origin = { x: e.clientX, y: e.clientY };
      g.timer = setTimeout(() => {
        const gg = gesture.current;
        if (gg.mode !== 'press') return;
        gg.longPressed = true;
        const st = useLauncher.getState();
        st.setEditMode(true);
        if (found) {
          st.setOverlay({
            kind: 'edit-menu',
            appId: found.placed.item.type === 'app' ? found.placed.item.appId : undefined,
            folderId: found.placed.item.type === 'folder' ? found.placed.item.folderId : undefined,
            widgetId: found.placed.item.type === 'widget' ? found.placed.item.widget.id : undefined,
            origin,
          });
        } else {
          st.setOverlay({ kind: 'edit-menu', origin });
        }
        // vibration where available
        if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate?.(10);
        }
      }, MOTION.longPressMs);
    },
    [beginItemDrag, dragging, editMode, itemUnder],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const g = gesture.current;
      if (g.mode === 'idle' || g.mode === 'dead') return;
      const dx = e.clientX - g.x0;
      const dy = e.clientY - g.y0;

      if (g.mode === 'press') {
        const dist = Math.hypot(dx, dy);
        if (dist > 10) {
          clearTimeout(g.timer);
          if (g.longPressed) {
            // continued hold after long-press -> drag the item
            const found = itemUnder(e.target as HTMLElement);
            if (found) {
              beginItemDrag(found, e);
              useLauncher.getState().closeOverlay();
              g.mode = 'dead';
            } else {
              g.mode = 'dead';
            }
            return;
          }
          if (Math.abs(dx) > Math.abs(dy) * 0.9) {
            g.mode = 'swipe';
            setSwiping(true);
          } else if (dy < -12) {
            // swipe up -> drawer
            g.mode = 'dead';
            setOverlay({ kind: 'drawer' });
          } else {
            g.mode = 'dead';
          }
        }
        return;
      }
      if (g.mode === 'swipe') {
        let x = dx;
        const atLeft = page === -1;
        const atRight = page === 3;
        if ((atLeft && x > 0) || (atRight && x < 0)) x = x * 0.28;
        setDragX(x);
      }
    },
    [beginItemDrag, itemUnder, page, setOverlay],
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      const g = gesture.current;
      clearTimeout(g.timer);
      if (g.mode === 'swipe') {
        const dx = e.clientX - g.x0;
        const threshold = pageW * 0.22;
        if (dx < -threshold) setPage(Math.min(3, page + 1));
        else if (dx > threshold) setPage(Math.max(-1, page - 1));
        setSwiping(false);
      } else if (g.mode === 'press' && !g.longPressed) {
        // quick tap
        const found = itemUnder(e.target as HTMLElement);
        if (found) {
          if (editMode) {
            // in edit mode, tap opens the item menu instead of launching
            setOverlay({
              kind: 'edit-menu',
              appId: found.placed.item.type === 'app' ? found.placed.item.appId : undefined,
              folderId: found.placed.item.type === 'folder' ? found.placed.item.folderId : undefined,
              widgetId: found.placed.item.type === 'widget' ? found.placed.item.widget.id : undefined,
              origin: { x: e.clientX, y: e.clientY },
            });
          } else if (found.placed.item.type === 'app') {
            useLauncher.getState().launchApp(found.placed.item.appId);
          } else if (found.placed.item.type === 'folder') {
            setOverlay({ kind: 'folder', folderId: found.placed.item.folderId });
          }
        }
      }
      g.mode = 'idle';
      g.item = undefined;
      g.longPressed = false;
      setDragX(0);
    },
    [editMode, itemUnder, page, pageW, setOverlay, setPage],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const st = useLauncher.getState();
      if (st.overlay.kind !== 'none' && st.overlay.kind !== 'folder') return;
      if (e.key === 'ArrowRight') setPage(Math.min(3, page + 1));
      if (e.key === 'ArrowLeft') setPage(Math.max(-1, page - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [page, setPage]);

  const indices = [-1, 0, 1, 2, 3];
  const progress = page + dragX / pageW;

  return (
    <div
      ref={rootRef}
      className={`absolute inset-0 touch-none ${dragging ? 'drag-on' : ''}`}
      style={{ perspective: 1200 }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onContextMenu={(e) => {
        e.preventDefault();
        const found = itemUnder(e.target as HTMLElement);
        useLauncher.getState().setEditMode(true);
        setOverlay({
          kind: 'edit-menu',
          appId: found?.placed.item.type === 'app' ? found.placed.item.appId : undefined,
          folderId: found?.placed.item.type === 'folder' ? found.placed.item.folderId : undefined,
          widgetId: found?.placed.item.type === 'widget' ? found.placed.item.widget.id : undefined,
          origin: { x: e.clientX, y: e.clientY },
        });
      }}
    >
      {indices.map((i) => {
        const rel = i - progress;
        const style = transitionStyle(prefs.pageTransition, rel);
        return (
          <div
            key={i}
            className="absolute inset-0 will-change-transform"
            style={{
              transform: style.transform,
              opacity: style.opacity,
              transition: swiping
                ? 'none'
                : `transform ${MOTION.overlayMs}ms cubic-bezier(0.25, 0.1, 0.25, 1), opacity ${MOTION.overlayMs}ms ease`,
              pointerEvents: Math.abs(rel) < 0.5 ? 'auto' : 'none',
              transformStyle: 'preserve-3d',
            }}
            aria-hidden={Math.abs(rel) >= 0.5}
          >
            {i === -1 ? <ZeroPage /> : <GridPage pageIdx={i} />}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Transition styles (recovered: default/rotation/flip/zoom in/alpha)
// ---------------------------------------------------------------------------

function transitionStyle(type: PageTransition, rel: number): { transform: string; opacity: number } {
  const r = Math.max(-1.6, Math.min(1.6, rel));
  switch (type) {
    case 'rotation':
      return {
        transform: `translateX(${r * 46}%) rotateY(${r * -28}deg) scale(${1 - Math.abs(r) * 0.12})`,
        opacity: Math.max(0, 1 - Math.abs(r) * 0.35),
      };
    case 'flip':
      return {
        transform: `translateX(${r * 30}%) rotateY(${Math.sign(r) * Math.min(Math.abs(r), 1) * 78}deg) scale(${1 - Math.abs(r) * 0.16})`,
        opacity: Math.max(0, 1 - Math.abs(r) * 0.4),
      };
    case 'zoom':
      return {
        transform: `translateX(${r * 58}%) scale(${1 - Math.abs(r) * 0.22})`,
        opacity: Math.max(0, 1 - Math.abs(r) * 0.5),
      };
    case 'alpha':
      return {
        transform: `translateX(${r * 24}%)`,
        opacity: Math.max(0, 1 - Math.abs(r) * 0.95),
      };
    case 'default':
    default:
      return {
        transform: `translateX(${r * 100}%)`,
        opacity: 1,
      };
  }
}

// ---------------------------------------------------------------------------
// One grid page
// ---------------------------------------------------------------------------

function GridPage({ pageIdx }: { pageIdx: number }) {
  const metrics = useMetrics();
  const layout = useLauncher((s) => s.layout);
  const prefs = useLauncher((s) => s.prefs);
  const editMode = useLauncher((s) => s.editMode);
  const pageItems = layout.pages[pageIdx] ?? [];

  const iconSize = Math.round(metrics.iconSize * prefs.iconScale);
  const labelSize = prefs.flexibleText ? 10 + Math.round((prefs.iconScale - 1) * 8) : 11;

  const occ = useMemo(() => {
    const m: (PlacedItem | undefined)[][] = Array.from({ length: 6 }, () => Array(4).fill(undefined));
    for (const p of pageItems) {
      for (let r = p.row; r < 6 && r < p.row + p.h; r++) {
        for (let c = p.col; c < 4 && c < p.col + p.w; c++) {
          m[r][c] = p;
        }
      }
    }
    return m;
  }, [pageItems]);

  return (
    <div className="absolute inset-0" style={{ paddingTop: metrics.topPad }}>
      {/* drop-zone cells */}
      <div
        className="pointer-events-none absolute inset-x-2"
        style={{ top: metrics.topPad, height: metrics.gridH }}
      >
        {occ.map((row, r) =>
          row.map((cellItem, c) => (
            <div
              key={`${r}-${c}`}
              data-drop="cell"
              data-page={pageIdx}
              data-col={c}
              data-row={r}
              data-occupant={cellItem?.key}
              data-occupant-folder={cellItem?.item.type === 'folder' ? cellItem.item.folderId : undefined}
              className="pointer-events-auto"
              style={{
                position: 'absolute',
                left: `${c * 25}%`,
                top: `${(r * metrics.cellH * 100) / metrics.gridH}%`,
                width: '25%',
                height: `${(metrics.cellH * 100) / metrics.gridH}%`,
              }}
            />
          )),
        )}
      </div>

      {/* items */}
      {pageItems.map((p) => (
        <div
          key={p.key}
          data-item-key={p.key}
          data-page={pageIdx}
          className="drag-item absolute flex items-center justify-center"
          style={{
            left: p.col * metrics.cellW + 8,
            top: metrics.topPad + p.row * metrics.cellH,
            width: p.w * metrics.cellW,
            height: p.h * metrics.cellH,
          }}
        >
          <PageItemContent placed={p} iconSize={iconSize} labelSize={labelSize} editMode={editMode} />
        </div>
      ))}
    </div>
  );
}

function PageItemContent({
  placed,
  iconSize,
  labelSize,
  editMode = false,
}: {
  placed: PlacedItem;
  iconSize: number;
  labelSize: number;
  editMode?: boolean;
}) {
  if (placed.item.type === 'app') {
    return <AppIcon appId={placed.item.appId} size={iconSize} labelSize={labelSize} jiggle={editMode} />;
  }
  if (placed.item.type === 'folder') {
    return <FolderIcon placed={placed} iconSize={iconSize} labelSize={labelSize} jiggle={editMode} />;
  }
  const w = placed.item.widget;
  return (
    <div className={editMode ? 'animate-jiggle' : undefined} data-tap="false">
      <WidgetHost
        widget={w}
        width={placed.w * metricsCellW() - 6}
        height={placed.h * cellHpx - 6}
        mode="workspace"
      />
    </div>
  );
}

function metricsCellW(): number {
  return (390 - 16) / 4;
}

const cellHpx = (844 - 64 - 170) / 6;

function FolderIcon({
  placed,
  iconSize,
  labelSize,
  jiggle = false,
}: {
  placed: PlacedItem;
  iconSize: number;
  labelSize: number;
  jiggle?: boolean;
}) {
  const layout = useLauncher((s) => s.layout);
  if (placed.item.type !== 'folder') return null;
  const folder = layout.folders[placed.item.folderId];
  if (!folder) return null;
  const apps = folder.appIds.slice(0, 4);
  const radius = (iconSize + 8) * 0.32;

  return (
    <div className={`flex flex-col items-center gap-[3px] ${jiggle ? 'animate-jiggle' : ''}`}>
      <div
        className="relative grid grid-cols-2 grid-rows-2 place-items-center overflow-hidden border border-white/25 bg-white/20 p-[5px] shadow-[0_6px_16px_rgba(0,0,0,0.18)] backdrop-blur-xl"
        style={{ width: iconSize + 10, height: iconSize + 10, borderRadius: radius }}
      >
        {apps.map((id) => (
          <MiniApp key={id} appId={id} size={iconSize * 0.36} />
        ))}
        {apps.length === 0 && <span className="col-span-2 row-span-2 text-sm text-white/70">Empty</span>}
      </div>
      <span
        className="max-w-[88px] truncate text-white"
        style={{ fontSize: labelSize, textShadow: '0 1px 3px rgba(0,0,0,0.55)' }}
      >
        {folder.name}
      </span>
    </div>
  );
}

function MiniApp({ appId, size }: { appId: string; size: number }) {
  const app = getApp(appId);
  if (!app) return null;
  const Icon = app.icon;
  return (
    <div
      className="flex items-center justify-center"
      style={{ background: app.bg, width: size, height: size, borderRadius: size * 0.224 }}
    >
      <Icon size={size * 0.55} strokeWidth={1.8} color={app.fg ?? '#fff'} />
    </div>
  );
}
