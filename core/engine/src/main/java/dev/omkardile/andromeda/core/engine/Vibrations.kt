/*
 * Direct port of Stario's preferences/Vibrations.java (GPL-3.0,
 * (C) 2025 Răzvan Albu; original in reference/stario-source/.../preferences/).
 * Same behavior: a 5ms one-shot VibrationEffect at default amplitude,
 * gated by a user preference that defaults to ON.
 *
 * What changed: no singleton/Application coupling — a plain object with
 * Context in (vibrate reads the pref each call; SharedPreferences caches
 * in memory, so this is effectively free); VibratorManager on API 31+
 * (the direct VIBRATOR_SERVICE path Stario used is deprecated there)
 * with the legacy path kept for the 29–30 floor. The pref file + key
 * are shared with 0.2.4's SettingsRepository by design — one source of
 * truth for the toggle, read here, surfaced there.
 */

package dev.omkardile.andromeda.core.engine

import android.content.Context
import android.os.Build
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager

object Vibrations {

    const val PREFS_NAME = "dev.omkardile.andromeda.SETTINGS"
    const val KEY_ENABLED = "haptics_enabled"

    /** The 5ms one-shot — Stario's exact feedback profile. */
    fun vibrate(context: Context) {
        val prefs = context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        if (!prefs.getBoolean(KEY_ENABLED, true)) return

        val vibrator: Vibrator? = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
        } else {
            context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
        }

        vibrator?.takeIf { it.hasVibrator() }?.vibrate(
            VibrationEffect.createOneShot(5, VibrationEffect.DEFAULT_AMPLITUDE),
        )
    }
}
