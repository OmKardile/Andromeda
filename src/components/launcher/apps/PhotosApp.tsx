'use client';

// Photos — gallery grid (3 columns, 4px rounded tiles) of the bundled
// photo library plus a Featured hero. Tapping a tile opens a fullscreen
// viewer with prev/next arrows, close, and keyboard navigation.

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { PHOTOS } from '@/lib/launcher/storage';
import { useLauncher } from '@/lib/launcher/store';

const HERO_INDEX = 5;
const HERO_CARDS: { index: number; kicker: string; title: string }[] = [
  { index: 5, kicker: 'Featured', title: 'Golden hour, somewhere north' },
  { index: 2, kicker: 'Favorites', title: 'Long exposures from the trip' },
  { index: 0, kicker: 'Recently added', title: 'Saturday market colors' },
];

type Segment = 'years' | 'months' | 'all';

const SEGMENTS: { id: Segment; label: string }[] = [
  { id: 'years', label: 'Years' },
  { id: 'months', label: 'Months' },
  { id: 'all', label: 'All' },
];

export function PhotosApp() {
  const closeOverlay = useLauncher((s) => s.closeOverlay);
  const [open, setOpen] = useState<number | null>(null);
  const [segment, setSegment] = useState<Segment>('all');

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setOpen((o) => (o === null ? o : Math.min(PHOTOS.length - 1, o + 1)));
      } else if (e.key === 'ArrowLeft') {
        setOpen((o) => (o === null ? o : Math.max(0, o - 1)));
      } else if (e.key === 'Escape') {
        setOpen(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-[#F2F2F7]">
      <div className="launcher-scroll min-h-0 flex-1 overflow-y-auto pb-10">
        {/* header */}
        <div className="flex items-center justify-between px-5 pb-2 pt-[58px]">
          <h1 className="text-[34px] font-bold text-black">Library</h1>
          <button
            type="button"
            onClick={closeOverlay}
            className="flex h-11 items-center gap-0.5 rounded-full bg-black/[0.06] pl-2 pr-4 text-[15px] font-medium text-black active:bg-black/10"
            aria-label="Back to home screen"
          >
            <ChevronLeft size={18} strokeWidth={2.5} /> Home
          </button>
        </div>

        {/* segmented control (visual) */}
        <div
          className="mx-auto mb-3 flex rounded-[9px] bg-black/[0.06] p-[2px]"
          role="tablist"
          aria-label="Photo library view"
        >
          {SEGMENTS.map((s) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={segment === s.id}
              onClick={() => setSegment(s.id)}
              className={`h-[30px] rounded-[7px] px-4 text-[13px] font-medium transition-colors ${
                segment === s.id ? 'bg-white text-black shadow-sm' : 'text-black/55'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* hero row of large cards */}
        <div className="launcher-scroll flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1">
          {HERO_CARDS.map((card) => (
            <button
              key={card.kicker}
              type="button"
              className="relative h-[220px] w-[300px] shrink-0 snap-center overflow-hidden rounded-[16px] text-left active:opacity-90"
              onClick={() => setOpen(card.index)}
              aria-label={`Open ${card.kicker} photo: ${card.title}`}
            >
              <img
                src={PHOTOS[card.index]}
                alt={`${card.title} — hero card`}
                className="h-full w-full object-cover"
                draggable={false}
              />
              <div
                className="absolute inset-0"
                style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.55) 100%)' }}
              />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-white/80">{card.kicker}</div>
                <div className="truncate text-[19px] font-bold text-white">{card.title}</div>
              </div>
            </button>
          ))}
        </div>

        {/* recents grid */}
        <h2 className="px-5 pb-2 pt-5 text-[20px] font-bold text-black">Recents</h2>
        <div className="grid grid-cols-3 gap-[3px] px-[13px]">
          {PHOTOS.map((src, i) => (
            <button
              key={src}
              type="button"
              className="overflow-hidden rounded-[4px] active:opacity-80"
              onClick={() => setOpen(i)}
              aria-label={`Open photo ${i + 1} of ${PHOTOS.length}`}
            >
              <img
                src={src}
                alt={`Library photo ${i + 1}`}
                className="aspect-square w-full object-cover"
                draggable={false}
                loading="lazy"
              />
            </button>
          ))}
        </div>

        <p className="px-5 pt-6 text-center text-[13px] text-black/40">
          {PHOTOS.length} photos · synced on this device
        </p>
      </div>

      {/* fullscreen viewer */}
      {open !== null && (
        <div
          className="absolute inset-0 z-20 flex flex-col bg-black"
          role="dialog"
          aria-label={`Photo viewer, photo ${open + 1} of ${PHOTOS.length}`}
          style={{ animation: 'viewerIn 200ms ease-out' }}
        >
          <style>{`@keyframes viewerIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes viewerImg { from { opacity: 0; transform: scale(0.96);} to { opacity: 1; transform: none;} }`}</style>

          <div className="flex items-center justify-between px-4 pb-2 pt-[58px]">
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20"
              aria-label="Close viewer"
            >
              <X size={20} />
            </button>
            <span className="text-[15px] font-medium text-white/70 tabular-nums">
              {open + 1} / {PHOTOS.length}
            </span>
            <span className="h-11 w-11" aria-hidden />
          </div>

          <div className="relative flex min-h-0 flex-1 items-center justify-center px-2">
            <img
              key={PHOTOS[open]}
              src={PHOTOS[open]}
              alt={`Photo ${open + 1} of ${PHOTOS.length}`}
              className="max-h-full max-w-full rounded-lg object-contain"
              draggable={false}
              style={{ animation: 'viewerImg 220ms ease-out' }}
            />
            <button
              type="button"
              disabled={open === 0}
              onClick={() => setOpen((o) => (o === null ? o : Math.max(0, o - 1)))}
              className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md active:bg-black/70 disabled:opacity-25"
              aria-label="Previous photo"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              type="button"
              disabled={open === PHOTOS.length - 1}
              onClick={() => setOpen((o) => (o === null ? o : Math.min(PHOTOS.length - 1, o + 1)))}
              className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur-md active:bg-black/70 disabled:opacity-25"
              aria-label="Next photo"
            >
              <ChevronRight size={24} />
            </button>
          </div>

          <div className="pb-8 pt-3 text-center text-[13px] text-white/60">
            {open === HERO_INDEX ? 'Featured' : `Library · photo ${open + 1}`}
          </div>
        </div>
      )}
    </div>
  );
}
