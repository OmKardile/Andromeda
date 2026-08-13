# reference/stario-source

A curated subset of the real Stario source (`albu-razvan/Stario`, v2.16, archived
May 2026, GPL-3.0) — not the full 579-file repo, just the packages that matter for
the "keep the engine, rebuild the UI" plan: `apps/`, `themes/`, `preferences/`,
`utils/`, `sheet/drawer/` (drawer, categories, folders, search), `sheet/briefing/`
(the RSS/contextual feed — plan §1's "Misc" low-priority item), `activities/settings/`,
and `ui/utils/animation/` (WallpaperAnimator). Plus the real per-accent color values
from `res/themes/values/*.xml` that fed `common/design`'s palette.

**Not included here:** CI config, fastlane metadata, docs, fonts, translations,
and UI-layer code (recyclers, adapters, XML layouts) that's being rebuilt in
Compose rather than ported. If you need something outside this subset, it's in
the full `Stario-main` zip you already have — this folder is a pointer, not a
replacement for it.

**What's actually been ported into `core/engine` so far** (see plan §3, Phase 3):
`LauncherApplication.java` (adapted — see the file's header comment for exactly
what changed) and a from-scratch `AppRepository.kt` that reimplements what
`apps/ProfileApplicationManager.java` does for the View-based app, using the same
underlying `LauncherApps` + `registerCallback` approach confirmed against the real
class, but decoupled from Stario's own `Application` subclass, `Entry`-based
preferences wrapper, and `IconPackManager` — those add real value (especially
icon packs) but pulling them in means pulling in their whole dependency web too.
Worth doing properly in Phase 3, not rushed alongside initial scaffolding.

**Everything else here — `Category`/`CategoryManager`/`CategoryMappings`,
`Folder`/`FolderAdapter`, `DrawerAdapter`, `SearchFragment`, `Settings.java`,
`Theme.java`, `WallpaperAnimator.java` — is unported.** It's here so Phase 3
starts from the real code instead of guessing at it again.

All files under `java/` keep their original `com.stario.launcher` package and
GPL-3.0 header — don't just move them into `dev.omkardile.andromeda` without
adapting them the way `LauncherApplication.java` was; several of these classes
assume Stario's specific infrastructure (see e.g. `ProfileApplicationManager`'s
constructor, which takes a `Stario` Application instance directly).
