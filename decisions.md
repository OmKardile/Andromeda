# Decisions

A dated log of the *why* behind non-obvious choices, so future sessions
don't relitigate settled things. Entries are append-only; supersede an
old call by writing a new dated entry that names it, never by editing
history. Format: date → decision → why → what would change my mind.

**Standing conventions** (established 2026-10-20):

- **Same-turn doc sync.** Every write to the repo updates the doc set
  in the same commit/turn — README, CHANGELOG, technical-documentation,
  decisions, help, compact. Docs that lag code are docs that lie.
- **One version = one commit = one tag.** `versionName` bumps in
  `app/build.gradle.kts` get a matching git tag (`v0.2.0` etc.).
  History before 0.2.0 was zip-delivered, not commit-granular, so the
  two early tags are retroactive and pinned to the commits that
  actually contain those versions.
- **GPL-3.0 is load-bearing.** This is a Stario fork; the license can't
  change, and Stario-derived files keep their copyright headers with
  change-notes attached. Attribution line (plan §10): "Andromeda is a
  fork of Stario (archived May 2026), originally created by Răzvan
  Albu."
- **No Material.** Compose Unstyled (single confirmed artifact) + own
  design tokens. If a control is needed, port or build it in
  `common:design` — don't reach for `androidx.compose.material`.
- **Engine ports are adapted, not copied.** Stario classes come in
  decoupled, with the coupling to Stario's `Application`/prefs/`UiUtils`
  deliberately cut; every ported file's header documents what changed
  and why (see `LauncherApplication.java` for the pattern).

---

## 2026-10-20 — session 1: documentation set

**Decision:** add five docs (technical-documentation, decisions, help,
compact + CHANGELOG Unreleased/README updates), factual and dated, with
zero content overlap by design — each file answers a different question
(what/how/why/traps/state).

**Why:** the repo shipped with a plan doc and a CHANGELOG but no
onboarding surface; a fresh session spent its first ~10 tool calls
re-deriving facts that were knowable. Also fixed README staleness vs
0.1.11: the "no launcher icon artwork" claim (8 icons shipped in
0.1.11), "all three screens" (it's four), the missing icon_picker route
in the module map.

**Discrepancies found and deliberately *not* resolved silently** (kept
as flags in compact.md): plan's Haze "2.0-style" pseudocode vs the
pinned 1.7.2 API; plan's nominal Gantt dates vs actual progress;
CHANGELOG version dates that predate their first git appearance
(zip-delivered workflow — git is the arrival record, CHANGELOG is the
authoring record, neither is "wrong").

## 2026-10-20 — session 2: open-source direction; business doc removed

**Decision:** the project is going open source (GPL-3.0, per plan §8).
The locally-created `business-documentation.md` was deleted before ever
being published — its operational content (licensing posture, privacy
posture, versioning practice) was cross-checked and shown to already
live in the plan doc / README / help / compact, so removal lost
nothing. The doc set is the six files this convention block names.

**Why:** a business document mixes audience assumptions (monetization
scenarios, competitive notes) with engineering facts; in a public GPL
repo only the facts belong.

## 2026-10-20 — session 2: jadx reference-code protocol

**Decision:** decompiled Java from proprietary launchers (jadx output
the owner supplies) is a **behavior reference only** — intent flags,
view structure, animation timing. It gets reimplemented in Andromeda's
own Kotlin/Compose; it is never pasted in, and its assets never ship.
GPL-3.0 code from Stario remains the only line-faithful porting source.

**Why:** GPL obligations attach to Stario-derived code and are handled
(headers, attribution, LICENSE); a proprietary launcher's code carries
entirely different rights, and "just for reference" is how license
messes happen. Behavior is not copyrightable; code is.

## 2026-10-23 — 0.2.0: App Library port shape, and the stickyHeader drop

**Decision:** port Stario's category trio as one `CategoryRepository` with
StateFlow (not the original's three listener interfaces), keep the UUID
scheme and SharedPreferences layout byte-compatible, and let MainActivity
own the recompute trigger. Deviation: category ints without a default
name fold into Unsorted (Stario rendered unnamed folders); default names
are Kotlin constants, not resources, keeping the engine resource-free
and JVM-testable. Also: drawer letter headers ship as *plain items* —
`stickyHeader` is gone from the resolved foundation.

**Why:** the trio's coupling (Stario's Application singleton, its prefs
wrapper, `UiUtils.post`) is exactly what this fork exists to shed;
StateFlow collapses the listener zoo with zero loss. Schema-compatible
persistence means a Stario-to-Andromeda upgrade path stays possible.
`stickyHeader` was deprecated in Compose Foundation 1.7 and removed
since — BOM 2026.06.00 has only `item`/`items`/`itemsIndexed` on
`LazyListScope`. Verified by decompiling the resolved jar; a pinned
header can return as a scroll-aware external header if the UX needs it.

**What would change my mind:** if real-device folder usage makes the
remap UI (moving apps *between* categories — engine support exists:
`remapApp`/`renameCategory`) a blocker, add it in the settings round.

## 2026-10-23 — 0.2.1: wallpaper change signal, and the accent quantizer

**Decision:** react to wallpaper changes via
`WallpaperManager.OnColorsChangedListener` (plus a cheap onResume re-read),
and extract the accent with our own pure-Kotlin quantizer rather than
androidx.palette (which Stario's lineage used).

**Why:** `ACTION_WALLPAPER_CHANGED` was deprecated in API 33 and is
*removed* from the API 36 SDK — verified against the platform jar when
the compile failed. The listener is the sanctioned replacement and
doubles as a live-wallpaper signal. androidx.palette would drag Material
lineage into a project whose stated identity is "no Material You";
12 hue buckets with saturation² × value weighting is ~80 lines, fully
JVM-testable, and biased toward *vivid* (not muted) colors, which suits
an 11-fixed-accent design language better than palette's tonal palettes.
A monochrome/null result is a feature, not a failure: it hands control
back to the default accent instead of inventing a gray "accent".

**What would change my mind:** if real-device accent extraction proves
too noisy across wallpaper types, gate it behind a settings toggle
(the settings round is 0.2.4) or blend with the system's
`WallpaperColors` primary.

## 2026-10-23 — 0.2.2: search porting fidelity, and drawn glyphs

**Decision:** port Jaro-Winkler and the search engines *exactly* (same
scores, same query templates), while skipping Stario's icon drawables
and in-app-results branch. Draw the dock glyphs with Canvas instead of
pulling an icon library.

**Why:** ranking behavior and query URLs are the compatibility surface
of search — byte-identical templates mean muscle memory and Stario-
era habits carry over, and the oracle scores pin the port in tests.
Icons and in-app results are presentation, and presentation is exactly
what this fork reimagines (text rows; browser handoff instead of a
webview results page). Icons libraries (Material or otherwise) would
betray the no-Material stance for two primitives that take six lines of
Canvas each.

**What would change my mind:** if the browser handoff feels too lossy
in practice (no in-app results page), Stario's `SearchFragment` +
`WebAdapter` remain in reference/ as the blueprint for a Compose
results screen.

## 2026-10-23 — 0.2.3: haptics port, and what didn't come with it

**Decision:** port Stario's Vibrations as-is (5ms one-shot, default-on
pref) and wire it into the real taps; add a battery chip; defer
usage-stats suggestions entirely.

**Why:** the 5ms one-shot is a tuned feel, not an arbitrary constant —
ports of feel should keep the feel. The battery chip's read pattern
(`registerReceiver(null, …)`) is the platform's no-lifetime-management
answer for sticky broadcasts. Usage-stats suggestions are the one
"contextual home" item gated behind explicit user opt-in by plan §8 —
adding the permission flow without the settings surface to explain it
would be exactly the smuggled-consent pattern the plan warns about, so
it waits for a real opt-in UI.

**What would change my mind:** nothing on haptics (the settings toggle
arrives in 0.2.4 sharing the same pref file/key); the usage-stats deferral
lifts when the settings round grows its privacy section.

## 2026-10-23 — session 3: sandbox loss, full rebuild, push authorization

**Decision:** after the sandbox that authored the 0.2.x line was
destroyed (environment reset between sessions), rebuild all of it from
the worklog spec against a fresh clone — docs commit, then v0.2.0
through v0.2.5 with their tags — and **push on completion**, per the
owner's explicit instruction this time. Push-before-verification
reluctance is moot now: the rebuilding environment has a real Android
SDK + Gradle 8.11.1, so every version is compile-verified locally before
its commit, and the first CI run (added in 0.2.5) verifies again.

**Why the loss happened / why it won't again:** eight commits and eight
tags lived only in a sandbox-local clone, held back from pushing by the
"wait for the owner" convention while the owner was away — the reset
then destroyed the only copy. Corollary: **unpublished work is
unfinished work.** The standing "hold pushes" convention is now
"push when the version is verified; the owner can revert what they
don't want." Tags v0.1.8/v0.1.11 are recreated on the original
published commits; 0.2.x tags ride their own commits.

**What would change my mind:** nothing about the rebuild itself; for
the push convention, only a direct owner instruction to go back to
holding.
