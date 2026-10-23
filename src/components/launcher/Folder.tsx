'use client';

// Folder overlay: 350ms open with cubic-bezier(0.2,0,0,1),
// 30dp-radius glass card, 4-column grid, renameable.

import { useState } from 'react';
import { useLauncher } from '@/lib/launcher/store';
import { MOTION, glassStyle } from '@/lib/launcher/glass';
import { AppIcon } from './AppIcon';
import { useDrag } from './DragLayer';
import type { PointerEvent as ReactPointerEvent } from 'react';

export function FolderOverlay() {
  const overlay = useLauncher((s) => s.overlay);
  const layout = useLauncher((s) => s.layout);
  const prefs = useLauncher((s) => s.prefs);
  const renameFolder = useLauncher((s) => s.renameFolder);
  const closeOverlay = useLauncher((s) => s.closeOverlay);
  const launchApp = useLauncher((s) => s.launchApp);
  const editMode = useLauncher((s) => s.editMode);
  const { start } = useDrag();
  const [renaming, setRenaming] = useState(false);

  const open = overlay.kind === 'folder';
  const folder = open ? layout.folders[overlay.folderId] : null;

  if (!open || !folder) return null;

  const iconSize = Math.round(390 * 0.153 * prefs.iconScale);

  return (
    <div className="absolute inset-0 z-50" role="dialog" aria-label={`Folder ${folder.name}`}>
      {/* scrim: fullscreen blur + dim (recovered scrim constants) */}
      <button
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(22px) saturate(140%)' }}
        onClick={closeOverlay}
        aria-label="Close folder"
      />

      <div
        className="absolute left-1/2 top-1/2 w-[342px] p-4"
        style={{
          ...glassStyle(30),
          transform: 'translate(-50%, -50%)',
          animation: `folderOpen ${MOTION.folderMs}ms cubic-bezier(0.2,0,0,1) both`,
        }}
      >
        <style>{`
          @keyframes folderOpen {
            from { opacity: 0; transform: translate(-50%, -46%) scale(0.82); }
            to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          }
        `}</style>

        {/* folder title */}
        {renaming ? (
          <input
            autoFocus
            defaultValue={folder.name}
            className="w-full rounded-md bg-black/5 px-2 py-1 text-center text-[15px] font-semibold text-black outline-none"
            onBlur={(e) => {
              renameFolder(folder.id, e.target.value);
              setRenaming(false);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                renameFolder(folder.id, (e.target as HTMLInputElement).value);
                setRenaming(false);
              }
            }}
            aria-label="Folder name"
          />
        ) : (
          <button
            className="w-full text-center text-[15px] font-semibold text-black/80"
            onDoubleClick={() => setRenaming(true)}
            onClick={() => setRenaming(true)}
          >
            {folder.name}
          </button>
        )}

        {/* apps grid */}
        <div className="mt-2 grid grid-cols-4 gap-x-1 gap-y-3">
          {folder.appIds.map((appId) => (
            <div
              key={appId}
              data-item-key={`folder-${folder.id}-${appId}`}
              className="drag-item flex justify-center"
              onPointerDown={(e) => {
                if (editMode) {
                  start({ from: 'folder', appId, folderId: folder.id }, e);
                }
              }}
              onClick={() => {
                if (!editMode) launchApp(appId);
              }}
            >
              <AppIcon appId={appId} size={iconSize} labelSize={10} />
            </div>
          ))}
        </div>

        {folder.appIds.length === 0 && (
          <p className="py-6 text-center text-xs text-black/50">Drag apps here</p>
        )}
      </div>
    </div>
  );
}
