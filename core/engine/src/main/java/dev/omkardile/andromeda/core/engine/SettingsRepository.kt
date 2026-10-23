/*
 * New file — not a port (Stario's settings lived in its Settings activity
 * + dialog zoo; the pieces this project actually persists are these).
 * One SharedPreferences file per app, one key per setting, StateFlows on
 * top. The haptics key is deliberately the same one Vibrations reads —
 * one source of truth, two readers, no sync to get wrong.
 *
 * Accent storage is a name (AndromedaAccent enum name) or null/"dynamic"
 * meaning "follow the wallpaper" — MainActivity resolves it so a user
 * choice always wins over the wallpaper-derived accent, and the default
 * (never set) keeps 0.2.1's wallpaper-reactive behavior.
 */

package dev.omkardile.andromeda.core.engine

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class SettingsRepository(context: Context) {

    private val prefs =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    /** Accent choice as an AndromedaAccent name; null = Dynamic (follow
     *  wallpaper, the pre-settings default). */
    private val _accentName = MutableStateFlow<String?>(null)
    val accentName: StateFlow<String?> = _accentName.asStateFlow()

    private val _hapticsEnabled = MutableStateFlow(true)
    val hapticsEnabled: StateFlow<Boolean> = _hapticsEnabled.asStateFlow()

    init {
        _accentName.value = prefs.getString(KEY_ACCENT, null)
        _hapticsEnabled.value = prefs.getBoolean(Vibrations.KEY_ENABLED, true)
    }

    /** [name] is an AndromedaAccent enum name, or null to go back to
     *  Dynamic (follow wallpaper). */
    fun setAccent(name: String?) {
        prefs.edit().putString(KEY_ACCENT, name).apply()
        _accentName.value = name
    }

    /** Shares the exact key Vibrations reads — see class doc. */
    fun setHapticsEnabled(enabled: Boolean) {
        prefs.edit().putBoolean(Vibrations.KEY_ENABLED, enabled).apply()
        _hapticsEnabled.value = enabled
    }

    companion object {
        const val PREFS_NAME = Vibrations.PREFS_NAME
        private const val KEY_ACCENT = "accent"
    }
}
