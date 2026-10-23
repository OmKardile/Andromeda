# Changelog

All notable changes to this project. Format loosely follows
[Keep a Changelog](https://keepachangelog.com/); versions match
`app/build.gradle.kts`' `versionName`.

## [0.2.3] — 2026-10-23

Feedback & status (the plan §1 "spring physics/feel" slice that doesn't
need a device to verify).

### Added
- **`core:engine`'s `Vibrations.kt`** — direct port of Stario's
  `preferences/Vibrations.java`: the 5ms one-shot at default amplitude,
  preference-gated (default ON). `VibratorManager.defaultVibrator` on
  API 31+ with the legacy `VIBRATOR_SERVICE` path for the 29–30 floor;
  no singleton coupling (plain object, Context in, pref read per call —
  SharedPreferences caches in memory, so it's free).
- **Haptics applied** to the real tap points: dock search pill + 2×2
  apps button, folder cards and folder-detail launches, search result
  and web-fallback rows.
- **`core:engine`'s `BatteryStatus.kt`** — sticky
  `ACTION_BATTERY_CHANGED` read via `registerReceiver(null, …)` (the
  sanctioned no-registration, no-permission pattern), pure
  level/scale/charging triple + guarded percentage math (the JVM-tested
  part).
- **Battery chip on the home screen** — top-right Haze-blurred glass
  chip; a Canvas-drawn charging bolt appears in the accent color while
  charging.

### Deliberately not built
- Usage-stats-based suggestions (the remaining "contextual home" item):
  opt-in-only permission territory per plan §8 — deferred until there's
  a real opt-in flow to put it behind, not smuggled in on a status-chip
  release.

## [0.2.2] — 2026-10-23

Floating search + the real dock (plan §1, High priority).

### Added
- **`core:engine`'s `search/JaroWinkler.kt`** — direct port of Stario's
  `JaroWinklerDistance.java` (itself Apache Commons Lang 3.3 lineage;
  attribution retained in-file). Semantics preserved exactly — rounding,
  null-argument exception — because Stario's documented example scores
  are the unit-test oracle for the port.
- **`core:engine`'s `search/SearchEngines.kt`** — direct port of
  Stario's `SearchEngine.java`: same ten engines, query templates
  byte-identical (a query built here lands on the same URL the original
  would build). Two deliberate deviations: default is **Kagi** (plan
  §1/§8), and Stario's icon drawables + in-app results pref branch are
  out (this UI hands off to the browser; the icons become text rows).
- **New `ui:search` module.** `SearchScreen.kt`: prefix-first ranking
  (alphabetical starts-with first, then Jaro-Winkler similarity ≥ 0.4,
  descending) over the hidden-filtered app list, a browser-handoff row
  for the active engine, auto-focus via `FocusRequester`, `imePadding`
  so results clear the keyboard. No Material — foundation's
  `BasicTextField` + own tokens.
- **Dock redesign** (`HomeScreen.kt`) — the real floating dock: a
  Haze-blurred search pill plus a Canvas-drawn 2×2 apps button (both
  glyphs drawn, no icon fonts — keeping the no-Material line honest).
  Tapping the pill opens search; the 2×2 opens the drawer.

### Known edge (documented, not fixed)
- `imePadding` relies on `WindowInsets.IME`, which behaves from API 30;
  on the API 29 floor with the manifest's `adjustNothing` the keyboard
  can cover the last result row. The launcher's edge-to-edge posture is
  worth more than that row on a 7-year-old device.

## [0.2.1] — 2026-10-23

The home screen becomes a real home screen (plan §1: clock, wallpaper-
reactive tinting).

### Added
- **`core:engine`'s `WallpaperRepository.kt`** — system wallpaper as a
  downscaled Bitmap StateFlow (screen-sized, not wallpaper-native —
  4K bitmaps in memory are pure waste) plus an accent ARGB StateFlow.
  Change signal is `WallpaperManager.OnColorsChangedListener` + a cheap
  resume-time re-read (see Fixed for why not the obvious broadcast).
- **`core:engine`'s `AccentExtractor.kt`** — purpose-built quantizer
  (Stario's accent path went through androidx.palette; this project
  carries no Material). Pure-Kotlin core: 12 hue buckets,
  saturation² × value weights, monochrome → null, dark-UI visibility
  nudge on the winner. JVM-testable end to end (ARGB ints in, ARGB out).
- **`HomeScreen.kt` rewritten** — localized clock (30s tick aligned to
  the half-minute so a long suspension never shows a stale minute),
  localized full date, time-of-day greeting, and the **real wallpaper
  as the Haze backdrop** (the 0.1.8 stripes demoted to the live-wallpaper
  fallback, since `getDrawable()` returns null for live wallpapers and
  Haze needs visible content behind it).
- MainActivity feeds the wallpaper accent into `AndromedaTheme` (every
  screen inherits it); monochrome/absent falls back to Blue. Wallpaper
  re-read on resume.

### Fixed
- Caught while writing the receiver: **`ACTION_WALLPAPER_CHANGED` is
  removed from the API 36 SDK** (deprecated API 33, now not even
  compiling) — the compile against `platforms;android-36` proved it.
  Switched to the platform's sanctioned replacement
  (`OnColorsChangedListener`), which also fires for live-wallpaper
  color drift. Another find that only machine verification catches.

## [0.2.0] — 2026-10-23

Documentation round + the App Library — plan §1's High-priority folder
grid, built over Stario's real category system.

### Added
- Onboarding doc set (from the docs round folded into this release):
  `technical-documentation.md`, `decisions.md`, `help.md`, `compact.md`,
  a Documentation index in the README, and this CHANGELOG's Unreleased
  practice. Retroactive git tags `v0.1.8` and `v0.1.11`.

- **`core:engine`'s `CategoryRepository.kt`** — decoupled port of Stario's
  category trio (`Category`/`CategoryManager`/`CategoryMappings`). Category
  identifiers are Stario's exact UUID scheme (`nameUUIDFromBytes` over the
  4-byte category int), and the SharedPreferences layout mirrors Stario's
  (`CATEGORIES` remaps, `CATEGORY_NAMES` custom names,
  `CATEGORY_MAP.CATEGORIES` folder order, `CATEGORY_MAP.<uuid>` app order)
  so persisted state stays schema-compatible. `StateFlow` instead of the
  listener zoo; MainActivity owns the recompute trigger.
- **`core:engine`'s `HiddenAppsRepository.kt`** — the hidden-apps set
  (Stario's Settings' hide concept), sharing one per-profile key scheme
  (`AppKeys`) with CategoryRepository so the two can't disagree about app
  identity. Hidden apps are now actually hidden — from the drawer and the
  App Library both.
- **`ui:drawer`'s `FolderGridScreen.kt`** — 2-column liquid-glass folder
  cards (Cloudy, per plan §2's blur layering); tap opens a detail overlay
  with a Haze-blurred scrim (`HazeTint`, 1.x `tints = listOf(...)` API) and
  a spring entrance (`MutableTransitionState` + `AndromedaMotion`
  tokens). Long-press an app in the detail to pick it up, tap a slot to
  move it — the permutation persists through CategoryRepository (Stario's
  `updatePermutation` semantics).
- **`common:design`'s `Motion.kt`** — spring tokens (`snappy` / `gentle` /
  `entrance`) so physics tuning has one home, per the plan's later
  "Animations & Physics Tuning" phase. Plus `Drawables.kt`: the
  `Drawable.toImageBitmapOrNull()` helper promoted from DrawerScreen
  (promoted because the folder grid needed a second copy).
- Drawer header gained a **Folders →** link; MainActivity wires the new
  `folders` route and re-fires the category refresh whenever the app index
  *or* the hidden set changes (hidden apps are filtered out before the
  refresh — that ordering was the mid-version bug this caught).
- `compose-animation` added to the version catalog (BOM-managed) and wired
  into `common:design` + `ui:drawer`.

### Fixed
- **`stickyHeader` no longer exists** in the foundation version BOM
  2026.06.00 resolves (deprecated in 1.7, since removed) — the drawer's
  letter headers are now plain list items that scroll with content, not
  pinned headers. A baseline bug caught by this version's first real
  compile: 0.1.9–0.1.11's drawer never compiled against its own pinned
  BOM as-is (the owner's local environment evidently resolved an older
  foundation). Pinned headers can return as a scroll-aware external
  header pass if the stickiness is missed in practice.

### Removed
- `business-documentation.md` — created in a local-only session and
  removed before anything was ever published (open-source direction; see
  `decisions.md` 2026-10-20). Never existed in any published commit.

### Process note
This version is a rebuild. The original 0.2.x line (and the docs commit)
were authored in a sandbox that was destroyed before anything was pushed
— see `decisions.md` 2026-10-23 for the full account. The rebuild was
verified differently than every version before it: a real Android SDK +
Gradle 8.11.1 + JDK 17 in the authoring environment, so **this is the
project's first machine-verified build** (the `stickyHeader` fix above
is the proof that verification was worth it). The earlier versions'
compile-status claims stand as written in their own entries — reasoning,
not machines, for 0.1.x.

## [0.1.11] — 2026-08-17

Real alternate-app-icon picker (plan §10) — 8 switchable icons, working
end to end.

### Added
- **8 real launcher icons**, curated from a 20-candidate batch: Eclipse
  (default), Ember, Orbit, Ivory, Prism, Horizon, Comet, Dusk. Roughly half
  the original batch had a systemic off-center-crop defect (wordmark cut
  off mid-letter, raw black wedge down one side) — those were excluded
  rather than shipped, not touched up; that kind of defect means content
  was never generated in the missing area, so it isn't fixable by
  cropping/repositioning after the fact. All 8 shipped ones are legacy
  (non-adaptive) icon resources, not adaptive-icon foreground/background
  layers — the source art already has rounded corners baked into the
  pixels, and Android's adaptive-icon system expects full-bleed artwork it
  masks itself; feeding it pre-rounded art would double-mask and look
  wrong on-device. True adaptive-icon-compliant source art (full-bleed, no
  baked-in frame) is a real follow-up if these get more design polish
  later, not needed for this to work correctly now.
- **`core:engine`'s `IconSwitcher.kt`** — the actual Android mechanism for
  switchable icons: 8 `activity-alias` entries in the manifest (added),
  each with its own icon, all targeting the same `MainActivity`; only one
  enabled at a time. `PackageManager.setComponentEnabledSetting()` is what
  "switching icons" actually is on Android — there's no iOS-style runtime
  image-swap API. The set of icons has to be declared at build time; this
  can't add a 9th option without a new build.
- **`ui:home`'s `IconPickerScreen.kt`** — a real picker grid, not a mockup.
  Reachable from Home ("App icon →"). Icon resources live in
  `common:design`'s `res/`, not `app`'s — a picker screen in `ui:home`
  can't reference resources that only exist in `app` (they don't flow
  backward across module dependencies), and `common:design` is a
  dependency both `app` and `ui:home` already share.
- MainActivity's manifest entry no longer carries the `LAUNCHER` category
  itself — that moved to the aliases. It keeps only `HOME`/`DEFAULT`
  (what makes Andromeda selectable as the device's home screen), which is
  a system capability rather than something the user "sees" as an icon,
  so it's unaffected by which alias is currently enabled.

### Process note
The architecture for this was first suggested via a parallel conversation
with a different AI tool, using React Native patterns (`require()`,
JS-style asset arrays) that don't apply to this project at all — this is
native Kotlin/Compose, not RN. Caught before any of that got implemented;
what's actually in this version is the real Android mechanism
(`activity-alias` + `PackageManager`), unrelated to that suggestion beyond
solving the same user-facing goal.

## [0.1.10] — 2026-08-15

Fixes a real compile failure in `ui:drawer`, first build attempt against
the new module.

### Fixed
- `DrawerScreen.kt` was missing `import androidx.compose.foundation.lazy.items`.
  `items(List<T>, ...)` is a top-level extension function on `LazyListScope`,
  not a member — it needs an explicit import same as any other extension
  function, regardless of how tied to `LazyColumn` it looks. Without it,
  `items(items = ..., key = ...) { app -> ... }` fell back to
  `LazyListScope`'s built-in member `items(count: Int, ...)` overload
  instead, which explains every error in the report at once: "No parameter
  named 'items'" and "No value for 'count'" (wrong overload entirely),
  `.info`/`.handle` unresolved (called on the `Int` index that overload
  actually provides), and the `Int`-vs-`LauncherApplication` mismatches
  (same root cause, different symptom). `stickyHeader` was already
  correctly imported but got reported as unresolved too — collateral
  confusion from the same missing import within the same lambda scope,
  same pattern as the `RowColumnParentData` incident a while back, not a
  second bug.

## [0.1.9] — 2026-08-14

First real Phase 3 push: the actual app drawer (plan §1, High priority),
plus a process note worth being upfront about.

### Added
- **New `ui:drawer` module.** `DrawerScreen.kt`: a real alphabetized app
  list (sticky letter headers via `LazyColumn`'s `stickyHeader`), a
  Niagara-style A–Z quick-scroll rail on the trailing edge (tap a letter,
  jump to that section — drag-to-scroll is a reasonable follow-up, not a
  blocker for this pass), tap-to-launch wired to `AppRepository.launch()`.
- **Real app icons.** `AppRepository` only ever counted apps before —
  `refresh()` now also loads each one's icon via
  `LauncherActivityInfo.getIcon(density)`, which (unlike
  `ApplicationInfo.loadIcon()`) handles adaptive icons and work-profile
  badging correctly.
- **Real Compose Navigation.** `MainActivity`'s old boolean-toggle hack is
  gone, replaced with an actual `NavHost` (`home` / `drawer` / `blur_poc`
  routes). The home screen's dock is now a real tap target that opens the
  drawer — its actual eventual job, not just a blur demo anymore.

### Process note
Mid-build, this session's own working directory got reset — a side effect
of how long this conversation has run, not anything on your end. Every
file I'd changed since 0.1.8 was gone. Recovered cleanly by replaying
every zip delivered so far (0.1.0 base + every CHANGES delta in order)
into a fresh checkout, verified it matched 0.1.8 exactly before redoing
any Phase 3 work on top of it, and only then continued. Flagging this so
the CHANGELOG stays an honest record — nothing about the app itself
changed because of it, but it's worth knowing the reconstruction path
exists if it's ever needed again.

## [0.1.8] — 2026-08-11 (resolved)

**Haze blur confirmed working on real hardware** (Motorola, Android 13).
0.1.7's striped test screenshot settled it unambiguously: stripes smear
into soft blends inside the Haze box, stay crisp outside it — textbook
correct blur behavior.

Worth being precise about what actually happened across 0.1.5–0.1.8,
since it looked like a longer bug hunt than it was: **0.1.5 was the real
fix.** hazeSource and hazeEffect were in a parent-child relationship,
which Haze's own docs flag as causing broken/recursive drawing;
restructuring them as siblings resolved it. 0.1.6 and 0.1.7 didn't fix
anything further — they were about building a test surface good enough
to *prove* 0.1.5 worked, after a smooth gradient and then a strong tint
both turned out to be bad enough test surfaces to leave genuine doubt.

### Changed
- Removed the diagnostic tint from `BlurPocScreen.kt` — served its
  purpose, no longer needed
- `HomeScreen.kt`'s dock backdrop swapped from a smooth vertical gradient
  to the same striped pattern as the POC screen, so the dock's blur is
  actually visible/provable there too rather than asserted by analogy to
  a different screen
- Both files' header comments updated to reflect resolved status and the
  real shape of what got fixed vs. what got proven

### Not changed
- The striped backdrops stay (in both files) rather than reverting to
  gradients — they're a genuinely more honest way to judge blur radius
  and quality by eye than a smooth gradient ever was. Swap for a real
  wallpaper bitmap when that's available; stripes were never meant to be
  the final look, just an honest one.

## [0.1.7] — 2026-08-11 (later)

Still diagnostic, not a fix. 0.1.6's tint test came back positive (a
strong, clearly-rendered red box), which proves `hazeEffect` isn't a
no-op — but on reflection that result is ambiguous about blur
specifically. A 60%-alpha tint over a fairly uniform dark patch of the
gradient looks like a flat solid block whether or not blur is actually
computing underneath it — the same underlying ambiguity as the original
"is this just a boring gradient" question, just with a tint layered on
top instead of resolved.

Real device (Motorola, Android 13) Logcat around the screen open showed
no Haze/RenderEffect-specific line — the fs-verity and AppSearch-indexing
errors present are unrelated system noise, and two "Davey!" frame-drop
warnings are real but generic, not blur-specific. Doesn't rule blur
failure in or out on its own.

### Changed (diagnostic, not permanent)
- Backdrop swapped from a smooth 3-stop gradient to a Canvas-drawn striped
  pattern (alternating 24dp bars). Real high-frequency detail: if blur is
  actually computing, the stripe edges under the Haze box should visibly
  smear. If it isn't, they stay crisp. Unlike a gradient or a solid tint,
  this can't produce an ambiguous result either way.
- Tint alpha dropped 0.6 → 0.15, low enough to no longer risk masking
  whether the stripes underneath are sharp or blurred.

## [0.1.6] — 2026-08-11

Not a fix — a diagnostic build. 0.1.5's sibling restructuring was correct
per Haze's own documented pattern but didn't change what's actually
visible on-device (real device: Motorola, Android 13, confirmed clean
uninstall/reinstall each time — ruling out both the emulator-RenderEffect
theory and stale-APK theory).

**Correction within this same version:** the diagnostic tint originally
shipped as `tint = HazeTint(...)` (singular), which doesn't compile —
"Unresolved reference 'tint'". Cross-checked three sources this time
instead of one: the migration guide's actual code sample, Haze's
source-derived API docs (DeepWiki), and its official usage docs all agree
the real 1.x property is `tints` (plural, `List<HazeTint>`). The singular
form was from a blog post's simplified example, which was wrong. Fixed.

Re-checked the full code against Haze's own troubleshooting checklist for
this exact symptom ("no blur visible, content shows through"):
`hazeSource` present, shared `HazeState`, no incorrect `blurEffect{}`
wrapper (confirmed again — that's 2.0.0-alpha01+ only, `haze-materials`
not `haze-blur-materials` is correct for 1.7.2, per Haze's own migration
guide), transparent container. Everything checks out against the docs.
Found one real, current GitHub issue describing Haze rendering problems
on a Motorola device specifically — different Android version (15 vs.
our 13) and a crash rather than silent no-op, so not a confirmed match,
but it establishes device-specific Haze rendering quirks are a real,
documented category of issue, not a stretch.

### Added (temporary — remove once the real cause is found)
- `BlurPocScreen.kt`'s Haze box now also sets a strong red `tint`
  alongside the blur. This isolates two different possible failures:
  if the tint shows up but blur still doesn't, `hazeEffect` is running
  and the problem is specifically in blur computation on this device. If
  neither the tint nor the blur show up, `hazeEffect` isn't rendering at
  all, which points somewhere else entirely (layer/composition issue
  rather than a blur-specific one).

### Needed to proceed
Logcat output from around when the Blur POC screen opens — if Haze is
hitting and swallowing an exception internally, or falling back silently,
that's the one place it would actually show up. Static code review has
run its course; the code matches documented API, so the next real signal
has to come from the device itself.

## [0.1.5] — 2026-08-10

Fixes a real rendering bug 0.1.4 missed: Haze compiled and ran cleanly,
but wasn't actually blurring anything. Found from screenshots of a
successful 0.1.4 build — the Haze box in the Blur POC screen showed no
trace of a card at all (no edge, no shape), not just a subtle effect
against a plain gradient as first assumed. That explanation didn't
survive a second look: even a smooth-gradient blur behind a
`clip(RoundedCornerShape(...))` should show *some* boundary. Zero trace
meant zero rendering, not subtle rendering.

### Fixed
- **`hazeSource` and `hazeEffect` were in a parent-child relationship in
  both `HomeScreen.kt` and `BlurPocScreen.kt`.** In both files, the outer
  `Box` carried `.hazeSource(...)` on itself, and the `hazeEffect` box(es)
  were nested inside that same `Box`'s content (three levels deep in
  `BlurPocScreen.kt`; a direct child in `HomeScreen.kt`). Haze's own
  troubleshooting docs flag this specific shape as causing broken/recursive
  drawing — the source's own render pass ends up including the effect
  that's trying to sample it. Haze's official example keeps them as
  siblings instead (a `hazeSource` `LazyColumn` next to a separate
  `hazeEffect` `TopAppBar`, both direct children of one outer `Box`, not
  nested in each other). Restructured both files the same way: the
  gradient+`hazeSource` layer is now its own `Box`, sitting as a sibling
  next to the content layer that contains the `hazeEffect` box(es), both
  under one plain outer `Box`.

### Process note
Worth naming directly: the previous response asserted this was "just a
flat gradient not showing off blur well" without re-examining the
screenshot closely enough to notice a real box should still show an edge.
That was corrected because the actual bug got pushed on rather than
accepted — a reminder to check "is this actually working" claims against
what a screenshot shows before making them, not just after being asked twice.

## [0.1.4] — 2026-08-09

First round of fixes against genuine compile errors rather than
dependency-resolution or tooling-version problems — Gradle sync and AAR
resolution are both clean as of 0.1.3, so this is `ui:home`'s own code.

### Fixed
- **Wrong Haze API version.** `HomeScreen.kt` and `BlurPocScreen.kt` both
  wrapped blur properties in a `blurEffect { }` block
  (`hazeEffect(state = hazeState) { blurEffect { blurRadius = 24.dp } }`).
  That syntax is real, but it's **Haze 2.0's** API specifically — the
  version actually pinned here is 1.7.2 (stable, pre-2.0), whose real
  syntax sets properties directly with no wrapper:
  `hazeEffect(state = hazeState) { blurRadius = 24.dp }`. Confirmed against
  Haze's own 1.x→2.0 migration guide this time rather than assumed.
- **`BlurPocScreen.kt` explicitly imported `androidx.compose.foundation.layout.weight`.**
  `weight()` isn't a top-level function — it's a member extension scoped to
  `RowScope`/`ColumnScope`, automatically available inside a `Row { }` or
  `Column { }` block with no import needed at all. The explicit import was
  resolving to the wrong symbol and shadowing the correctly-scoped one,
  which is what "internal in file" meant. Removed the import; `.weight(1f)`
  now resolves through `RowScope` normally.

## [0.1.3] — 2026-08-07

Fixes a real build failure (28 AAR metadata compatibility issues) caused
by 0.1.1's fix overcorrecting.

### What actually happened
0.1.1 fixed a real AGP 9.x incompatibility, but rolled back compileSdk
(36→34) and the Compose BOM (2026.06.00→2025.01.01) along with it — that
part wasn't necessary and turned out to be actively wrong. Haze, Cloudy,
and Compose Unstyled are all actively-developed 2026 libraries; their own
transitive AndroidX dependencies (activity, core, lifecycle, and others)
resolve to versions from mid-2026 regardless of what gets pinned directly
in this project, because Gradle's normal conflict resolution lets the
higher transitively-requested version win. The actual build log confirmed
this: resolved versions included `activity-compose:1.12.2`,
`androidx.core:1.17.0`, `lifecycle-runtime-compose:2.9.4` — all newer than
0.1.1's pins, and several of them require compileSdk 36 specifically (not
just 35) plus an AGP new enough to support it.

### Changed
- `compileSdk`/`targetSdk`: 34 → **36** again, across all four modules
- `agp`: 8.7.2 → **8.10.0** — confirmed (Android's own AGP 8.10 release
  notes) to support up to API 36, and it predates AGP 9.0's DSL rewrite
  entirely, so it doesn't carry the extension-decoration issue from 0.1.1.
  Not going all the way back to 9.3.0 — no reason to re-risk that class of
  problem when 8.10.0 covers what's actually needed.
- `kotlin`: 2.1.0 → **2.2.10**, `composeBom`: 2025.01.01 → **2026.06.00**
  — this combination (plus AGP 8.10.0, Gradle 8.11.1) is a Google-published
  tested pairing (Navigation SDK's Kotlin-compatibility table), not another
  guess
- `coreKtx`/`lifecycle`/`activityCompose` catalog entries updated to match
  what the actual build log showed resolving (1.17.0 / 2.9.4 / 1.12.2)
  rather than guessed-at numbers that transitive resolution was going to
  override anyway
- `gradle-wrapper.properties`: **unchanged** — 8.11.1 (set in 0.1.1) is
  exactly what Google's documented pairing calls for alongside AGP 8.10.0

### Not a project problem
The same build log's second failure — `UnknownHostException: dl.google.com`
— is a local DNS/network resolution failure reaching Google's Maven host,
not a configuration issue in this repo. Retry, and check for a VPN or
firewall blocking that host specifically if it recurs.

## [0.1.2] — 2026-08-05

Two real bugs found via an actual failed build (first time this project's
been run against a live Gradle+Kotlin compiler) plus one likely-downstream
symptom.

### Fixed
- **`core:engine`'s `AppRepository.kt` called `LauncherApplication`'s
  constructor with named arguments.** `LauncherApplication` is a Java
  class, and Kotlin never allows named arguments on Java calls — that's
  what "Named arguments are prohibited for non-Kotlin functions" meant.
  Switched to positional args.
- **`composeunstyled-theming:1.49.1` doesn't resolve.** 0.1.1 (and 0.1.0
  before it) used 0.1.0's guessed-at modular artifact names
  (`composeunstyled-theming`, `-button`, `-text-field`, `-platformtheme`)
  paired with the version number confirmed for a *different*, single
  monolithic artifact (`com.composables:compose-unstyled`) — flagged as
  exactly this risk in 0.1.1's own comments, and it was real. Replaced all
  four modular catalog entries with the one coordinate that's actually
  confirmed to exist: `com.composables:compose-unstyled:1.49.1`, used from
  `common:design` only for now. `ui:home`'s button/text-field deps are
  dropped entirely rather than guessed at again — nothing calls them yet
  anyway.

### About the Kotlin compiler crashes (Theme.kt, then BlurPocScreen.kt)
Not separately fixed, because they're very likely not a separate bug.
When a module dependency fails to resolve the way
`composeunstyled-theming` did, Gradle can't build a clean compile
classpath for that *entire* module — not just files that import the
missing library. `Theme.kt` doesn't even reference Compose Unstyled, which
is a strong tell that its crash (and `BlurPocScreen.kt`'s, in `ui:home`,
which depends on `common:design`) were downstream damage from
`common:design`'s broken classpath, not two more independent compiler
bugs. Expected to clear once the dependency fix above resolves cleanly —
**do a full cache invalidation before re-syncing, not just a normal
re-sync** (File → Invalidate Caches / Restart in Android Studio, or
`gradle clean` from a terminal once the wrapper's filled in). The failed
resolution attempts may have left stale/partial artifacts cached that a
plain re-sync won't clear on their own.

### Process note
This round involved Android Studio's built-in "Fix with AI" editing the
same files in parallel with this project's own back-and-forth, with
neither side able to see what the other changed. That's very likely part
of why things felt like they were "getting messed up" — worth avoiding
going forward. These three files should be taken as a clean overwrite of
whatever state they're currently in, not merged with other in-flight edits.

## [0.1.1] — 2026-08-03

Fixes a real Gradle sync failure reported after opening 0.1.0 in Android
Studio: `ApplicationExtensionImpl$AgpDecorated_Decorated cannot be cast to
class com.android.build.gradle.BaseExtension`.

### Root cause (best assessment — not lab-confirmed, see note below)
0.1.0 pinned AGP 9.3.0, which was current per Android's own docs at the
time this was written, paired with a compatibility flag
(`android.builtInKotlin=false`) meant to preserve the traditional
`org.jetbrains.kotlin.android` plugin's behavior under AGP 9's new built-in
Kotlin support. That combination is exactly the kind of thing that breaks:
AGP 9.x changed how its extension objects are decorated internally, and the
traditional Kotlin Android plugin's own extension-lookup code — written
against the older, more unified `BaseExtension` hierarchy — doesn't
reliably survive that change. The flag was a hedge on genuinely new (as of
Aug 2026) tooling, flagged as uncertain in 0.1.0's own comments, and it
didn't hold up.

### Changed
- `agp`: 9.3.0 → **8.7.2** — well-established, not the line that changed
  extension decoration
- `kotlin`: 2.4.10 → **2.1.0** — stepping back from the newest release to
  one with a longer track record alongside AGP 8.x
- `composeBom`: 2026.06.00 → **2025.01.01** — matched down to the more
  conservative AGP/Kotlin pair rather than mixing "very new" with "very safe"
- `compileSdk`/`targetSdk`: 36 → **34** across all four modules — 36 is
  contemporaneous with the AGP 9.x line this fix moves away from
- Removed `android.builtInKotlin=false` from `gradle.properties` — it's an
  AGP 9-specific flag; irrelevant (and one less variable) on AGP 8.x
- Added `gradle/wrapper/gradle-wrapper.properties`, explicitly pinning
  Gradle 8.11.1 rather than leaving the version to whatever Android Studio
  defaulted to. **`gradlew`/`gradlew.bat`/`gradle-wrapper.jar` still aren't
  included** — the jar is a compiled binary this environment can't produce
  without network access. Run `gradle wrapper --gradle-version 8.11.1` once
  locally (or Android Studio's own "Generate Gradle Wrapper" from the
  Gradle tool window) to fill those in; the properties file above will make
  either approach pull the intended version.

### Note on confidence
This environment has no network access and never has for this project —
0.1.0 shipped without ever going through a real Gradle sync, and this fix
is reasoned from the error message and known AGP 9.x changes, not verified
against an actual successful sync either. It's a well-motivated fix, not a
confirmed one. If this exact error persists after updating, that's useful
information — it would mean the AGP 9.x theory was wrong, and the next
thing to check is a duplicate/conflicting AGP version somewhere in the
build (a stale `buildSrc`, a second `com.android.tools.build:gradle`
declaration, or a leftover cache from the 9.3.0 attempt — try `File >
Invalidate Caches / Restart` in Android Studio either way after pulling
these changes in, since a prior failed sync can leave stale model data
around even on an otherwise-healthy Gradle install).

## [0.1.0] — 2026-08-01

Initial scaffold. Phase 1 ("Repository, CI & Fork Setup") + a slice of
Phase 2 ("Design System & Blur POC") from the plan's §3 timeline.

### Added
- Multi-module Gradle project: `app`, `core:engine`, `common:design`, `ui:home`
- Version catalog (`gradle/libs.versions.toml`) with Compose Unstyled, Haze,
  Cloudy, and JitPack repo wiring for Cloudy
- `core:engine`: `LauncherApplication.java` (adapted from Stario's real
  class) + `AppRepository.kt` (`LauncherApps`-based indexing with live
  update support via `registerCallback`)
- `common:design`: color/spacing/typography tokens, `AndromedaTheme`
  CompositionLocal, eleven accent colors matching Stario's real palette
- `ui:home`: `HomeScreen.kt` (real app count over a real Haze backdrop
  blur) and `BlurPocScreen.kt` (Haze vs. Cloudy side-by-side comparison —
  the plan's Phase 2 deliverable)
- Placeholder adaptive app icon (vector, not final artwork)
- GPL-3.0 `LICENSE` stub, project name/package finalized as Andromeda /
  `dev.omkardile.andromeda`
- `reference/stario-source/`: curated subset of the real Stario codebase
  (apps, themes, drawer/categories/folders/search, settings, briefing/RSS,
  wallpaper animation) for porting from in later phases

### Known gaps (tracked against plan §3, not bugs — just not built yet)
- No live Gradle sync performed (no network access in the environment that
  built this) — see README "Building" section before opening in Android
  Studio
- App drawer, folders, search, dock, contextual home, settings: unbuilt
- Categories/folders engine layer (Stario's `Category`/`CategoryManager`/
  `CategoryMappings`): unported, real source is in `reference/`
- No real launcher icon artwork yet
- SF Pro not bundled (Apple platform-only license) — defaults to system
  font pending an Inter swap-in
