'use client';

// RemindersWidget — shows the open reminders with inline checkboxes
// (toggles straight from the home screen). Tap the header to open the app.

import { ChevronRight, ListTodo } from 'lucide-react';
import { useLauncher } from '@/lib/launcher/store';
import { glassStyle } from '@/lib/launcher/glass';
import type { WidgetProps } from './registry';

export function RemindersWidget({ width, height }: WidgetProps) {
  const reminders = useLauncher((s) => s.reminders);
  const toggleReminder = useLauncher((s) => s.toggleReminder);
  const launchApp = useLauncher((s) => s.launchApp);

  const open = reminders.filter((r) => !r.done);
  const shown = open.slice(0, 4);

  return (
    <div
      className="flex h-full w-full cursor-pointer flex-col overflow-hidden"
      style={{ ...glassStyle(22), padding: Math.max(10, height * 0.07) }}
      role="button"
      tabIndex={0}
      aria-label={`Reminders. ${open.length} open.`}
      onClick={() => launchApp('reminders')}
      onKeyDown={(e) => e.key === 'Enter' && launchApp('reminders')}
    >
      {/* header */}
      <div className="flex items-center gap-1.5">
        <ListTodo size={13} className="text-[#E8890C]" aria-hidden />
        <span className="text-[11px] font-bold uppercase tracking-wide text-black/55">Reminders</span>
        <ChevronRight size={13} className="ml-auto text-black/30" aria-hidden />
      </div>

      {/* items */}
      <div className="mt-1.5 flex min-h-0 flex-1 flex-col justify-center gap-1.5">
        {shown.length === 0 ? (
          <div className="text-center text-[12px] font-medium text-black/40">
            {reminders.length > 0 ? 'All done — nice!' : 'No reminders yet'}
          </div>
        ) : (
          shown.map((r) => (
            <div
              key={r.id}
              role="button"
              tabIndex={0}
              aria-label={`Toggle reminder: ${r.text}`}
              onClick={(e) => {
                e.stopPropagation();
                toggleReminder(r.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.stopPropagation();
                  toggleReminder(r.id);
                }
              }}
              className="flex min-w-0 items-center gap-2"
            >
              <span
                className="h-[15px] w-[15px] shrink-0 rounded-full border-[1.5px] border-black/25 transition hover:border-[#E8890C] hover:bg-[#E8890C]/10"
                aria-hidden
              />
              <span className="truncate text-[12px] font-medium leading-none text-black/80">{r.text}</span>
            </div>
          ))
        )}
      </div>

      {/* count footer */}
      <div className="mt-1 text-[10px] font-semibold text-black/40">
        {open.length} open{reminders.some((r) => r.done) ? ` · ${reminders.filter((r) => r.done).length} done` : ''}
      </div>
    </div>
  );
}
