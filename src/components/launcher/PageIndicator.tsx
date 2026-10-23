'use client';

// Page indicator: dots <-> search pill with a 200ms crossfade after 2s idle.
// Swipe up on the strip opens the app drawer.

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Search } from 'lucide-react';
import { useLauncher } from '@/lib/launcher/store';
import { glassStyle, MOTION } from '@/lib/launcher/glass';

export function PageIndicator() {
  const page = useLauncher((s) => s.page);
  const setPage = useLauncher((s) => s.setPage);
  const setOverlay = useLauncher((s) => s.setOverlay);
  const editMode = useLauncher((s) => s.editMode);
  const [idle, setIdle] = useState(false);
  const resetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const bump = () => {
      setIdle(false);
      if (resetRef.current) clearTimeout(resetRef.current);
      resetRef.current = setTimeout(() => setIdle(true), MOTION.idleToPillMs);
    };
    bump();
    window.addEventListener('pointerdown', bump, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', bump);
      if (resetRef.current) clearTimeout(resetRef.current);
    };
  }, []);

  const showPill = idle && !editMode;

  const onStripPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    const startY = e.clientY;
    const startX = e.clientX;
    let moved = false;
    const onMove = (ev: PointerEvent) => {
      if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > 8) moved = true;
    };
    const onUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      const dy = ev.clientY - startY;
      if (dy < -22 && !moved) return;
      if (dy < -18) {
        setOverlay({ kind: 'drawer' });
      } else if (!moved && Math.abs(dy) < 8) {
        // tap: paging handled by dots
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-[112px] z-30 flex justify-center">
      {/* dots */}
      <div
        className="pointer-events-auto flex items-center gap-2 px-4 py-2"
        style={{
          opacity: showPill ? 0 : 1,
          transform: showPill ? 'scale(0.6)' : 'scale(1)',
          transition: `opacity ${MOTION.crossfadeMs}ms ease, transform ${MOTION.crossfadeMs}ms ease`,
        }}
        aria-label="page indicator"
      >
        {[0, 1, 2, 3].map((i) => (
          <button
            key={i}
            aria-label={`Go to page ${i + 1}`}
            className="group p-1"
            onClick={() => setPage(i)}
          >
            <span
              className="block rounded-full transition-all duration-200"
              style={{
                width: page === i ? 7 : 6,
                height: page === i ? 7 : 6,
                background: page === i ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.38)',
                boxShadow: page === i ? '0 0 6px rgba(255,255,255,0.55)' : undefined,
              }}
            />
          </button>
        ))}
      </div>

      {/* search pill */}
      <button
        className="pointer-events-auto absolute flex h-[34px] items-center gap-1.5 px-4 text-[13px] font-medium text-white"
        style={{
          ...glassStyle(17, { dark: true, strength: 0.9 }),
          opacity: showPill ? 1 : 0,
          transform: showPill ? 'scale(1)' : 'scale(0.72)',
          transition: `opacity ${MOTION.crossfadeMs}ms ease, transform ${MOTION.crossfadeMs}ms ease`,
          pointerEvents: showPill ? 'auto' : 'none',
        }}
        onClick={() => setOverlay({ kind: 'search' })}
        aria-label="Search"
      >
        <Search size={14} strokeWidth={2.4} />
        Search
      </button>

      {/* swipe-up strip (invisible, wider hit area) */}
      <div
        className="pointer-events-auto absolute -top-3 h-10 w-56"
        onPointerDown={onStripPointerDown}
        aria-hidden
      />
    </div>
  );
}
