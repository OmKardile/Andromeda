'use client';

// Context menu (edit-menu overlay): glass actions menu that appears on
// long-press. Actions depend on the target (app / folder / widget / wallpaper).

import { useEffect, useState } from 'react';
import {
  AppWindow,
  FolderInput,
  ImagePlus,
  LayoutGrid,
  Pencil,
  Trash2,
  EyeOff,
  Check,
} from 'lucide-react';
import { useLauncher } from '@/lib/launcher/store';
import { getApp } from '@/lib/launcher/apps';
import { MOTION, glassStyle } from '@/lib/launcher/glass';

export interface ContextMenuProps {
  onOpenWidgetPicker: () => void;
  onOpenWallpaperPicker: () => void;
}

export function ContextMenu({ onOpenWidgetPicker, onOpenWallpaperPicker }: ContextMenuProps) {
  const overlay = useLauncher((s) => s.overlay);
  const closeOverlay = useLauncher((s) => s.closeOverlay);

  if (overlay.kind !== 'edit-menu') return null;

  const { appId, folderId, widgetId, origin } = overlay;

  return (
    <ContextMenuBody
      appId={appId}
      folderId={folderId}
      widgetId={widgetId}
      origin={origin}
      closeFn={closeOverlay}
      onOpenWidgetPicker={onOpenWidgetPicker}
      onOpenWallpaperPicker={onOpenWallpaperPicker}
    />
  );
}

/** closes itself when the pointer drags >10px from the opening position
 *  (iOS menu behavior — also unblocks the hold-and-drag flow: once the menu
 *  is gone the workspace gesture sees the movement again) */
function useCloseOnDrag(origin: { x: number; y: number } | undefined, close: () => void) {
  useEffect(() => {
    if (!origin) return;
    const onMove = (e: PointerEvent) => {
      if (Math.hypot(e.clientX - origin.x, e.clientY - origin.y) > 10) {
        close();
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, [origin, close]);
}

function ContextMenuBody({
  appId,
  folderId,
  widgetId,
  origin,
  closeFn,
  onOpenWidgetPicker,
  onOpenWallpaperPicker,
}: {
  appId?: string;
  folderId?: string;
  widgetId?: string;
  origin?: { x: number; y: number };
  closeFn: () => void;
  onOpenWidgetPicker: () => void;
  onOpenWallpaperPicker: () => void;
}) {
  const closeOverlay = closeFn;
  const layout = useLauncher((s) => s.layout);
  const launchApp = useLauncher((s) => s.launchApp);
  const hideApp = useLauncher((s) => s.hideApp);
  const removePlaced = useLauncher((s) => s.removePlaced);
  const renameApp = useLauncher((s) => s.renameApp);
  const removeFolder = useLauncher((s) => s.removeFolder);
  const renameFolder = useLauncher((s) => s.renameFolder);
  const removeWidgetAnywhere = useLauncher((s) => s.removeWidgetAnywhere);
  const removeZeroWidget = useLauncher((s) => s.removeZeroWidget);
  const resetAll = useLauncher((s) => s.resetAll);
  const [renaming, setRenaming] = useState('');
  const [renameOpen, setRenameOpen] = useState(false);

  useCloseOnDrag(origin, closeOverlay);

  const app = appId ? getApp(appId) : null;

  // find where the app lives (page or dock) for removal
  const pageEntry = appId
    ? layout.pages.flatMap((p, pi) =>
        p
          .filter((it) => it.item.type === 'app' && it.item.appId === appId)
          .map((it) => ({ page: pi, key: it.key })),
      )[0]
    : undefined;
  const dockIdx = appId ? layout.dock.indexOf(appId) : -1;
  const zeroWidget = widgetId ? layout.zeroPage.find((w) => w.id === widgetId) : null;
  const pageWidget = widgetId
    ? layout.pages.flatMap((p, pi) =>
        p
          .filter((it) => it.item.type === 'widget' && it.item.widget.id === widgetId)
          .map((it) => ({ page: pi, key: it.key })),
      )[0]
    : undefined;

  const close = () => {
    setRenameOpen(false);
    closeOverlay();
  };

  type Row = { icon: React.ElementType; label: string; danger?: boolean; onClick: () => void; sub?: string };

  const rows: Row[] = [];

  if (app && appId) {
    rows.push({ icon: AppWindow, label: `Open ${app.name}`, onClick: () => { close(); launchApp(appId); } });
    rows.push({
      icon: Pencil,
      label: 'Rename',
      onClick: () => setRenameOpen(true),
    });
    if (pageEntry) {
      rows.push({
        icon: Trash2,
        label: 'Remove from Home Screen',
        danger: true,
        onClick: () => {
          removePlaced(pageEntry.page, pageEntry.key);
          close();
        },
      });
    }
    if (dockIdx !== -1) {
      rows.push({
        icon: Trash2,
        label: 'Remove from Dock',
        danger: true,
        onClick: () => {
          useLauncher.getState().removeFromDock(dockIdx);
          close();
        },
      });
    }
    rows.push({
      icon: EyeOff,
      label: 'Hide App',
      danger: true,
      onClick: () => {
        if (pageEntry) removePlaced(pageEntry.page, pageEntry.key);
        if (dockIdx !== -1) useLauncher.getState().removeFromDock(dockIdx);
        hideApp(appId);
        close();
      },
    });
  } else if (folderId) {
    rows.push({ icon: Pencil, label: 'Rename Folder', onClick: () => setRenameOpen(true) });
    rows.push({
      icon: FolderInput,
      label: 'Delete Folder',
      danger: true,
      sub: 'Apps return to the home screen',
      onClick: () => {
        removeFolder(folderId);
        close();
      },
    });
  } else if (widgetId) {
    rows.push({
      icon: Trash2,
      label: 'Remove Widget',
      danger: true,
      onClick: () => {
        if (pageWidget) removePlaced(pageWidget.page, pageWidget.key);
        if (zeroWidget) removeZeroWidget(widgetId);
        else removeWidgetAnywhere(widgetId);
        close();
      },
    });
  } else {
    // wallpaper / general edit menu
    rows.push({ icon: LayoutGrid, label: 'Add Widget', onClick: () => { close(); onOpenWidgetPicker(); } });
    rows.push({ icon: ImagePlus, label: 'Change Wallpaper', onClick: () => { close(); onOpenWallpaperPicker(); } });
    rows.push({
      icon: Trash2,
      label: 'Reset Layout',
      danger: true,
      onClick: () => {
        resetAll();
        close();
      },
    });
  }

  return (
    <>
      <div
        className="absolute inset-0 z-[60]"
        onClick={close}
        role="presentation"
      />
      <div
        className="absolute left-1/2 top-[110px] z-[61] w-[290px] overflow-hidden text-black"
        style={{
          ...glassStyle(14),
          background: 'rgba(250,250,252,0.86)',
          backdropFilter: 'blur(28px) saturate(170%)',
          transform: 'translateX(-50%)',
          animation: `menuIn ${MOTION.crossfadeMs}ms cubic-bezier(0.2,0,0,1) both`,
        }}
        role="menu"
      >
        <style>{`@keyframes menuIn { from { opacity: 0; transform: translateX(-50%) scale(0.9);} to { opacity: 1; transform: translateX(-50%) scale(1);} }`}</style>

        {renameOpen && (
          <div className="flex items-center gap-2 border-b border-black/8 px-3 py-2.5">
            <input
              autoFocus
              defaultValue={app?.name ?? (folderId ? layout.folders[folderId]?.name : '')}
              onChange={(e) => setRenaming(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (appId) renameApp(appId, renaming);
                  if (folderId) renameFolder(folderId, renaming);
                  close();
                }
                if (e.key === 'Escape') setRenameOpen(false);
              }}
              className="w-full rounded-md bg-black/5 px-2 py-1 text-[14px] outline-none"
              aria-label="New name"
              placeholder="New name"
            />
            <button
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white"
              onClick={() => {
                if (appId) renameApp(appId, renaming);
                if (folderId) renameFolder(folderId, renaming);
                close();
              }}
              aria-label="Confirm rename"
            >
              <Check size={14} />
            </button>
          </div>
        )}

        {rows.map((r, i) => (
          <button
            key={r.label}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-[14px] hover:bg-black/5"
            style={{ borderTop: i && !renameOpen ? '1px solid rgba(0,0,0,0.06)' : undefined }}
            onClick={r.onClick}
            role="menuitem"
          >
            <r.icon size={17} className={r.danger ? 'text-red-500' : 'text-black/70'} />
            <span className="flex-1">
              {r.label}
              {r.sub && <span className="block text-[11px] text-black/50">{r.sub}</span>}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
