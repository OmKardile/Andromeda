/*
 * The real Android mechanism for alternate app icons (plan §10) — there's
 * no runtime "swap this image" API like iOS has. Instead: multiple
 * activity-alias entries in AndroidManifest.xml, each with its own icon,
 * all targeting the same MainActivity. Only one alias should be enabled
 * at a time; PackageManager.setComponentEnabledSetting() is how "switching
 * icons" actually works — disable the old alias, enable the new one. The
 * set of possible icons has to be declared in the manifest ahead of time;
 * this can't add a 9th option at runtime without a new build.
 */

package dev.omkardile.andromeda.core.engine

import android.content.ComponentName
import android.content.Context
import android.content.pm.PackageManager

enum class AppIcon(val aliasName: String, val label: String) {
    ECLIPSE("dev.omkardile.andromeda.icon.Eclipse", "Eclipse"),
    EMBER("dev.omkardile.andromeda.icon.Ember", "Ember"),
    ORBIT("dev.omkardile.andromeda.icon.Orbit", "Orbit"),
    IVORY("dev.omkardile.andromeda.icon.Ivory", "Ivory"),
    PRISM("dev.omkardile.andromeda.icon.Prism", "Prism"),
    HORIZON("dev.omkardile.andromeda.icon.Horizon", "Horizon"),
    COMET("dev.omkardile.andromeda.icon.Comet", "Comet"),
    DUSK("dev.omkardile.andromeda.icon.Dusk", "Dusk"),
}

object IconSwitcher {

    /**
     * Which icon is currently active. On first run, before the user has ever
     * picked one, none of the aliases have an explicit enabled-state set —
     * PackageManager reports COMPONENT_ENABLED_STATE_DEFAULT for all of them,
     * not ENABLED, even for the one the manifest itself marks
     * android:enabled="true". So: look for an explicit ENABLED match first;
     * if nothing's ever been explicitly set, fall back to Eclipse, since
     * that's the one the manifest actually ships enabled.
     */
    fun current(context: Context): AppIcon {
        val pm = context.packageManager
        return AppIcon.entries.firstOrNull { icon ->
            pm.getComponentEnabledSetting(componentFor(context, icon)) ==
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED
        } ?: AppIcon.ECLIPSE
    }

    /** Disables every other alias, enables [target]. DONT_KILL_APP so this
     * doesn't restart the app out from under the user mid-selection — the
     * new icon shows up once the launcher (this app or whichever is active)
     * refreshes, which is usually near-instant but isn't always synchronous. */
    fun switchTo(context: Context, target: AppIcon) {
        val pm = context.packageManager
        for (icon in AppIcon.entries) {
            val state = if (icon == target) {
                PackageManager.COMPONENT_ENABLED_STATE_ENABLED
            } else {
                PackageManager.COMPONENT_ENABLED_STATE_DISABLED
            }
            pm.setComponentEnabledSetting(componentFor(context, icon), state, PackageManager.DONT_KILL_APP)
        }
    }

    private fun componentFor(context: Context, icon: AppIcon): ComponentName =
        ComponentName(context.packageName, icon.aliasName)
}
