# Compact — state snapshot

One screen, refreshed every write (same-turn sync rule — see
`decisions.md`). If this file and reality disagree, reality wins and
this file gets fixed in the same commit.

## What this is

Andromeda: Android launcher, GPL-3.0 fork/rebuild of archived Stario
v2.16. Kotlin + Compose, no Material, Haze + Cloudy blurs, Niagara/iOS
inspiration. Product plan: `Launcher_Plan_Stario_Fork_Refreshed_Aug2026.md`.

## State (as of v0.2.1, 2026-10-23)

- Version: **0.2.1** (versionCode 14). Tags: v0.1.8 @ f7e590c,
  v0.1.11 @ e8cd3d0 (retro), v0.2.0, v0.2.1 on their own commits.
- Built: engine (indexing, icons, icon-switching, categories, hidden
  apps, wallpaper + accent extraction), design tokens + motion,
  home (clock/date/greeting, real-wallpaper backdrop, wallpaper accent),
  drawer (A–Z list + quick-scroll rail), App Library folder grid,
  blur POC, 8 switchable launcher icons, 5-route navigation.
- Not built (deliberately): search + dock search, contextual home,
  settings, tests, CI, real font, drag-scroll rail. Stario reference
  sources for each are in `reference/stario-source/`.
- Tracker: 0 issues, 0 PRs (open or closed, ever). No TODO/FIXME in
  our code (one in reference/, Stario's own).
- **Compile status: verified from 0.2.0 on** (real SDK + Gradle 8.11.1
  + JDK 17 in the authoring environment). 0.1.x claims were
  doc-reasoned, not machine-verified — the stickyHeader and
  ACTION_WALLPAPER_CHANGED baseline bugs prove why that distinction
  mattered.

## Open flags (old → resolved when noted)

1. ~~README stale vs 0.1.11~~ → resolved in the docs round.
2. **Plan's Haze pseudocode is 2.0-shaped**; repo pins 1.7.2 (1.x API,
   properties direct in `hazeEffect {}`). Bump = syntax migration.
3. **Plan's Gantt dates are nominal** (solo-dev estimates from Aug
   2026). Real progress: Phase 3 substantially done (0.2.0).
4. **`versionName`/`versionCode` bumps live only in
   `app/build.gradle.kts`** — remember both, every version.
5. **`gradle.properties` has stale comments** ("Compose Unstyled 2.0's
   modules", "Gradle 9.4+") — cosmetic, worth cleaning up next time
   that file is touched.
6. **No gradle wrapper committed** (networkless origin environment) →
   see help.md for the local workarounds.
7. ~~Compile-unverified from the authoring environment~~ → resolved
   from 0.2.0 (real SDK + Gradle + JDK 17; stickyHeader baseline bug
   found and fixed by the first build). 0.1.x claims stand as
   doc-reasoned.

## Session-to-session

- Doc-sync rule (all six files, same turn as any repo write) —
  `decisions.md` standing conventions.
- Worklog for agent sessions: `/home/z/my-project/worklog.md` (outside
  the repo).
- Push policy (updated 2026-10-23): push when verified; don't let
  unpublished work accumulate in one sandbox again.
