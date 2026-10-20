/*
 * New file — not a port. The Compose-facing counterpart to Stario's real
 * ProfileApplicationManager.java (see /reference/stario-source/.../apps/),
 * which does the same job for the View-based UI. That class is ~500 lines
 * and tightly coupled to Stario's own Application subclass, its
 * SharedPreferences wrapper (Entry), IconPackManager, and UiUtils — pulling
 * it in as-is would mean dragging in a large slice of the original app
 * rather than a clean engine layer. This is a deliberately smaller,
 * decoupled reimplementation of the same underlying approach: LauncherApps
 * + registerCallback for live updates, confirmed against the real source
 * rather than guessed. Multi-profile / hidden-apps / icon-pack support from
 * the original are intentionally out of scope for this first pass.
 *
 * Phase 3: now loads real icons too (via LauncherActivityInfo.getIcon) —
 * HomeScreen only ever needed a count, but the drawer needs the real thing.
 */

package dev.omkardile.andromeda.core.engine

import android.content.Context
import android.content.pm.LauncherApps
import android.os.UserHandle
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class AppRepository(private val context: Context) {

    private val launcherApps =
        context.getSystemService(Context.LAUNCHER_APPS_SERVICE) as LauncherApps

    private val densityDpi = context.resources.displayMetrics.densityDpi

    private val _apps = MutableStateFlow<List<LauncherApplication>>(emptyList())
    val apps: StateFlow<List<LauncherApplication>> = _apps.asStateFlow()

    private var callbackRegistered = false

    /** Full re-index. Call once at startup; live changes after that come through [registerForChanges]. */
    fun refresh() {
        val result = mutableListOf<LauncherApplication>()

        for (profile in launcherApps.profiles) {
            for (activity in launcherApps.getActivityList(null, profile)) {
                // LauncherApplication is a Java class — Kotlin doesn't allow named
                // arguments on Java calls, so this has to be positional: (info, handle, label).
                val app = LauncherApplication(activity.applicationInfo, profile, activity.label.toString())
                // getIcon() handles adaptive icons and work-profile badging correctly —
                // don't reach for ApplicationInfo.loadIcon() instead, it does neither.
                app.icon = activity.getIcon(densityDpi)
                result += app
            }
        }

        _apps.value = result.sorted()
    }

    fun launch(app: LauncherApplication) = app.launch(context)

    /**
     * Registers for install/uninstall/update events so [apps] stays current
     * without polling. Safe to call more than once — only registers once.
     */
    fun registerForChanges() {
        if (callbackRegistered) return
        callbackRegistered = true

        launcherApps.registerCallback(object : LauncherApps.Callback() {
            override fun onPackageAdded(packageName: String?, user: UserHandle?) = refresh()
            override fun onPackageRemoved(packageName: String?, user: UserHandle?) = refresh()
            override fun onPackageChanged(packageName: String?, user: UserHandle?) = refresh()
            override fun onPackagesAvailable(
                packageNames: Array<out String>?, user: UserHandle?, replacing: Boolean,
            ) = refresh()
            override fun onPackagesUnavailable(
                packageNames: Array<out String>?, user: UserHandle?, replacing: Boolean,
            ) = refresh()
        })
    }
}
