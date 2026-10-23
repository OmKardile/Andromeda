# Technical documentation

How the Andromeda codebase is actually put together, as of **v0.2.5**
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
- **`CategoryRepository.kt`** (0.2.0) — decoupled port of Stario's
  category trio. UUID identifiers + SharedPreferences layout stay
  byte-compatible with Stario; listeners became one `StateFlow<
  List<AppCategory>>`. MainActivity owns the recompute trigger
  (re-fires on app-index *and* hidden-set changes; hidden apps are
  filtered out before the refresh). Permutation/remap/custom-name
  mutations re-emit from cached inputs.
- **`SettingsRepository.kt`** (0.2.4) — accent name + haptics flows;
  the haptics key is the literal one Vibrations reads.
- **`HiddenAppsRepository.kt`** (0.2.0) — hidden-app set as a
  `StateFlow<Set<String>>`; shares the per-profile key scheme
  (`AppKeys`) with CategoryRepository.
- **`WallpaperRepository.kt`** (0.2.1) — wallpaper Bitmap snapshot
  (screen-scaled) + accent ARGB as StateFlows;
  `OnColorsChangedListener` as the change signal (the old broadcast is
  gone from API 36) + resume re-read.
- **`AccentExtractor.kt`** (0.2.1) — pure-Kotlin accent quantizer
  (12 hue buckets, s²·v weights, monochrome → null, dark-UI nudge);
  the bitmap wrapper samples to ~192px first.
- **`search/JaroWinkler.kt` + `search/SearchEngines.kt`** (0.2.2) —
  Stario's similarity algorithm and engine templates, ported exactly
  (oracle scores pinned by unit test; query URLs byte-identical;
  default engine: Kagi).
- **`Vibrations.kt`** (0.2.3) — Stario's 5ms one-shot haptic, ported;
  VibratorManager on 31+, legacy path for 29–30; pref-gated (default
  ON), pref shared with SettingsRepository by design.
- **`BatteryStatus.kt`** (0.2.3) — sticky-broadcast read (null-receiver
  pattern) + pure level/scale/charging triple; guarded percentage.

## common:design

- `Color.kt` — base palette is new; the 11 accent values are copied
  from Stario's real dark-theme `colorPrimary` resources so "Turquoise
  here" = "Turquoise there".
- `Theme.kt` — the whole theming mechanism is one `CompositionLocal`
  (`LocalAndromedaColors`). No `MaterialTheme` anywhere, on purpose;
  screens read tokens directly.
- `Typography.kt` / `Spacing.kt` — token sets. Typography is the
  **Inter variable font** (SIL OFL, `THIRD_PARTY_LICENSES.md` at the
  repo root; the SF Pro stand-in the plan called for) wired with real
  variable weights. `Spacing.kt` is the roomier-than-Material scale.
- `Motion.kt` (0.2.0) — spring tokens (`snappy`/`gentle`/`entrance`).
- `Drawables.kt` (0.2.0) — the shared `Drawable.toImageBitmapOrNull()`.
- `res/` — the 8 launcher-icon mipmap sets live here (not in `app`)
  because resource references don't flow backward across module
  dependencies and both `app` and `ui:home` need them.

## UI modules

- **`ui:home`** — `HomeScreen.kt`: the real home screen (0.2.1) —
  localized clock (30s aligned tick), date, greeting, live app count,
  real-wallpaper Haze backdrop (striped fallback for live wallpapers),
  battery chip + settings gear (top-right glass), floating dock
  (search pill + 2×2 apps button, haptic), accent applied one level up
  in MainActivity so all screens inherit it.
  `BlurPocScreen.kt` (the Phase 2 Haze-vs-Cloudy comparison; hazeSource
  /hazeEffect must be *siblings*, not parent-child — that was the 0.1.5
  bug).
- **`ui:search`** (0.2.2) — `SearchScreen.kt`: prefix-first ranking,
  then Jaro-Winkler ≥ 0.4 descending; browser handoff row; FocusRequester
  auto-focus; imePadding. API 29 edge documented in help.md.
- **`ui:settings`** (0.2.4) — `SettingsScreen.kt` (accent picker as
  chunked Rows, engine list, GlassSwitch, hidden-apps manager, dev
  links, About) + `IconPickerScreen.kt` (moved from ui:home).
- **`ui:drawer`** — `DrawerScreen.kt`: `LazyColumn` with letter header
  items (plain items since 0.2.0 — `stickyHeader` no longer exists in
  the resolved foundation; see CHANGELOG), tap-to-launch rows with real
  icons, and a Niagara-style A–Z quick-scroll rail (tap-to-jump;
  drag-to-scroll is deliberate backlog). `FolderGridScreen.kt`
  (0.2.0): the App Library — 2-column Cloudy folder cards, a
  Haze-blurred detail overlay (source/effect siblings, `HazeTint`),
  spring entrance, long-press-to-move reordering persisted through
  CategoryRepository.

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
- **The Gradle wrapper is committed** (0.2.5, from gradle/gradle's
  v8.11.1 tag) and **CI runs** (`.github/workflows/ci.yml`: JDK 17,
  `:core:engine:testDebugUnitTest` → `:app:assembleDebug`, APK
  artifact, on pushes/tags/PRs).
- **Tests** (0.2.5): four JVM suites in `core:engine` (20 tests) —
  JaroWinkler vs Stario's oracle, AccentExtractor edges, BatteryStatus
  math, CategoryIds vs independently computed UUIDs.

## What's deliberately not built yet

Usage-stats opt-in suggestions (plan §8 gate), drag-scroll on the rail,
UI-layer automated tests, the performance pass, and real-device
dogfooding (the plan's beta phase). Reference sources for the deferred
bits are under `reference/stario-source/` — see `compact.md`
for the live status board.
