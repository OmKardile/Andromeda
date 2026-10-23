'use client';

import dynamic from 'next/dynamic';

// The launcher is fully interactive — load it client-side only to avoid any
// SSR/localStorage mismatch.
const LauncherRoot = dynamic(
  () => import('@/components/launcher/LauncherRoot').then((m) => ({ default: m.LauncherRoot })),
  {
    ssr: false,
    loading: () => (
      <main className="flex min-h-screen w-full items-center justify-center bg-[#0b0b0d]">
        <div className="h-24 w-24 animate-spin rounded-full border-4 border-white/10 border-t-white/60" />
      </main>
    ),
  },
);

export default function Home() {
  return <LauncherRoot />;
}
