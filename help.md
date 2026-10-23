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
3. **The Gradle wrapper is not committed yet** (as of 0.1.11 — the
   environment that authored the early versions had no network, and the
   wrapper jar is a binary it couldn't produce). The pinned version is
   **8.11.1** in `gradle/wrapper/gradle-wrapper.properties`. Until the
   wrapper lands: run `gradle wrapper --gradle-version 8.11.1` once
   locally (needs any existing Gradle install), or use Android Studio's
   Gradle tool window → *Generate Gradle Wrapper*.
4. Build/install: `./gradlew :app:assembleDebug` then
   `adb install -r app/build/outputs/apk/debug/app-debug.apk` (or just
   press Run in Studio). Make it your home screen via Settings → Apps →
   Default apps → Home app → Andromeda. The system Home button switches
   you back out at any time.

## Environment facts (as of 0.1.11)

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
  covers Apple platforms. Inter (SIL OFL) is the accepted stand-in;
  it's not bundled yet (`Typography.kt` notes where it would go).
- **Where do alternate launcher icons come from?** Manifest
  `activity-alias` entries, declared at build time. Eight ship. Adding
  a ninth requires a new build — that's the platform's rule, not ours
  (see `IconSwitcher.kt`).
- **Is there CI?** Not yet (0.1.11) — arrives with the wrapper in a
  later version. Until then every "it compiles" claim in the CHANGELOG
  carries an honest process note about how it was (or wasn't) verified.
- **Can I contribute proprietary launcher code I decompiled?** No —
  behavior reference only; reimplement in our Kotlin/Compose
  (`decisions.md`, 2026-10-20). Stario's GPL code is the only
  line-faithful porting source.
