# Andromeda Launcher (Web)

A fully interactive, iOS-style launcher experience that runs in the browser — built with Next.js 16, TypeScript, and Tailwind CSS 4. It recreates the feel of a modern mobile launcher: frosted-glass surfaces, live widgets, drag-and-drop home-screen editing, folders, search, and 24+ working mini apps.

> Companion project to [OmKardile/Andromeda](https://github.com/OmKardile/Andromeda) (the native Android launcher). This is the web interpretation of the same ideas — great for prototyping launcher UX in a browser before porting to native.

## Highlights

**Home experience**
- 4-page workspace + a left "zero page" (widget board: suggestions, photo, battery, world clock)
- 4×6 icon grid with iOS-style app icons, notification badges, and flexible labels
- Frosted-glass dock with swipe-up app drawer
- 5 page transitions (default, rotation, flip, zoom, alpha)

**Glass & blur system**
- Recovered blur constants: 24px backdrop blur, `#66FFFFFF` tint, `#33EFEFEF` scrim, 1px inner edge
- Global blur toggle in Settings with opaque fallbacks
- Glass cards on widgets, dock, folder sheets, and overlays

**Editing & organization**
- Long-press (300 ms) to enter edit mode — jiggle + context menu
- Drag anywhere: app-on-app folders, folder merge, dwell push-aside, dock swap, drawer-to-page placement
- Folders with rename, collapse-to-app, spring animations
- Spotlight-style search with history and frecency-ranked suggestions

**Widgets (8)**
Analog clock · Digital clock · World clock (Intl timezones) · Calendar · Weather (live via Open-Meteo proxy, mock fallback) · Battery ring · Photo · Suggestions

**Wallpapers**
- AI-generated photo wallpapers, 18 solids, 6 gradients
- Emoji wallpapers: grid S/M/L, ring, and golden-angle spiral layouts — deterministic, resolution-independent renderer (container-query units, seeded jitter)

**Apps (all functional)**
Settings (every preference wired) · Calculator (iOS semantics) · Notes (localStorage persistence) · Clock (world clocks + alarms) · Weather · Photos (gallery + viewer) · Calendar · plus polished generic screens for 24+ demo apps

**Under the hood**
- Zustand store, fully typed, localStorage persistence (prefs, layout, history, usage)
- Responsive: framed phone presentation on desktop, edge-to-edge under 500px
- Accessibility: ARIA roles/labels, 44px targets, screen-reader text

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
