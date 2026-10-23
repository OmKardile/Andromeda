# Technical documentation

How the Andromeda codebase is actually put together, as of **v0.1.11**
(this file updates in the same commit as the code it describes — see
`decisions.md` for the *why* behind choices, `compact.md` for a
one-screen state snapshot). For product vision and the phase plan, read
[`Launcher_Plan_Stario_Fork_Refreshed_Aug2026.md`](./Launcher_Plan_Stario_Fork_Refreshed_Aug2026.md)
first; nothing here repeats it.

## Bird's-eye view

Andromeda is a **home-screen launcher** for Android 10+ (minSdk 29,
matching Stario's own floor), built as five Gradle modules:

```
        ┌────────────────────────────────┐
        │              app               │  NavHost, manifest, 8 activity-
        │   MainActivity + Andromeda-    │  alias icons, applicationId
        │      Application               │
        └──┬─────────┬─────────┬─────────┘
           │         │         │
   ┌───────▼──┐ ┌────▼─────┐ ┌▼─────────┐
   │ ui:home  │ │ ui:drawer│ │ (future: │   Compose screens. Each depends
   │ home/blur│ │ drawer  │ │ ui:search│   only on core:engine +
   │ poc/icon │ │ list    │ │ settings)│   common:design — never on each
   └───┬───┬──┘ └──┬───┬──┘ └──────────┘   other.
       │   │       │   │
       │ ┌─▼───────▼─┐ │
       │ │common:    │ │   Design tokens: colors, spacing, type, theme
       │ │  design   │ │   CompositionLocal. No Material anywhere.
       │ └───────────┘ │
       │               │
   ┌───▼───────────────▼───┐
   │      core:engine      │  App indexing (LauncherApps), icon
   │  (no Compose dep)     │  switching. Pure Kotlin/Java + android.* —
   └────────────────────────┘  deliberately UI-free and testable.
```

Dependency rule enforced by convention (and by Gradle `implementation`
scoping): arrows only point **down**. `reference/stario-source/` is not
part of the build at all — it's read-only porting material.

## core:engine

- **`LauncherApplication.java`** — adapted from Stario's real class
  (GPL header retained, changes documented in-file): the app model.
  Identity = `(packageName, UserHandle)`; sort = case-insensitive label.
  `launch()` resolves the main activity through `LauncherApps`
  `.startMainActivity`, which handles work profiles correctly (a plain
  `startActivity` on the package would not).
- **`AppRepository.kt`** — new code, the decoupled counterpart of
  Stario's 507-line `ProfileApplicationManager.java` (which is welded to
  Stario's `Application` subclass, prefs wrapper, and `IconPackManager`).
  Owns a `StateFlow<List<LauncherApplication>>`; `refresh()` re-indexes
  all profiles via `LauncherApps`, `registerForChanges()` hooks
  install/uninstall/update callbacks. Icons load via
  `LauncherActivityInfo.getIcon(densityDpi)` — *not*
  `ApplicationInfo.loadIcon()`, which breaks adaptive icons and
  work-profile badging.
- **`IconSwitcher.kt`** — the real Android alternate-icon mechanism:
  8 manifest `activity-alias` entries, one enabled at a time via
  `PackageManager.setComponentEnabledSetting()`. First-run detection
  handles the `COMPONENT_ENABLED_STATE_DEFAULT` case (falls back to
  Eclipse, the manifest-enabled default).

## common:design

- `Color.kt` — base palette is new; the 11 accent values are copied
  from Stario's real dark-theme `colorPrimary` resources so "Turquoise
  here" = "Turquoise there".
- `Theme.kt` — the whole theming mechanism is one `CompositionLocal`
  (`LocalAndromedaColors`). No `MaterialTheme` anywhere, on purpose;
  screens read tokens directly.
- `Typography.kt` / `Spacing.kt` — token sets. Typography currently
  uses `FontFamily.Default`; the plan is an Inter (SIL OFL) swap for
  the SF Pro look, since SF Pro itself is Apple-platform-licensed.
- `res/` — the 8 launcher-icon mipmap sets live here (not in `app`)
  because resource references don't flow backward across module
  dependencies and both `app` and `ui:home` need them.

## UI modules

- **`ui:home`** — `HomeScreen.kt` (engine-to-UI wiring proof: live app
  count over a Haze-blurred striped backdrop; dock opens the drawer),
  `BlurPocScreen.kt` (the Phase 2 Haze-vs-Cloudy comparison; hazeSource
  /hazeEffect must be *siblings*, not parent-child — that was the 0.1.5
  bug), `IconPickerScreen.kt` (8-icon grid backed by `IconSwitcher`).
- **`ui:drawer`** — `DrawerScreen.kt`: `LazyColumn` with sticky letter
  headers, tap-to-launch rows with real icons, and a Niagara-style A–Z
  quick-scroll rail (tap-to-jump; drag-to-scroll is deliberate backlog).

## Cross-cutting conventions

- **No Material.** `BasicText` + own tokens everywhere. Compose
  Unstyled is pinned to its single confirmed artifact
  (`com.composables:compose-unstyled:1.49.1`).
- **Blur layering** per plan §2: Haze (`dev.chrisbanes.haze:1.7.2`,
  1.x API — properties set directly in `hazeEffect { }`) everywhere for
  backdrop blur; Cloudy (`com.github.skydoves:cloudy:0.6.1`, via JitPack)
  reserved for liquid-glass accents.
- **State**: `StateFlow` in the engine layer, `collectAsState` at the
  screen level. No DI framework yet — MainActivity constructs
  repositories lazily; revisit if wiring grows.
- **Kotlin/Java mix**: Java only where a Stario port is line-faithful
  (`LauncherApplication.java`); everything else Kotlin 2.2.10, JVM
  target 17.

## Build system

- AGP 8.10.0 / Gradle 8.11.1 / Kotlin 2.2.10 / compileSdk 36 — a
  Google-documented tested pairing (see CHANGELOG 0.1.3 for the whole
  saga: 0.1.1's AGP-9 fix overcorrected by dropping compileSdk, and
  28 AAR-metadata errors proved it).
- Version catalog (`gradle/libs.versions.toml`) is the single place
  versions live; comments there record *why* each pin is what it is and
  what's confirmed vs best-effort.
- Repos: `google()` + `mavenCentral()` + JitPack (Cloudy only), with
  `FAIL_ON_PROJECT_REPOS` so a stray module-level repo can't sneak in.
- **`gradlew` / wrapper jar are not committed yet** (networkless origin
  environment; see README's Building note). CI arrives with the wrapper
  — until then "it compiles" is a claim reasoned from docs, not
  machine-verified, and every version's CHANGELOG process note says so
  explicitly when it applies.

## What's deliberately not built yet

App Library folder grid (categories/folders), floating search + dock
search, contextual home, settings, tests, CI, real font, drag-scroll on
the rail, adaptive-icon source art. Each has Stario reference source
under `reference/stario-source/` waiting for its phase — see `compact.md`
for the live status board.
