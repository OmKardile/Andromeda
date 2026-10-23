'use client';

// DragLayer — the drag-and-drop engine.
//  • renders a lift-ghost that follows the pointer
//  • hit-tests annotated drop zones via document.elementFromPoint
//  • implements the recovered behaviors:
//      - drop app onto app  -> create folder (or merge into existing)
//      - dwell 650ms over occupied cell -> push-aside
//      - drop onto dock slot -> move to dock
//      - drop from drawer -> place app
//      - drop widget onto zero page -> move widget

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLauncher } from '@/lib/launcher/store';
import { getApp } from '@/lib/launcher/apps';
import type { DragPayload, WidgetInstance } from '@/lib/launcher/types';
import { AppIcon } from './AppIcon';
import { WIDGET_MAP } from './widgets/registry';
import { GLASS, MOTION } from '@/lib/launcher/glass';

interface DropInfo {
  kind: 'cell' | 'dock' | 'zero' | 'none';
  page?: number;
  col?: number;
  row?: number;
  index?: number;
  occupant?: string; // placed key of occupying app/folder item
  occupantFolder?: string;
}

interface DragContextValue {
  start: (payload: DragPayload, e: React.PointerEvent) => void;
}

const DragContext = createContext<DragContextValue>({ start: () => {} });
export const useDrag = () => useContext(DragContext);

function parseDrop(el: Element | null): DropInfo {
  if (!el) return { kind: 'none' };
  const zone = el.closest<HTMLElement>('[data-drop]');
  if (!zone) return { kind: 'none' };
  const ds = zone.dataset;
  if (ds.drop === 'cell') {
    return {
      kind: 'cell',
      page: Number(ds.page),
      col: Number(ds.col),
      row: Number(ds.row),
      occupant: ds.occupant || undefined,
      occupantFolder: ds.occupantFolder || undefined,
    };
  }
  if (ds.drop === 'dock') return { kind: 'dock', index: Number(ds.index), occupant: ds.occupant || undefined };
  if (ds.drop === 'zero') return { kind: 'zero' };
  return { kind: 'none' };
}

export function DragLayer({ children }: { children: ReactNode }) {
  const store = useLauncher;
  const [ghost, setGhost] = useState<{
    payload: DragPayload;
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);

  const hoverRef = useRef<{ info: DropInfo; since: number; pushed: boolean } | null>(null);
  const highlightedRef = useRef<HTMLElement | null>(null);

  const setHighlight = useCallback((el: HTMLElement | null) => {
    if (highlightedRef.current === el) return;
    highlightedRef.current?.style.removeProperty('box-shadow');
    highlightedRef.current?.style.removeProperty('transform');
    highlightedRef.current = el;
    if (el) {
      el.style.boxShadow = '0 0 0 2px rgba(255,255,255,0.85), 0 6px 18px rgba(0,0,0,0.25)';
      el.style.transform = 'scale(1.06)';
      el.style.borderRadius = '18px';
      el.style.transition = 'transform 120ms ease';
    }
  }, []);

  const clearHighlight = useCallback(() => setHighlight(null), [setHighlight]);

  const start = useCallback(
    (payload: DragPayload, e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      // prefer the item element (workspace icons pass the root as currentTarget)
      const itemEl = (e.target as HTMLElement | null)?.closest?.('[data-item-key]');
      const target = (itemEl ?? e.currentTarget) as HTMLElement;
      const rect = target.getBoundingClientRect();
      // close overlays so the workspace is droppable
      const s = store.getState();
      if (s.overlay.kind === 'drawer' || s.overlay.kind === 'folder') {
        // keep folder overlay open when dragging inside it
        if (payload.from !== 'folder') s.closeOverlay();
      }
      if (s.overlay.kind === 'edit-menu') s.closeOverlay();
      s.setDragging(payload);
      setGhost({ payload, x: e.clientX, y: e.clientY, w: rect.width, h: rect.height });
      hoverRef.current = null;
    },
    [store],
  );

  // window-level pointer tracking while a ghost exists
  // (keyed on the boolean "isDragging" — position updates via setGhost must
  // NOT re-run this effect, or the drag would die on the first pointermove)
  const isDragging = ghost !== null;
  const ghostRef = useRef(ghost);
  ghostRef.current = ghost;

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: PointerEvent) => {
      setGhost((g) => (g ? { ...g, x: e.clientX, y: e.clientY } : g));
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const info = parseDrop(el);

      // dwell push-aside (650ms over the same occupied cell)
      const h = hoverRef.current;
      if (
        info.kind === 'cell' &&
        h &&
        h.info.kind === 'cell' &&
        h.info.page === info.page &&
        h.info.col === info.col &&
        h.info.row === info.row &&
        info.occupant &&
        info.occupant !== ghostRef.current?.payload.placedKey
      ) {
        if (!h.pushed && performance.now() - h.since > MOTION.dwellMs) {
          h.pushed = true;
          store.getState().pushAside(info.page!, info.occupant);
        }
      } else {
        hoverRef.current = { info, since: performance.now(), pushed: false };
      }

      // highlight valid targets
      if (info.kind === 'cell' && !info.occupant) setHighlight(el?.closest<HTMLElement>('[data-drop]') ?? null);
      else if (info.kind === 'dock') setHighlight(el?.closest<HTMLElement>('[data-drop]') ?? null);
      else clearHighlight();
    };

    const onUp = (e: PointerEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const current = ghostRef.current;
      if (current) resolveDrop(current.payload, parseDrop(el));
      cleanup();
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') cleanup();
    };

    const cleanup = () => {
      clearHighlight();
      hoverRef.current = null;
      store.getState().setDragging(null);
      setGhost(null);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('keydown', onKey);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey);
    return cleanup;
  }, [isDragging, store, clearHighlight, setHighlight]);

  return (
    <DragContext.Provider value={{ start }}>
      {children}
      {ghost && (
        <div
          className="pointer-events-none fixed z-[100] origin-center"
          style={{
            left: ghost.x,
            top: ghost.y,
            transform: 'translate(-50%,-55%) scale(1.12)',
            filter: 'drop-shadow(0 12px 24px rgba(0,0,0,0.35))',
            transition: 'opacity 140ms ease',
          }}
          aria-hidden
        >
          <GhostContent payload={ghost.payload} w={ghost.w} h={ghost.h} />
        </div>
      )}
    </DragContext.Provider>
  );
}

function GhostContent({ payload, w, h }: { payload: DragPayload; w: number; h: number }) {
  if (payload.appId) {
    return <AppIcon appId={payload.appId} size={Math.max(44, Math.min(60, w))} label={false} />;
  }
  if (payload.widget) {
    const Comp = WIDGET_MAP[payload.widget.kind]?.component;
    if (Comp) {
      return (
        <div style={{ opacity: 0.96 }}>
          <Comp widget={payload.widget} width={Math.min(w, 380)} height={Math.min(h, 420)} mode="workspace" />
        </div>
      );
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Drop resolution
// ---------------------------------------------------------------------------

function resolveDrop(payload: DragPayload, drop: DropInfo): void {
  const s = useLauncher.getState();

  // any drop over "zero" only applies to widgets
  if (drop.kind === 'zero') {
    if (payload.widget) {
      if (payload.from === 'zero-page') return; // reorder handled elsewhere
      s.removeWidgetAnywhere(payload.widget.id);
      s.addZeroWidget(payload.widget as WidgetInstance);
    }
    return;
  }

  if (drop.kind === 'dock' && drop.index !== undefined && payload.appId) {
    const i = drop.index;
    if (payload.from === 'dock' && payload.originDockIndex !== undefined) {
      // swap or move within dock
      s.swapDock(payload.originDockIndex, i);
    } else if (payload.from === 'page' || payload.from === 'drawer-app' || payload.from === 'folder') {
      if (payload.from === 'page' && payload.originPage !== undefined && payload.placedKey) {
        s.removePlaced(payload.originPage, payload.placedKey);
      }
      if (payload.from === 'folder' && payload.folderId) {
        s.removeFromFolder(payload.folderId, payload.appId);
      }
      s.setDockSlot(payload.appId, i);
    }
    return;
  }

  if (drop.kind === 'cell' && drop.page !== undefined && drop.col !== undefined && drop.row !== undefined) {
    const { page, col, row } = drop;

    // ---- drop onto an occupant app/folder -> folder create/merge ----
    if (drop.occupant && payload.appId && payload.from === 'page' && payload.placedKey) {
      if (drop.occupant !== payload.placedKey) {
        if (drop.occupantFolder) {
          s.addToFolder(drop.occupantFolder, payload.appId);
          s.removePlaced(payload.originPage!, payload.placedKey);
        } else {
          s.createFolderAt(payload.originPage!, payload.placedKey, drop.occupant);
        }
        return;
      }
      // dropping back onto itself: no-op
      return;
    }

    // ---- widget from zero page to workspace ----
    if (payload.widget && payload.from === 'zero-page') {
      const w = payload.widget;
      if (w.span === 4 && col > 0) return;
      if (col + w.span > 4 || row + w.rows > 6) return;
      // temporarily remove then try placing at the target
      s.removeWidgetAnywhere(w.id);
      const ok = s.addWidget(w, page, col, row);
      if (!ok) s.addZeroWidget(w);
      return;
    }

    // ---- widget already on a page being moved ----
    if (payload.widget && payload.from === 'page' && payload.placedKey && payload.originPage !== undefined) {
      const w = payload.widget;
      if (w.span === 4 && col > 0) return;
      if (col + w.span > 4 || row + w.rows > 6) return;
      if (drop.occupant && drop.occupant !== payload.placedKey) {
        s.pushAside(page, drop.occupant);
      }
      s.movePlaced(payload.originPage, payload.placedKey, col, row);
      return;
    }

    // ---- app from page to page ----
    if (payload.appId && payload.from === 'page' && payload.placedKey && payload.originPage !== undefined) {
      if (drop.occupant && drop.occupantFolder) {
        s.addToFolder(drop.occupantFolder, payload.appId);
        s.removePlaced(payload.originPage, payload.placedKey);
        return;
      }
      if (drop.occupant) {
        // empty-ish handling: push aside then take the cell
        s.pushAside(page, drop.occupant);
      }
      s.movePlaced(payload.originPage, payload.placedKey, col, row);
      return;
    }

    // ---- app from dock to page ----
    if (payload.appId && payload.from === 'dock' && payload.originDockIndex !== undefined) {
      if (drop.occupant && drop.occupantFolder) {
        s.removeFromDock(payload.originDockIndex);
        s.addToFolder(drop.occupantFolder, payload.appId);
        return;
      }
      if (drop.occupant) s.pushAside(page, drop.occupant);
      s.removeFromDock(payload.originDockIndex);
      s.addAppToPage(payload.appId, page, col, row);
      return;
    }

    // ---- app from drawer to page ----
    if (payload.appId && payload.from === 'drawer-app') {
      if (drop.occupant && drop.occupantFolder) {
        s.addToFolder(drop.occupantFolder, payload.appId);
        return;
      }
      if (drop.occupant) s.pushAside(page, drop.occupant);
      s.addAppToPage(payload.appId, page, col, row);
      return;
    }

    // ---- app out of an open folder onto a page ----
    if (payload.appId && payload.from === 'folder' && payload.folderId) {
      if (drop.occupant && drop.occupantFolder && drop.occupantFolder === payload.folderId) {
        return; // dropped back into its own folder
      }
      if (drop.occupant) s.pushAside(page, drop.occupant);
      s.removeFromFolder(payload.folderId, payload.appId);
      s.addAppToPage(payload.appId, page, col, row);
      return;
    }
  }

  // invalid drop: state stays as-is (items snap back visually)
}

// re-export for convenience
export { GLASS };
