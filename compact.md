# Compact — state snapshot

One screen, refreshed every write (same-turn sync rule — see
`decisions.md`). If this file and reality disagree, reality wins and
this file gets fixed in the same commit.

## What this is

Andromeda: Android launcher, GPL-3.0 fork/rebuild of archived Stario
v2.16. Kotlin + Compose, no Material, Haze + Cloudy blurs, Niagara/iOS
inspiration. Product plan: `Launcher_Plan_Stario_Fork_Refreshed_Aug2026.md`.

## State (as of the doc-set commit, post-0.1.11)

- Version: **0.1.11** (versionCode 12). Git: 2 published commits
  (`f7e590c` 0.1.0–0.1.8, `e8cd3d0` 0.1.9–0.1.11); zip-delivered
  history, so version↔commit granularity starts matching only with the
  tags (`v0.1.8` @ f7e590c, `v0.1.11` @ e8cd3d0).
- Built: engine (indexing, icons, icon-switching), design tokens,
  home (blur proof + count), drawer (A–Z list + quick-scroll rail),
  blur POC, 8 switchable launcher icons, 4-route navigation.
- Not built (deliberately): folder grid/categories, search + dock
  search, contextual home, wallpaper-reactive tint, settings, tests,
  CI, real font, drag-scroll rail. Stario reference sources for each
  are in `reference/stario-source/`.
- Tracker: 0 issues, 0 PRs (open or closed, ever). No TODO/FIXME in
  our code (one in reference/, Stario's own).

## Open flags (old → resolved when noted)

1. ~~README stale vs 0.1.11~~ → resolved this commit.
2. **Plan's Haze pseudocode is 2.0-shaped**; repo pins 1.7.2 (1.x API,
   properties direct in `hazeEffect {}`). Bump = syntax migration.
3. **Plan's Gantt dates are nominal** (solo-dev estimates from Aug
   2026). Real progress: Phase 3 partially done.
4. **`versionName`/`versionCode` bumps live only in
   `app/build.gradle.kts`** — remember both, every version.
5. **`gradle.properties` has stale comments** ("Compose Unstyled 2.0's
   modules", "Gradle 9.4+") — cosmetic, worth cleaning up next time
   that file is touched.
6. **No gradle wrapper committed** (networkless origin environment) →
   see help.md for the local workarounds.
7. **Compile-unverified from the authoring environment** (no network →
   no SDK/deps). Every CHANGELOG process note so far says which claims
   are reasoned vs verified. The rebuild environment (2026-10-23) has
   a real SDK + Gradle — new versions are compile-verified before
   commit; older ones inherit this flag until first CI run.

## Session-to-session

- Doc-sync rule (all six files, same turn as any repo write) —
  `decisions.md` standing conventions.
- Worklog for agent sessions: `/home/z/my-project/worklog.md` (outside
  the repo).
- Push policy (updated 2026-10-23): push when verified; don't let
  unpublished work accumulate in one sandbox again.
