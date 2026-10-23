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
