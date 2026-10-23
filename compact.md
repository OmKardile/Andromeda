# Compact — state snapshot

One screen, refreshed every write (same-turn sync rule — see
`decisions.md`). If this file and reality disagree, reality wins and
this file gets fixed in the same commit.

## What this is

Andromeda: Android launcher, GPL-3.0 fork/rebuild of archived Stario
v2.16. Kotlin + Compose, no Material, Haze + Cloudy blurs, Niagara/iOS
inspiration. Product plan: `Launcher_Plan_Stario_Fork_Refreshed_Aug2026.md`.

## State (as of v0.2.5, 2026-10-23)

- Version: **0.2.5** (versionCode 18). Tags: v0.1.8 @ f7e590c,
  v0.1.11 @ e8cd3d0 (retro), v0.2.0–v0.2.5 on their own commits.
- Built: all plan-§1 UI surfaces + engine (see README Status), plus the
  repo-completion set (0.2.5): full GPL-3.0 text, committed Gradle
  wrapper, 4 unit-test suites (20 tests), Inter variable font +
  THIRD_PARTY_LICENSES.md, gradle.properties cleanup.
- Not built (deliberately): usage-stats opt-in flow (plan §8 gate),
  drag-scroll rail, real-device dogfooding (the plan's beta phase),
  UI-layer automated tests, performance pass. Stario reference sources
  in `reference/stario-source/`.
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
   2026). Real progress: §1 features done in 0.2.x; dogfooding/beta
   remain.
4. **`versionName`/`versionCode` bumps live only in
   `app/build.gradle.kts`** — remember both, every version.
5. ~~`gradle.properties` stale comments~~ → resolved 0.2.5.
6. ~~No gradle wrapper committed~~ → resolved 0.2.5 (wrapper verified
   working from the committed state).
7. ~~Compile-unverified from the authoring environment~~ → resolved
   from 0.2.0 (real SDK + Gradle + JDK 17; stickyHeader and
   ACTION_WALLPAPER_CHANGED baseline bugs found and fixed by the first
   builds).
8. **CI workflow written but not pushed** — the authoring PAT lacks
   `workflow` scope; GitHub rejects workflow files on every path for
   it. Owner action: add `.github/workflows/ci.yml` via web UI or
   re-scope the PAT. See CHANGELOG 0.2.5 process note + help.md FAQ.

## Session-to-session

- Doc-sync rule (all six files, same turn as any repo write) —
  `decisions.md` standing conventions.
- Worklog for agent sessions: `/home/z/my-project/worklog.md` (outside
  the repo).
- Push policy (updated 2026-10-23): push when verified; don't let
  unpublished work accumulate in one sandbox again.
