/*
 * New file — not a port. Stario hides apps in its Settings (HideApplicationsDialog,
 * see reference/stario-source/activities/settings/dialogs/hide/); the persistence
 * concept is theirs (a SharedPreferences set keyed per profile), the shape here is
 * ours: StateFlow instead of a singleton + listeners, and the per-profile key
 * scheme shared with CategoryRepository via AppKeys so the two can never disagree
 * about app identity.
 */

package dev.omkardile.andromeda.core.engine

import android.content.Context
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class HiddenAppsRepository(context: Context) {

    private val prefs =
        context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

    private val _hidden = MutableStateFlow<Set<String>>(emptySet())
    val hidden: StateFlow<Set<String>> = _hidden.asStateFlow()

    init {
        _hidden.value = prefs.getStringSet(KEY, emptySet())?.toSet() ?: emptySet()
    }

    /** Same per-profile key scheme as CategoryRepository (AppKeys). */
    fun keyOf(app: LauncherApplication): String = AppKeys.keyOf(app)

    fun isHidden(app: LauncherApplication): Boolean = _hidden.value.contains(keyOf(app))

    fun setHidden(app: LauncherApplication, hidden: Boolean) {
        val key = keyOf(app)
        val next = _hidden.value.toMutableSet()
        if (hidden) next.add(key) else next.remove(key)

        if (next != _hidden.value) {
            prefs.edit().putStringSet(KEY, next).apply()
            _hidden.value = next
        }
    }

    private companion object {
        const val PREFS_NAME = "dev.omkardile.andromeda.HIDDEN_APPS"
        const val KEY = "hidden"
    }
}
