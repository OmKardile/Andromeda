'use client';

// WidgetHost — renders a widget via the registry with the glass card frame.

import type { WidgetInstance } from '@/lib/launcher/types';
import { WIDGET_MAP } from './widgets/registry';

export function WidgetHost({
  widget,
  width,
  height,
  mode,
}: {
  widget: WidgetInstance;
  width: number;
  height: number;
  mode: 'workspace' | 'full';
}) {
  const entry = WIDGET_MAP[widget.kind];
  const Comp = entry?.component;
  if (!Comp) {
    return (
      <div
        className="flex items-center justify-center rounded-[22px] bg-white/20 text-xs text-white/80 backdrop-blur-xl"
        style={{ width, height }}
      >
        {widget.kind}
      </div>
    );
  }
  return <Comp widget={widget} width={width} height={height} mode={mode} />;
}
