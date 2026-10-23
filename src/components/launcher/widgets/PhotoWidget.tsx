'use client';

// Photo widget — a framed photo with an iOS-style date badge.
// The photo cycles through the bundled library on tap (local state only,
// no effects). Falls back to a gradient placeholder when an image fails.

import { useState } from 'react';
import { useLauncher } from '@/lib/launcher/store';
import { PHOTOS } from '@/lib/launcher/storage';
import type { WidgetProps } from './registry';

/** Alt text derived from the asset generation prompts. */
const PHOTO_ALTS: Record<string, string> = {
  '/photos/p-1.jpg': 'golden retriever puppy portrait',
  '/photos/p-2.jpg': 'city street at night after rain',
  '/photos/p-3.jpg': 'tropical beach at golden hour',
  '/photos/p-4.jpg': 'coffee latte art on a wooden table',
  '/photos/p-5.jpg': 'cherry blossom branch against the sky',
  '/photos/p-6.jpg': 'northern lights over a calm lake',
};

export function PhotoWidget({ widget, width, height }: WidgetProps) {
  useLauncher((s) => s.tick); // keeps the date badge fresh at midnight
  const blurEnabled = useLauncher((s) => s.prefs.blurEnabled);

  // widget.data.photo may hold a src string or a numeric index
  const dataPhoto = widget.data?.photo;
  const startIndex =
    typeof dataPhoto === 'number'
      ? dataPhoto
      : typeof dataPhoto === 'string'
        ? Math.max(0, PHOTOS.indexOf(dataPhoto))
        : 0;

  const [offset, setOffset] = useState(0);
  const [failed, setFailed] = useState(false);
  const src = PHOTOS[(startIndex + offset) % PHOTOS.length];

  const now = new Date();
  const longDate = now.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  const shortDate = now.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  const wide = width >= 200;

  const cycle = () => {
    setOffset((i) => i + 1);
    setFailed(false);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Photo widget: ${PHOTO_ALTS[src] ?? 'photo'} — tap for the next photo`}
      onClick={cycle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          cycle();
        }
      }}
      className="group cursor-pointer outline-none transition-transform duration-150 active:scale-[0.985]"
      style={{
        width,
        height,
        borderRadius: 22,
        background: '#FFFFFF',
        padding: 3,
        boxShadow: '0 8px 28px rgba(0,0,0,0.16)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        className="relative h-full w-full"
        style={{ borderRadius: 19, overflow: 'hidden', background: failed ? undefined : '#F2F2F7' }}
      >
        {failed ? (
          <div
            className="flex h-full w-full items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #079ECB 0%, #0FB5A6 55%, #34C759 100%)' }}
          >
            <span style={{ fontSize: 10.5, fontWeight: 600, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.06em' }}>
              PHOTOS
            </span>
          </div>
        ) : (
          <img
            src={src}
            alt={`Photo widget: ${PHOTO_ALTS[src] ?? 'photo'}`}
            draggable={false}
            className="h-full w-full select-none object-cover"
            onError={() => setFailed(true)}
          />
        )}

        {/* date badge */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0"
          style={{ height: '42%', background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 100%)' }}
        />
        <span
          className="pointer-events-none absolute"
          style={{
            left: 10,
            bottom: 8,
            fontSize: wide ? 10.5 : 9.5,
            fontWeight: 600,
            color: '#FFFFFF',
            textShadow: '0 1px 3px rgba(0,0,0,0.45)',
            letterSpacing: '0.02em',
          }}
        >
          {wide ? longDate : shortDate}
        </span>

        {/* cycle hint on hover */}
        <span
          className="pointer-events-none absolute rounded-full opacity-0 transition-opacity duration-200 group-hover:opacity-100"
          style={{
            right: 8,
            bottom: 8,
            padding: '3px 8px',
            fontSize: 9,
            fontWeight: 600,
            color: '#FFFFFF',
            background: 'rgba(0,0,0,0.38)',
            backdropFilter: `blur(${blurEnabled ? 8 : 0}px)`,
            WebkitBackdropFilter: `blur(${blurEnabled ? 8 : 0}px)`,
          }}
        >
          tap to shuffle
        </span>
      </div>
    </div>
  );
}
