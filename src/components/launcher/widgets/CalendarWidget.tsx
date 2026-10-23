'use client';

// Calendar widget — month view + "Up Next" events.
// Recovered constants: text black, event bar #59A7D7, weekend numbers
// #993C3C43, today oval #B2E83F34 (red), grid line #DDDDDD.
// Demo events are deterministic per weekday; "Up Next" shows today's
// events that have not started yet, else tomorrow's first events.

import type { CSSProperties, ReactNode } from 'react';
import { useLauncher } from '@/lib/launcher/store';
import type { WidgetProps } from './registry';

const INK = '#1C1C1E';
const RED = '#FF3B30';
const BAR = '#59A7D7'; // recovered event bar color
const WEEKEND = 'rgba(60,60,67,0.55)'; // #993C3C43 ≈ 60% ink
const LINE = '#DDDDDD';
const MUTED = 'rgba(60,60,67,0.52)';

interface Ev {
  t: string;
  title: string;
}

const WEEK_EVENTS: Ev[][] = [
  [
    { t: '10:00 AM', title: 'Photography walk' },
    { t: '12:30 PM', title: 'Brunch with Maya' },
    { t: '5:00 PM', title: 'Tennis with Sam' },
  ],
  [
    { t: '9:30 AM', title: 'Team standup' },
    { t: '2:00 PM', title: 'Design review' },
    { t: '6:30 PM', title: 'Gym' },
  ],
  [
    { t: '9:30 AM', title: 'Team standup' },
    { t: '1:00 PM', title: 'Product sync' },
    { t: '7:15 PM', title: 'Yoga class' },
  ],
  [
    { t: '9:30 AM', title: 'Team standup' },
    { t: '11:00 AM', title: '1:1 with Priya' },
    { t: '3:30 PM', title: 'Sprint demo' },
  ],
  [
    { t: '9:30 AM', title: 'Team standup' },
    { t: '2:00 PM', title: 'Design review' },
    { t: '6:30 PM', title: 'Gym' },
  ],
  [
    { t: '10:00 AM', title: 'Coffee with Alex' },
    { t: '4:00 PM', title: 'Weekly review' },
    { t: '8:00 PM', title: 'Movie night' },
  ],
  [
    { t: '9:00 AM', title: 'Farmers market' },
    { t: '11:00 AM', title: 'Call mom' },
    { t: '7:30 PM', title: 'Dinner reservation' },
  ],
];

function parseMinutes(t: string): number {
  const mt = /(\d+):(\d+)\s*(AM|PM)/i.exec(t);
  if (!mt) return 0;
  let h = parseInt(mt[1], 10) % 12;
  const mm = parseInt(mt[2], 10);
  if (mt[3].toUpperCase() === 'PM') h += 12;
  return h * 60 + mm;
}

function upcoming(now: Date, count: number): { ev: Ev; when: 'Today' | 'Tomorrow' }[] {
  const mins = now.getHours() * 60 + now.getMinutes();
  const today = WEEK_EVENTS[now.getDay()]
    .map((ev) => ({ ev, m: parseMinutes(ev.t) }))
    .sort((a, b) => a.m - b.m)
    .filter((x) => x.m >= mins)
    .slice(0, count)
    .map((x) => ({ ev: x.ev, when: 'Today' as const }));
  if (today.length > 0) return today;
  return WEEK_EVENTS[(now.getDay() + 1) % 7]
    .slice(0, count)
    .map((ev) => ({ ev, when: 'Tomorrow' as const }));
}

/** Month matrix, Sunday-first. null = padding cell. */
function monthMatrix(y: number, m: number): (number | null)[][] {
  const first = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: first }, () => null),
    ...Array.from({ length: days }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);
  const rows: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

export function CalendarWidget({ width, height }: WidgetProps) {
  useLauncher((s) => s.tick); // keeps "Up Next" current
  const blurEnabled = useLauncher((s) => s.prefs.blurEnabled);

  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const todayD = now.getDate();
  const rows = monthMatrix(y, m);
  const tall = height > 230; // 4×4-style layout
  const evCount = tall ? 3 : 2;
  const events = upcoming(now, evCount);
  const tomorrow = events[0]?.when === 'Tomorrow';

  return (
    <div style={card(width, height, blurEnabled)}>
      <div
        className="flex h-full w-full"
        style={{ padding: tall ? 15 : 12, gap: 12, flexDirection: tall ? 'column' : 'row' }}
      >
        {/* month grid */}
        <div
          className="flex min-w-0 flex-col"
          style={{ width: tall ? '100%' : '46%' }}
        >
          <div className="mb-1 flex items-baseline justify-between">
            <span style={{ fontSize: tall ? 14 : 12.5, fontWeight: 600, color: INK }}>
              {now.toLocaleDateString('en-US', { month: 'long' })}
            </span>
            <span style={{ fontSize: 9.5, fontWeight: 500, color: MUTED }}>
              {tall ? y : now.toLocaleDateString('en-US', { month: 'short' })}
            </span>
          </div>
          <div
            className="grid grid-cols-7"
            style={{ paddingBottom: tall ? 3 : 2, borderBottom: `1px solid ${LINE}` }}
          >
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <span
                key={i}
                style={{
                  fontSize: tall ? 9.5 : 8,
                  fontWeight: 600,
                  textAlign: 'center',
                  color: 'rgba(255,59,48,0.78)',
                }}
              >
                {d}
              </span>
            ))}
          </div>
          <div
            className="grid flex-1 grid-cols-7"
            style={{ gridTemplateRows: `repeat(${rows.length}, 1fr)` }}
          >
            {rows.flat().map((d, i) => {
              const weekend = i % 7 === 0 || i % 7 === 6;
              const isToday = d === todayD;
              return (
                <div key={i} className="flex items-center justify-center">
                  {d !== null &&
                    (isToday ? (
                      <span
                        className="flex items-center justify-center"
                        style={{
                          width: tall ? 21 : 15,
                          height: tall ? 21 : 15,
                          borderRadius: 999,
                          background: RED,
                          color: '#FFFFFF',
                          fontSize: tall ? 11.5 : 9,
                          fontWeight: 600,
                        }}
                      >
                        {d}
                      </span>
                    ) : (
                      <span
                        style={{
                          fontSize: tall ? 11.5 : 9.5,
                          fontWeight: 500,
                          color: weekend ? WEEKEND : INK,
                        }}
                      >
                        {d}
                      </span>
                    ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* events */}
        {!tall && <div style={{ width: 1, background: 'rgba(28,28,29,0.09)' }} />}
        <div
          className="flex min-w-0 flex-col"
          style={{
            flex: 1,
            paddingTop: tall ? 10 : 2,
            borderTop: tall ? `1px solid ${LINE}` : undefined,
            justifyContent: tall ? 'flex-start' : 'center',
            gap: tall ? 7 : 10,
          }}
        >
          <div className="flex items-baseline justify-between">
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.16em',
                color: MUTED,
              }}
            >
              UP NEXT
            </span>
            {tomorrow && (
              <span style={{ fontSize: 9, fontWeight: 600, color: '#FF9500' }}>TOMORROW</span>
            )}
          </div>
          {events.map(({ ev }) => (
            <EventRow key={ev.title} ev={ev} tall={tall} />
          ))}
          {events.length === 0 && (
            <span style={{ fontSize: 11, color: MUTED }}>Nothing scheduled — enjoy the calm.</span>
          )}
        </div>
      </div>
    </div>
  );
}

function EventRow({ ev, tall }: { ev: Ev; tall: boolean }): ReactNode {
  return (
    <div className="flex min-w-0 items-center" style={{ gap: 8 }}>
      <span
        style={{
          width: 3,
          alignSelf: 'stretch',
          minHeight: 14,
          borderRadius: 2,
          background: BAR,
        }}
      />
      <span
        className="min-w-0 flex-1 truncate"
        style={{ fontSize: tall ? 11.5 : 11, fontWeight: 500, color: INK }}
      >
        {ev.title}
      </span>
      <span className="tabular-nums" style={{ fontSize: tall ? 10.5 : 10, color: MUTED, whiteSpace: 'nowrap' }}>
        {ev.t}
      </span>
    </div>
  );
}

/** Light glass card — rgba(255,255,255,0.40) + blur + white edge. */
function card(width: number, height: number, blurEnabled: boolean): CSSProperties {
  return {
    width,
    height,
    position: 'relative',
    borderRadius: 22,
    background: blurEnabled ? 'rgba(255,255,255,0.40)' : 'rgba(255,255,255,0.94)',
    backdropFilter: blurEnabled ? 'blur(24px) saturate(160%)' : undefined,
    WebkitBackdropFilter: blurEnabled ? 'blur(24px) saturate(160%)' : undefined,
    boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.28), 0 8px 28px rgba(0,0,0,0.16)',
    overflow: 'hidden',
  };
}
