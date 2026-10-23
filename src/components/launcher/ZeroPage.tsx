'use client';

// Zero page — the widget host page left of the home screen.
//  • vertical stack of large widget cards (full mode)
//  • "+" tile opens the widget picker sheet (267ms slide-up)
//  • drop zone: widgets dropped here move to the zero page
//  • long-press a card -> context menu (remove / reorder handled in menu)

import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Plus } from 'lucide-react';
import { useLauncher } from '@/lib/launcher/store';
import { MOTION } from '@/lib/launcher/glass';
import { WidgetHost } from './WidgetHost';
import { useDrag } from './DragLayer';
import { WidgetPicker } from './WidgetPicker';

export function ZeroPage() {
  const zeroPage = useLauncher((s) => s.layout.zeroPage);
  const editMode = useLauncher((s) => s.editMode);
  const setOverlay = useLauncher((s) => s.setOverlay);
  const setEditMode = useLauncher((s) => s.setEditMode);
  const dragging = useLauncher((s) => s.dragging);
  const { start } = useDrag();
  const [pickerOpen, setPickerOpen] = useState(false);
  const pressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cardW = 390 - 24;
  const cardH = (kind: string, span: number, rows: number) =>
    kind === 'photo' || kind === 'battery' ? (rows * 130) : rows === 2 ? 148 : 300;

  const onCardPointerDown = (e: ReactPointerEvent<HTMLDivElement>, id: string) => {
    if (editMode) {
      // immediate drag
      const w = zeroPage.find((x) => x.id === id);
      if (w) start({ from: 'zero-page', widget: w }, e);
      return;
    }
    pressTimer.current = setTimeout(() => {
      setEditMode(true);
      setOverlay({ kind: 'edit-menu', widgetId: id, origin: { x: e.clientX, y: e.clientY } });
    }, MOTION.longPressMs);
  };

  const clearPress = () => {
    if (pressTimer.current) clearTimeout(pressTimer.current);
    pressTimer.current = null;
  };

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden" data-drop="zero">
      <div
        className="flex flex-wrap content-start gap-4 px-3 pb-40 pt-[68px]"
        style={{ pointerEvents: dragging ? 'none' : 'auto' }}
      >
        {zeroPage.length === 0 && (
          <div className="mt-24 text-center text-white/70">
            <p className="text-sm font-medium">No widgets yet</p>
            <p className="mt-1 text-xs opacity-80">Swipe to the right to go home, or add a widget below.</p>
          </div>
        )}
        {zeroPage.map((w) => (
          <div
            key={w.id}
            data-item-key={`z-${w.id}`}
            className="relative"
            style={{ width: w.span === 4 ? '100%' : `calc(50% - 8px)` }}
            onPointerDown={(e) => onCardPointerDown(e, w.id)}
            onPointerUp={clearPress}
            onPointerLeave={clearPress}
            onPointerCancel={clearPress}
          >
            <WidgetHost widget={w} width={w.span === 4 ? cardW : cardW / 2 - 6} height={cardH(w.kind, w.span, w.rows)} mode="full" />
          </div>
        ))}

        {editMode && (
          <button
            className="mx-auto mt-2 flex h-16 w-16 items-center justify-center rounded-full border border-dashed border-white/50 text-white/80"
            onClick={() => setPickerOpen(true)}
            aria-label="Add widget"
          >
            <Plus size={26} />
          </button>
        )}
      </div>

      <WidgetPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </div>
  );
}
