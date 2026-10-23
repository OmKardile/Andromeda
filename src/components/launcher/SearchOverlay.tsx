'use client';

// Spotlight-style search overlay: history, live app results, quick actions.

import { useMemo, useState } from 'react';
import { ArrowUpRight, Clock3, Search, X } from 'lucide-react';
import { useLauncher } from '@/lib/launcher/store';
import { displayName, visibleApps } from '@/lib/launcher/apps';
import { getApp } from '@/lib/launcher/apps';
import { MOTION, glassStyle } from '@/lib/launcher/glass';

export function SearchOverlay() {
  const overlay = useLauncher((s) => s.overlay);
  const prefs = useLauncher((s) => s.prefs);
  const closeOverlay = useLauncher((s) => s.closeOverlay);
  const launchApp = useLauncher((s) => s.launchApp);
  const pushHistory = useLauncher((s) => s.pushHistory);
  const clearHistory = useLauncher((s) => s.clearHistory);
  const [query, setQuery] = useState('');
  const open = overlay.kind === 'search';

  const results = useMemo(() => {
    if (!open) return [];
    const q = query.trim().toLowerCase();
    const list = visibleApps(prefs).map((a) => ({ a, name: displayName(a.id, prefs) }));
    if (!q) return [];
    return list.filter((x) => x.name.toLowerCase().includes(q)).slice(0, 8);
  }, [open, prefs, query]);

  if (!open) return null;

  const submit = (value: string) => {
    if (!value.trim()) return;
    pushHistory(value);
  };

  return (
    <div className="absolute inset-0 z-50" role="dialog" aria-label="Search">
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(24px) saturate(130%)',
          animation: `fadeIn ${MOTION.overlayMs}ms ease both`,
        }}
        onClick={closeOverlay}
      />
      <style>{`@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>

      <div
        className="absolute inset-x-4 top-[76px]"
        style={{ animation: `spotIn ${MOTION.overlayMs}ms cubic-bezier(0.25,0.1,0.25,1) both` }}
      >
        <style>{`@keyframes spotIn { from { transform: translateY(14px) scale(0.97); opacity: 0; } to { transform: none; opacity: 1; } }`}</style>

        <div className="flex items-center gap-2 px-3 py-2.5" style={glassStyle(14, { dark: true })}>
          <Search size={16} className="shrink-0 text-white/75" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                submit(query);
                if (results[0]) {
                  launchApp(results[0].a.id);
                }
              }
              if (e.key === 'Escape') closeOverlay();
            }}
            placeholder="Search"
            className="w-full bg-transparent text-[15px] text-white placeholder:text-white/55 focus:outline-none"
            aria-label="Search"
          />
          <button
            onClick={() => (query ? setQuery('') : closeOverlay())}
            aria-label={query ? 'Clear' : 'Close search'}
            className="rounded-full bg-white/15 p-1"
          >
            <X size={12} className="text-white" />
          </button>
        </div>

        {/* results */}
        {results.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-[14px]" style={glassStyle(14, { dark: true, strength: 1.15 })}>
            {results.map(({ a }, i) => (
              <button
                key={a.id}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-white/10"
                style={{ borderTop: i ? '1px solid rgba(255,255,255,0.08)' : undefined }}
                onClick={() => {
                  submit(query);
                  launchApp(a.id);
                }}
              >
                <span
                  className="flex h-8 w-8 items-center justify-center"
                  style={{ background: a.bg, borderRadius: 8 }}
                >
                  {(() => {
                    const Icon = a.icon;
                    return <Icon size={17} color={a.fg ?? '#fff'} />;
                  })()}
                </span>
                <span className="flex-1 text-[14px] text-white">{displayName(a.id, prefs)}</span>
                <ArrowUpRight size={14} className="text-white/50" />
              </button>
            ))}
          </div>
        )}

        {/* history */}
        {results.length === 0 && prefs.searchHistory.length > 0 && (
          <div className="mt-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-white/60">Recent</span>
              <button className="text-xs text-white/60 underline" onClick={clearHistory}>
                Clear
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {prefs.searchHistory.map((h) => (
                <button
                  key={h}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[13px] text-white"
                  style={glassStyle(15, { dark: true })}
                  onClick={() => setQuery(h)}
                >
                  <Clock3 size={12} className="text-white/60" />
                  {h}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* empty state */}
        {results.length === 0 && prefs.searchHistory.length === 0 && (
          <p className="mt-6 text-center text-[13px] text-white/60">
            {query ? 'No results' : 'Type to search your apps'}
          </p>
        )}
      </div>
    </div>
  );
}

export { getApp };
