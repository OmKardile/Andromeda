# Help — building, running, and the traps already hit

Practical answers. What the app *is* lives in the README; why it's that
way lives in `decisions.md`; how it's wired lives in
`technical-documentation.md`. This file is for when something's on fire.

## Build setup

1. **JDK 17 or newer.** (JDK 21 works.) Android Studio: Settings →
   Build Tools → Gradle → Gradle JDK. CLI: `JAVA_HOME` pointing at it.
2. **Android SDK with `platforms;android-36` + build tools** (Android
   Studio handles this on first sync), and a `local.properties` with
   `sdk.dir=` — Studio writes that file for you; the CLI needs it too.
3. **The Gradle wrapper is committed** (0.2.5): `./gradlew` just works
   and pins **8.11.1** — no pre-installed Gradle needed anymore. (For
   history: 0.1.x-era checkouts genuinely did lack the wrapper —
   `gradle wrapper --gradle-version 8.11.1` was the old workaround.)
4. Build/install: `./gradlew :app:assembleDebug` then
   `adb install -r app/build/outputs/apk/debug/app-debug.apk` (or just
   press Run in Studio). Tests: `./gradlew :core:engine:testDebugUnitTest`.
   (CI is written but not pushed yet — the authoring token couldn't
   publish workflow files; see CHANGELOG 0.2.5. Everything is verified
   by the same commands locally instead.)
5. Make it your home screen via Settings → Apps → Default apps → Home
   app → Andromeda. The system Home button switches you back out at any
   time.

## Environment facts (as of 0.2.5)

- AGP 8.10.0 / Gradle 8.11.1 / Kotlin 2.2.10 / compileSdk 36 /
  minSdk 29 — a Google-documented tested combination. Do not bump these
  piecemeal; the 0.1.1→0.1.3 saga in the CHANGELOG is what that looks
  like.
- Compose Unstyled resolves as the **single** artifact
  `com.composables:compose-unstyled:1.49.1` — the modular
  per-component names don't resolve and never did (0.1.2).
- Cloudy comes from **JitPack**, not Maven Central
  (`settings.gradle.kts` has the repo; `FAIL_ON_PROJECT_REPOS` means a
  module-level `repositories {}` block will fail the build by design).
- Versions of AGP/Kotlin/BOM/etc. live only in
  `gradle/libs.versions.toml`, with comments recording why.

## Traps already hit (fixes included)

- **AGP 9.x breaks this project** (0.1.1: `ApplicationExtensionImpl…`
  cast exception). AGP stays on the 8.x line — 8.10.0. If you bump AGP
  and see that cast error, you've re-arrived at a known dead end.
- **Compose Unstyled modular coordinates don't resolve** (0.1.2): use
  the single artifact from the catalog, not hand-typed module names.
- **Haze 1.x vs 2.0 API shape** (0.1.4): with the pinned 1.7.2, blur
  properties go directly in the `hazeEffect { }` lambda —
  `hazeEffect(state) { blurRadius = 24.dp }`. There is no nested
  `blurEffect { }` wrapper; that's 2.0's API and it won't compile here.
- **Haze renders nothing when source/effect are parent-child** (0.1.5,
  the big one): `hazeSource` and `hazeEffect` must be *siblings* under
  a common parent. If blur silently no-ops, check that structure
  first — both `HomeScreen.kt` and `BlurPocScreen.kt` now demonstrate
  the correct sibling shape.
- **`items(...)` on a `LazyColumn` needs its import** (0.1.10): it's a
  top-level extension on `LazyListScope`, not a member —
  `import androidx.compose.foundation.lazy.items`. Missing it produces
  bafflingly wrong overload errors, not "unresolved reference".
- **`stickyHeader` is gone** (0.2.0, baseline bug): deprecated in
  Compose Foundation 1.7, removed since — BOM 2026.06.00's
  `LazyListScope` has only `item`/`items`/`itemsIndexed`. Letter
  headers in the drawer are plain items now. If you see
  "Unresolved reference 'stickyHeader'", that's why — don't fight it,
  replace it.
- **`ACTION_WALLPAPER_CHANGED` is gone too** (0.2.1): deprecated API
  33, removed from the API 36 SDK — it doesn't compile against
  `platforms;android-36`. Use `WallpaperManager
  .addOnColorsChangedListener` (see WallpaperRepository.start).
- **`imePadding` is degraded on API 29** (0.2.2): `WindowInsets.IME`
  behaves from API 30; with the manifest's `adjustNothing` on a 29
  device the keyboard can cover the last search row. Edge case, not
  worth breaking edge-to-edge over — it's in the CHANGELOG as a known
  edge.
- **`weight()` is scope-scoped** (0.1.4): importing
  `androidx.compose.foundation.layout.weight` explicitly resolves to the
  wrong symbol and shadows the Row/Column one. Don't import it; it's
  automatically in scope inside `Row {}` / `Column {}`.
- **Named arguments on Java constructors are a compile error**
  (0.1.2): `LauncherApplication` is Java — call it with positional
  args from Kotlin.
- **Icons must load via `LauncherActivityInfo.getIcon`**, not
  `ApplicationInfo.loadIcon` — the latter breaks adaptive icons and
  work-profile badging (0.1.9).
- **First icon-switch detection**: before the user ever picks an icon,
  `getComponentEnabledSetting` returns `COMPONENT_ENABLED_STATE_DEFAULT`
  for *all* aliases — not `ENABLED` for the manifest-enabled one.
  `IconSwitcher.current()` handles this; don't "simplify" it away.
- **`local.properties` must never be committed** — it's in
  `.gitignore` already; keep it that way.

## FAQ

- **Can I use SF Pro?** Not as a bundled Android font — Apple's license
  covers Apple platforms. Inter (SIL OFL) is the bundled stand-in since
  0.2.5 (`THIRD_PARTY_LICENSES.md` has the license text).
- **Where do alternate launcher icons come from?** Manifest
  `activity-alias` entries, declared at build time. Eight ship. Adding
  a ninth requires a new build — that's the platform's rule, not ours
  (see `IconSwitcher.kt`).
- **Is there CI?** Written, not yet active (0.2.5's process note): the
  PAT that published the repo lacks `workflow` scope, and GitHub blocks
  workflow files on every API for such tokens. Owner action to activate:
  add `.github/workflows/ci.yml` via the web UI, or re-scope the PAT.
  Its shape: checkout → setup-java 17 (Temurin) → `chmod +x gradlew` →
  `:core:engine:testDebugUnitTest` → `:app:assembleDebug` → upload the
  APK artifact.
- **What's tested?** The engine's JVM-pure logic (20 tests): Jaro-Winkler
  against Stario's oracle scores, the accent quantizer, battery math,
  the category-UUID scheme. UI is verified by build + device use, not
  automated tests (yet — UI-layer tests are deliberate backlog).
- **Can I contribute proprietary launcher code I decompiled?** No —
  behavior reference only; reimplement in our Kotlin/Compose
  (`decisions.md`, 2026-10-20). Stario's GPL code is the only
  line-faithful porting source.
