'use client';

// Widget picker sheet — slides up in 267ms, lists the widget catalog grouped
// by function with mini icon previews, iOS-style size chips (Small / Wide /
// Large), and adds to the current page (or zero page fallback).

import { useState } from 'react';
import { Check, Info, X } from 'lucide-react';
import { useLauncher } from '@/lib/launcher/store';
import { newWidget } from '@/lib/launcher/storage';
import { WIDGET_MAP } from './widgets/registry';
import { MOTION } from '@/lib/launcher/glass';
import type { WidgetKind } from '@/lib/launcher/types';

/** Catalog grouped by function. */
const GROUPS: { label: string; kinds: WidgetKind[] }[] = [
  { label: 'Clock & Time', kinds: ['clock-analog', 'clock-digital', 'world-clock'] },
  { label: 'Calendar & Tasks', kinds: ['calendar', 'reminders'] },
  { label: 'Weather', kinds: ['weather'] },
  { label: 'Music & Media', kinds: ['music'] },
  { label: 'Essentials', kinds: ['battery', 'suggestions'] },
  { label: 'Photos', kinds: ['photo'] },
];

/** iOS-style widget size names: 2×2 Small, 4×2 Wide, 4×4 Large. */
function sizeLabel(span: number, rows: number): string {
  if (rows >= 4) return 'Large';
  if (span >= 4) return 'Wide';
  return 'Small';
}
const sizeOrder = (s: { span: number; rows: number }) => (s.rows >= 4 ? 2 : s.span >= 4 ? 1 : 0);

/** Tiny hand-drawn preview glyph per widget kind. */
function WidgetGlyph({ kind }: { kind: WidgetKind }) {
  const chip =
    'h-10 w-10 shrink-0 rounded-xl bg-white/10 p-1.5 text-white/85 ring-1 ring-inset ring-white/10';
  switch (kind) {
    case 'clock-analog':
      return (
        <svg viewBox="0 0 40 40" className={chip} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="20" cy="20" r="14" />
          <path d="M20 12v8l5.5 3.5" />
        </svg>
      );
    case 'clock-digital':
      return (
        <svg viewBox="0 0 40 40" className={chip} fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="5" y="11" width="30" height="18" rx="5" />
          <text x="20" y="24.5" textAnchor="middle" fontSize="10" fontWeight="600" fill="currentColor" stroke="none">
            9:41
          </text>
        </svg>
      );
    case 'world-clock':
      return (
        <svg viewBox="0 0 40 40" className={chip} fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="20" cy="20" r="14" />
          <ellipse cx="20" cy="20" rx="6.5" ry="14" />
          <path d="M6 20h28" />
        </svg>
      );
    case 'calendar':
      return (
        <svg viewBox="0 0 40 40" className={chip} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M13 5.5v3M27 5.5v3" />
          <rect x="6" y="8.5" width="28" height="26.5" rx="5" />
          <path d="M6 15.5h28" />
          {[0, 1, 2].map((r) =>
            [0, 1, 2].map((c) => (
              <circle
                key={`${r}-${c}`}
                cx={12.5 + c * 7.5}
                cy={21 + r * 6}
                r="1.9"
                fill={r === 1 && c === 1 ? '#34C759' : 'currentColor'}
                stroke="none"
              />
            )),
          )}
        </svg>
      );
    case 'weather':
      return (
        <svg viewBox="0 0 40 40" className={chip} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="29.5" cy="12" r="4" />
          <path d="M7 20.5a5.5 5.5 0 0 1 .7-10.94A8.5 8.5 0 0 1 24.4 12.7 5.25 5.25 0 0 1 23.5 23H12a5 5 0 0 1-5-2.5Z" />
        </svg>
      );
    case 'battery':
      return (
        <svg viewBox="0 0 40 40" className={chip} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17.5 5.5h5" strokeWidth="3" strokeLinecap="round" />
          <rect x="14" y="8.5" width="12" height="24" rx="3.5" />
          <rect x="16.5" y="17.5" width="7" height="11" rx="1.5" fill="#34C759" stroke="none" />
        </svg>
      );
    case 'photo':
      return (
        <svg viewBox="0 0 40 40" className={chip} fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
          <rect x="6" y="9" width="28" height="22" rx="4.5" />
          <circle cx="14.5" cy="16" r="2" fill="currentColor" stroke="none" />
          <path d="M9 28l6.5-7 4.5 4.5 4-5L31 28" strokeLinecap="round" />
        </svg>
      );
    case 'suggestions':
      return (
        <svg viewBox="0 0 40 40" className={chip}>
          <path
            d="M20 8l2.3 6.2 6.2 2.3-6.2 2.3L20 25l-2.3-6.2-6.2-2.3 6.2-2.3z"
            fill="currentColor"
          />
          <circle cx="30" cy="28" r="2.2" fill="currentColor" />
          <circle cx="11" cy="29" r="1.6" fill="currentColor" />
        </svg>
      );
    case 'music':
      return (
        <svg viewBox="0 0 40 40" className={chip} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <circle cx="14.5" cy="27" r="4" fill="#FA2C55" stroke="none" />
          <circle cx="28.5" cy="24" r="4" fill="#FA2C55" stroke="none" />
          <path d="M18.5 27V11l14-3v16" />
        </svg>
      );
    case 'reminders':
      return (
        <svg viewBox="0 0 40 40" className={chip} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="20" cy="20" r="13.5" />
          <path d="M15.5 14.5v5M16.5 21.5l3.5 3 5-6.5" stroke="#E8890C" />
        </svg>
      );
  }
}

export function WidgetPicker({ open, onClose }: { open: boolean; onClose: () => void }) {
  const addZeroWidget = useLauncher((s) => s.addZeroWidget);
  const addWidget = useLauncher((s) => s.addWidget);
  const page = useLauncher((s) => s.page);
  const [added, setAdded] = useState<string | null>(null);

  if (!open) return null;

  const add = (kind: string, span: 2 | 4, rows: 2 | 4) => {
    const w = newWidget(kind as never, { span, rows });
    // try the current workspace page first if we're on one, else zero page
    const target = page >= 0 ? 'page' : 'zero';
    if (target === 'page') {
      const ok = addWidget(w, page);
      if (!ok) addZeroWidget(w);
    } else {
      addZeroWidget(w);
    }
    setAdded(kind + span + rows);
    setTimeout(() => {
      setAdded(null);
      onClose();
    }, 450);
  };

  return (
    <div className="absolute inset-0 z-[70] flex items-end" role="dialog" aria-label="Widget picker">
      <button
        className="absolute inset-0 bg-black/45"
        style={{ backdropFilter: 'blur(6px)' }}
        onClick={onClose}
        aria-label="Close picker"
      />
      <div
        className="relative w-full rounded-t-[28px] bg-[#1c1c1e]/95 px-5 pb-8 pt-4 text-white"
        style={{
          animation: `sheetUp ${MOTION.sheetMs}ms cubic-bezier(0.2,0,0,1)`,
          backdropFilter: 'blur(30px)',
        }}
      >
        <style>{`@keyframes sheetUp { from { transform: translateY(100%);} to { transform: translateY(0);} }`}</style>
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/30" />
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Widgets</h2>
            <p className="text-[11px] text-white/50">Tap a size to add it where you are</p>
          </div>
          <button
            className="rounded-full bg-white/15 p-1.5 transition hover:bg-white/25"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
          {GROUPS.map((group) => (
            <section key={group.label}>
              <h3 className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/40">
                {group.label}
              </h3>
              <div className="space-y-2">
                {group.kinds.map((kind) => {
                  const entry = WIDGET_MAP[kind];
                  if (!entry) return null;
                  const sizes = [...entry.sizes].sort((a, b) => sizeOrder(a) - sizeOrder(b));
                  return (
                    <div
                      key={entry.kind}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/8 p-3"
                    >
                      <WidgetGlyph kind={entry.kind} />
                      <div className="min-w-0 flex-1">
                        <h4 className="truncate text-sm font-semibold">{entry.title}</h4>
                        <p className="truncate text-xs text-white/60">{entry.description}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {sizes.map((s) => (
                            <button
                              key={`${s.span}x${s.rows}`}
                              title={`${s.span}×${s.rows} cells`}
                              className="flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5 text-[11px] font-medium transition hover:bg-white/20 active:scale-95"
                              onClick={() => add(entry.kind, s.span, s.rows)}
                            >
                              {added === entry.kind + s.span + s.rows && (
                                <Check size={12} className="text-emerald-400" />
                              )}
                              {sizeLabel(s.span, s.rows)}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[11px] text-white/50">
          <Info size={12} className="shrink-0 text-white/35" />
          Long-press to move, drop on the left page for full size.
        </p>
      </div>
    </div>
  );
}
