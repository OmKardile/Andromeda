'use client';

// RemindersApp — iOS-style reminder lists: quick add with rounded rows,
// circled checkboxes, swipe-free delete buttons, "Clear Completed",
// and list buckets (Today / Scheduled / All). Persists via the store.

import { useState } from 'react';
import { CalendarDays, ChevronLeft, Inbox, ListTodo, Plus, Sun, Trash2 } from 'lucide-react';
import { useLauncher } from '@/lib/launcher/store';

type Bucket = 'today' | 'scheduled' | 'all';

const BUCKETS: { id: Bucket; label: string; icon: React.ComponentType<{ size?: number | string; strokeWidth?: number | string }>; tint: string }[] = [
  { id: 'today', label: 'Today', icon: Sun, tint: '#0A84FF' },
  { id: 'scheduled', label: 'Scheduled', icon: CalendarDays, tint: '#FF3B30' },
  { id: 'all', label: 'All', icon: Inbox, tint: '#8E8E93' },
];

export function RemindersApp() {
  const reminders = useLauncher((s) => s.reminders);
  const addReminder = useLauncher((s) => s.addReminder);
  const toggleReminder = useLauncher((s) => s.toggleReminder);
  const removeReminder = useLauncher((s) => s.removeReminder);
  const clearDoneReminders = useLauncher((s) => s.clearDoneReminders);
  const closeOverlay = useLauncher((s) => s.closeOverlay);
  const prefs = useLauncher((s) => s.prefs);

  const [draft, setDraft] = useState('');
  const [bucket, setBucket] = useState<Bucket>('today');

  const dark = prefs.darkMode;
  const bg = dark ? '#0B0B0D' : '#F2F2F7';
  const card = dark ? 'bg-white/8' : 'bg-white';
  const border = dark ? 'border-white/10' : 'border-black/5';
  const primaryText = dark ? 'text-white' : 'text-black';
  const secondaryText = dark ? 'text-white/45' : 'text-black/45';

  const list = reminders.filter((r) => (bucket === 'all' ? true : r.list === bucket));
  const openCount = list.filter((r) => !r.done).length;
  const doneCount = list.filter((r) => r.done).length;

  const submit = () => {
    if (!draft.trim()) return;
    addReminder(draft, bucket);
    setDraft('');
  };

  return (
    <div className={`launcher-scroll relative flex min-h-0 flex-1 flex-col overflow-y-auto ${primaryText}`} style={{ background: bg }}>
      {/* top bar */}
      <div className="flex items-center justify-between px-5 pb-2 pt-[58px]">
        <h1 className="text-[34px] font-bold" style={{ color: '#E8890C' }}>
          Reminders
        </h1>
        <button
          type="button"
          onClick={closeOverlay}
          className={`flex h-11 items-center gap-0.5 rounded-full pl-2 pr-4 text-[15px] font-medium active:opacity-70 ${
            dark ? 'bg-white/10 text-white' : 'bg-black/[0.06] text-black'
          }`}
          aria-label="Back to home screen"
        >
          <ChevronLeft size={18} strokeWidth={2.5} /> Home
        </button>
      </div>

      {/* bucket cards */}
      <div className="grid grid-cols-3 gap-2.5 px-5 pt-2">
        {BUCKETS.map((b) => {
          const count =
            b.id === 'all'
              ? reminders.filter((r) => !r.done).length
              : reminders.filter((r) => !r.done && r.list === b.id).length;
          const active = bucket === b.id;
          const Icon = b.icon;
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setBucket(b.id)}
              aria-pressed={active}
              className={`flex flex-col items-start rounded-2xl border p-3 text-left transition active:scale-[0.97] ${card} ${
                active ? 'ring-2 ring-[#E8890C]' : ''
              } ${border}`}
            >
              <div className="flex items-center gap-1.5">
                <Icon size={13} />
                <span className="text-[12px] font-semibold opacity-70">{b.label}</span>
              </div>
              <span className="mt-1 text-[22px] font-bold tabular-nums">{count}</span>
            </button>
          );
        })}
      </div>

      {/* quick add */}
      <div className="px-5 pt-4">
        <div className={`flex items-center gap-2 rounded-2xl border p-2 pl-3.5 ${card} ${border}`}>
          <Plus size={18} className="shrink-0 opacity-40" />
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="New Reminder"
            aria-label="New reminder text"
            className={`min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:opacity-40 ${primaryText}`}
          />
          {draft.trim() && (
            <button
              type="button"
              onClick={submit}
              className="shrink-0 rounded-full bg-[#E8890C] px-3.5 py-1.5 text-[13px] font-semibold text-white transition active:scale-95"
            >
              Add
            </button>
          )}
        </div>
      </div>

      {/* list */}
      <div className="px-5 pb-12 pt-3">
        {list.length === 0 ? (
          <div className={`py-14 text-center text-[15px] ${secondaryText}`}>
            <ListTodo size={34} className="mx-auto mb-3 opacity-30" aria-hidden />
            No reminders in {BUCKETS.find((b) => b.id === bucket)?.label}
          </div>
        ) : (
          <ul className={`overflow-hidden rounded-2xl border ${card} ${border}`} role="list">
            {list.map((r, i) => (
              <li
                key={r.id}
                className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? (dark ? 'border-t border-white/8' : 'border-t border-black/5') : ''}`}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={r.done}
                  aria-label={`Mark "${r.text}" as ${r.done ? 'open' : 'done'}`}
                  onClick={() => toggleReminder(r.id)}
                  className="flex h-[23px] w-[23px] shrink-0 items-center justify-center rounded-full border-[1.5px] transition active:scale-90"
                  style={{
                    borderColor: r.done ? '#E8890C' : dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
                    background: r.done ? '#E8890C' : 'transparent',
                  }}
                >
                  {r.done && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path d="M2.5 6.5 5 9l4.5-6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => toggleReminder(r.id)}
                  className={`min-w-0 flex-1 text-left text-[16px] transition ${
                    r.done ? `line-through ${secondaryText}` : primaryText
                  }`}
                >
                  {r.text}
                </button>
                <span className={`shrink-0 text-[11px] ${secondaryText}`}>{r.list}</span>
                <button
                  type="button"
                  onClick={() => removeReminder(r.id)}
                  className="shrink-0 rounded-full p-1.5 transition hover:bg-red-500/15 active:scale-90"
                  aria-label={`Delete reminder "${r.text}"`}
                >
                  <Trash2 size={15} className="text-red-500/70" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {doneCount > 0 && (
          <button
            type="button"
            onClick={clearDoneReminders}
            className="mt-4 w-full rounded-2xl border border-red-500/25 bg-red-500/10 py-3 text-[14px] font-semibold text-red-500 transition active:scale-[0.98]"
          >
            Clear {doneCount} Completed
          </button>
        )}
      </div>
    </div>
  );
}
