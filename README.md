# Andromeda

A ground-up UI rebuild of [Stario](https://github.com/albu-razvan/Stario) —
glassmorphic, Niagara- and iOS-App-Library-inspired, built on Jetpack
Compose Unstyled. No Material You in sight.

Design-first, one person. Full background and decisions live in
[`Launcher_Plan_Stario_Fork_Refreshed_Aug2026.md`](./Launcher_Plan_Stario_Fork_Refreshed_Aug2026.md) —
this file is the practical "how do I build this" companion to that plan.

**Built by** [Omkar K.](https://omkardile.is-a.dev) ("omik // whysoserious")
— [more of my work](https://mylinks-omkardile.vercel.app/) ·
[GitHub](https://github.com/OmKardile)

> Forked from the archived [Stario](https://github.com/albu-razvan/Stario)
> (GPL-3.0), originally by Răzvan Albu. Andromeda keeps the engine,
> rebuilds everything else. See [LICENSE](./LICENSE).

## Status

**This is a Phase 1/2 scaffold, not a working launcher yet.** What's here:

- A buildable multi-module Gradle project with the real dependency stack
  wired up (Compose Unstyled, Haze, Cloudy, JitPack repo for Cloudy)
- A real app-indexing engine (`core:engine`) using `LauncherApps`, adapted
  from Stario's actual `LauncherApplication.java`, with live-update support
  via `registerCallback` — confirmed against Stario's real
  `ProfileApplicationManager.java`, not guessed at
- A design token system (`common:design`) with Stario's real accent color
  values ported over, and zero Material dependencies
- A home screen that proves the engine → UI wiring end to end (real app
  count over a real Haze blur), plus the Phase 2 Haze-vs-Cloudy comparison
  screen from the plan's timeline

What's **not** here yet, deliberately — see the plan's §3 Gantt for when:
the actual Niagara-style drawer, App Library folder grid, floating
search/dock, contextual home features, categories/folders, and settings.
`reference/stario-source/` has Stario's real code for all of these, ready
to port properly when their phase comes up instead of being rushed here.

## Module layout

```
app/            The launcher application — MainActivity, manifest, icon.
core/engine/    App indexing (LauncherApps-based). No Compose dependency —
                pure Kotlin/Java, testable without a UI.
common/design/  Colors, spacing, typography, the AndromedaTheme
                CompositionLocal. No Material.
ui/home/        Home screen + the Haze/Cloudy blur POC. Depends on
                core:engine and common:design.
reference/      Curated real Stario source (not part of the Gradle build —
                see reference/stario-source/README.md) for porting from
                during later phases.
```

Future UI modules (`ui:drawer`, `ui:search`, etc.) should follow `ui:home`'s
shape: depend on `core:engine` + `common:design`, own their package under
`dev.omkardile.andromeda.ui.*`, no cross-dependencies between `ui:*` modules.

## Building

Needs **JDK 17** (Compose Unstyled requirement — set this in Android
Studio's Gradle JDK setting if it doesn't pick it up automatically) and a
recent Android Studio. As of 0.1.3 this targets **AGP 8.10.0 / Gradle
8.11.1 / Kotlin 2.2.10 / compileSdk 36** — a Google-documented tested
combination (Navigation SDK's compatibility table), not another guess. See
CHANGELOG 0.1.3 for why compileSdk went back up to 36 after 0.1.1 dropped
it to 34.

```
git clone <your fork's URL>
cd andromeda
gradle wrapper --gradle-version 8.11.1   # see note below
# then open in Android Studio
# File ▸ Invalidate Caches / Restart before your first sync if you're
# coming from a 0.1.0 or 0.1.1 checkout that already failed to sync once —
# a failed dependency resolution can leave stale state that a plain sync
# won't clear on its own
```

**One real gap:** `gradlew` / `gradlew.bat` / `gradle-wrapper.jar` aren't
in this repo yet — the jar is a compiled binary this environment can't
produce without network access. `gradle/wrapper/gradle-wrapper.properties`
is here and correctly pins 8.11.1, so either run `gradle wrapper` once
locally (needs *some* Gradle already on your machine) or use Android
Studio's Gradle tool window → "Generate Gradle Wrapper" — either will
read the properties file and fetch the right version.

**This still hasn't been through a live Gradle sync on my end** — written
without network access, so nothing here has been compile-verified from
this side. What's confirmed vs. best-effort:

- `agp`, `kotlin`, `composeBom`, `haze`, `cloudy`, and now `composeunstyled`
  (as of 0.1.2 — see CHANGELOG) in `gradle/libs.versions.toml` are real,
  checked values. Everything else marked `best-effort` in that file wasn't
  individually re-confirmed.
- Compose Unstyled is now a single `com.composables:compose-unstyled`
  dependency rather than the modular per-component split 0.1.0/0.1.1
  guessed at — check [composeunstyled.com/docs](https://composeunstyled.com/docs)
  for whether that modular API is real and worth switching back to once
  you're actually using components from it.
- Haze's modifier API changed shape between 1.x and 2.0 — this project
  pins 1.7.2 (stable), whose `hazeEffect { }` sets properties like
  `blurRadius` directly, no wrapper. 2.0's migration docs show a nested
  `blurEffect { }` block instead; 0.1.4 fixed exactly this mix-up (see
  CHANGELOG). If you ever bump to a 2.0.x release, that nesting comes back.
- Cloudy's classic `Modifier.cloudy(radius)` blur (used in the POC screen)
  is stable; its newer liquid-glass-specific API wasn't confirmed — see
  `BlurPocScreen.kt`'s header comment.
- No launcher icon artwork — `ic_launcher_foreground.xml` is a placeholder
  vector (a circle and a ring). Real icon design is the single
  highest-impact "this is mine now" item per the plan's §10.

**If Gradle sync still fails after pulling in 0.1.1's changes**, that's
genuinely useful signal (it would mean the AGP 9.x theory in CHANGELOG
0.1.1 was wrong) — paste the new error and it's a much narrower search
than "why does 9.3.0 not work."

## Testing "is this actually my home screen"

Once it builds and installs: Settings → Apps → Default apps → Home app →
Andromeda. Press the device Home button to switch back to your regular
launcher at any point (this doesn't uninstall anything, just changes which
app answers the Home button).

## Attribution

GPL-3.0 requires keeping license/copyright notices intact; crediting the
original author by name on top of that is standard practice — see plan §10
for the suggested credit line and About-screen copy. `core:engine`'s
`LauncherApplication.java` carries its original Stario copyright header
plus a note on what was changed and why.
