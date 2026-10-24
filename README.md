# Andromeda Launcher (Web)

A fully interactive, iOS-style launcher experience that runs in the browser — built with Next.js 16, TypeScript, and Tailwind CSS 4. It recreates the feel of a modern mobile launcher: lock screen, notification & control centers, frosted-glass surfaces, live widgets, drag-and-drop home-screen editing, folders, search, dark mode, a media player, and 24+ working mini apps.

> Companion project to [OmKardile/Andromeda](https://github.com/OmKardile/Andromeda) (the native Android launcher). This is the web interpretation of the same ideas — great for prototyping launcher UX in a browser before porting to native.

## Highlights

**Home experience**
- Lock screen on boot (big clock, weather glance, notification cards, swipe up to unlock)
- Notification Center (pull from top-left) with live, derived notifications
- Control Center (pull from top-right): connectivity tiles, brightness/volume sliders, media controls, quick toggles
- 4-page workspace + a left "zero page" (widget board: suggestions, photo, battery, world clock)
- 4×6 icon grid with iOS-style app icons, notification badges, and flexible labels
- Frosted-glass dock with swipe-up app drawer
- 5 page transitions (default, rotation, flip, zoom, alpha)
- iOS-style app open/close zoom animations

**Glass & blur system**
- Recovered blur constants: 24px backdrop blur, `#66FFFFFF` tint, `#33EFEFEF` scrim, 1px inner edge
- Global blur toggle in Settings / Control Center with opaque fallbacks
- Glass cards on widgets, dock, folder sheets, and overlays

**Editing & organization**
- Long-press (300 ms) to enter edit mode — jiggle + context menu
- Drag anywhere: app-on-app folders, folder merge, dwell push-aside, dock swap, drawer-to-page placement
- Folders with rename, collapse-to-app, spring animations
- Spotlight-style search with history and frecency-ranked suggestions

**Appearance**
- Dark Mode (app shell, Settings, Reminders; media apps dark by design)
- Global brightness dimming (Control Center slider ↔ Settings)
- 7 AI-generated photo wallpapers (incl. a dark night-city + nebula pair), 18 solids, 6 gradients
- Emoji wallpapers: grid S/M/L, ring, and golden-angle spiral layouts — deterministic, resolution-independent renderer (container-query units, seeded jitter)

**Widgets (10)**
Analog clock · Digital clock · World clock (Intl timezones) · Calendar · Weather (live via Open-Meteo proxy, mock fallback) · Battery ring · Photo · Suggestions · **Now Playing** (live media controls) · **Reminders** (inline to-dos)

**Apps (all functional)**
Settings (every preference wired) · Calculator (iOS semantics) · Notes (localStorage persistence) · Clock (world clocks + alarms) · Weather · Photos (gallery + viewer) · Calendar · **Music** (full player: cover art, seek, queue, background playback engine) · **Reminders** (lists, quick add, buckets) · plus polished generic screens for 24+ demo apps

**Under the hood**
- Zustand store, fully typed, localStorage persistence (prefs, layout, reminders, history, usage)
- Background media engine (position ticks + auto-advance track queue)
- Responsive: framed phone presentation on desktop, edge-to-edge under 500px
- Accessibility: ARIA roles/labels, 44px targets, screen-reader text, keyboard-operable sliders

## What's new in v1.1.0

- 🔒 Lock screen (swipe up to unlock, weather glance, notification cards)
- 🔽 Notification Center & Control Center shades
- 🌙 Dark Mode + global brightness control
- 🎵 Music app with a real playback engine + Now Playing widget
- ✅ Reminders app + widget (with inline toggles)
- 🌀 iOS-style app open/close animations
- 🌃 Two new dark wallpapers (night city, nebula)

## Run it

```bash
bun install
bun run dev
# open http://localhost:3000
```

Weather uses an Open-Meteo proxy route (`/api/weather`) with mock fallback when offline.

## Project structure

```
src/
  app/                  # Next.js routes (/ + /api/weather)
  components/launcher/  # the launcher UI (workspace, dock, widgets, apps…)
  lib/launcher/          # store, app catalog, glass tokens, storage, weather
public/
  wallpapers/ photos/    # generated wallpaper & photo assets
```

## Credits

- Design language inspired by modern iOS launchers; all blur/glass constants, layouts, and behaviors were recovered from reference research and re-implemented from scratch in React.
- Wallpapers and photos AI-generated for this project.

## License

GPL-3.0 — same as the Andromeda Android project.
