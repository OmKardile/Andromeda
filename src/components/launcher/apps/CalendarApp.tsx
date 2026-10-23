'use client';

// Calendar — month grid with today highlighted (red circle), demo event
// dots (#59A7D7) on deterministic days (3rd, 12th, 21st), month
// navigation, and an Events list for the displayed month.

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLauncher } from '@/lib/launcher/store';

interface MonthCursor {
  y: number;
  m: number; // 0-based
}

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

const DEMO_EVENTS: { day: number; time: string; title: string; color: string }[] = [
  { day: 3, time: '10:00', title: 'Design review', color: '#59A7D7' },
  { day: 3, time: '15:30', title: '1:1 with Priya', color: '#59A7D7' },
  { day: 12, time: '12:30', title: 'Lunch with Sam', color: '#FF9F0A' },
  { day: 21, time: '06:45', title: 'Flight to Delhi', color: '#34C759' },
];

const EVENT_DAYS = new Set(DEMO_EVENTS.map((e) => e.day));

function monthTitle(c: MonthCursor): string {
  return new Date(c.y, c.m, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function CalendarApp() {
  const closeOverlay = useLauncher((s) => s.closeOverlay);
  const today = new Date();
  const [cursor, setCursor] = useState<MonthCursor>({ y: today.getFullYear(), m: today.getMonth() });

  const firstWeekday = new Date(cursor.y, cursor.m, 1).getDay();
  const gridStart = 1 - firstWeekday; // cell value for the first cell
  const cells = Array.from({ length: 42 }, (_, i) => new Date(cursor.y, cursor.m, gridStart + i));

  const isCurrentMonth =
    cursor.y === today.getFullYear() && cursor.m === today.getMonth();

  const shiftMonth = (delta: number) => {
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  };

  const monthEvents = DEMO_EVENTS.map((e) => ({
    ...e,
    date: new Date(cursor.y, cursor.m, e.day),
  }));

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[#F2F2F7]">
      <div className="launcher-scroll min-h-0 flex-1 overflow-y-auto pb-10">
        {/* header */}
        <div className="flex items-center justify-between px-5 pb-2 pt-[58px]">
          <h1 className="text-[34px] font-bold text-black">{monthTitle(cursor)}</h1>
          <button
            type="button"
            onClick={closeOverlay}
            className="flex h-11 items-center gap-0.5 rounded-full bg-black/[0.06] pl-2 pr-4 text-[15px] font-medium text-black active:bg-black/10"
            aria-label="Back to home screen"
          >
            <ChevronLeft size={18} strokeWidth={2.5} /> Home
          </button>
        </div>

        {/* month nav */}
        <div className="flex items-center justify-between px-5 pb-2">
          {isCurrentMonth ? (
            <span className="text-[13px] font-medium text-black/35">This month</span>
          ) : (
            <button
              type="button"
              onClick={() => setCursor({ y: today.getFullYear(), m: today.getMonth() })}
              className="flex h-11 items-center rounded-full px-3 text-[15px] font-medium text-[#FF3B30] active:bg-black/5"
              aria-label="Jump to current month"
            >
              Today
            </button>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.06] text-black active:bg-black/10"
              aria-label="Previous month"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-black/[0.06] text-black active:bg-black/10"
              aria-label="Next month"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        </div>

        {/* month card */}
        <div className="mx-[10px] rounded-[10px] bg-white px-2 pb-4 pt-2">
          <div className="grid grid-cols-7">
            {WEEKDAYS.map((w, i) => (
              <div key={i} className="flex h-8 items-center justify-center text-[12px] font-semibold text-black/40">
                {w}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((d) => {
              const inMonth = d.getMonth() === cursor.m;
              const isToday = isCurrentMonth && d.getDate() === today.getDate();
              const hasEvent = inMonth && EVENT_DAYS.has(d.getDate());
              return (
                <div
                  key={d.getTime()}
                  className="relative flex h-[44px] flex-col items-center justify-center"
                >
                  <span
                    className={`flex h-[32px] w-[32px] items-center justify-center rounded-full text-[16px] tabular-nums ${
                      isToday
                        ? 'bg-[#FF3B30] font-semibold text-white'
                        : inMonth
                          ? 'text-black'
                          : 'text-black/25'
                    }`}
                  >
                    {d.getDate()}
                  </span>
                  {hasEvent && (
                    <span className="absolute bottom-[4px] h-[5px] w-[5px] rounded-full bg-[#59A7D7]" aria-label="Has events" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* events */}
        <h2 className="px-5 pb-2 pt-6 text-[20px] font-bold text-black">Events</h2>
        <div className="mx-[10px] overflow-hidden rounded-[10px] bg-white">
          {monthEvents.map((e, i) => (
            <div key={`${e.day}-${e.time}`} className="relative flex min-h-[56px] items-center gap-3 px-4 py-2">
              {i > 0 && <span className="absolute bottom-0 left-[60px] right-0 h-px bg-black/[0.08]" aria-hidden />}
              <div className="flex w-12 shrink-0 flex-col items-center">
                <span className="text-[11px] font-semibold uppercase text-[#FF3B30]">
                  {e.date.toLocaleDateString('en-US', { weekday: 'short' })}
                </span>
                <span className="text-[19px] font-semibold text-black tabular-nums">{e.day}</span>
              </div>
              <div className="h-9 w-[3px] shrink-0 rounded-full" style={{ background: e.color }} />
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-[15px] font-medium text-black">{e.title}</span>
                <span className="text-[13px] text-black/50 tabular-nums">{e.time}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="px-5 pt-4 text-center text-[12px] text-black/35">
          Demo calendar — events are placeholders
        </p>
      </div>
    </div>
  );
}
