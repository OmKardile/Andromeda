'use client';

// Entry composition: device frame + launcher experience.

import { PhoneFrame } from './PhoneFrame';
import { Launcher } from './Launcher';

export function LauncherRoot() {
  return (
    <PhoneFrame>
      <Launcher />
    </PhoneFrame>
  );
}
