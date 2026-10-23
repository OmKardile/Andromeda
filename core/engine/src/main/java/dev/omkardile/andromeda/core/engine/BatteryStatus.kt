/*
 * New file — not a port (Stario read battery for its clock widget styling;
 * this is a standalone, simpler reader). Two layers on purpose:
 *
 * - [BatteryStatus.read] is the Android side: the sticky
 *   ACTION_BATTERY_CHANGED broadcast via registerReceiver(null, …) —
 *   the sanctioned no-registration read, no permission, no receiver
 *   lifetime to manage.
 * - [BatteryStatus.fromIntent] + [percentage] are pure and JVM-testable:
 *   the level/scale/charging triple and its math, exercised by the unit
 *   test without any Intent on the classpath.
 */

package dev.omkardile.andromeda.core.engine

import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.BatteryManager

data class BatteryStatus(
    val level: Int,
    val scale: Int,
    val isCharging: Boolean,
) {
    /** Guarded percentage: 0–100, never a divide-by-zero or an over-100. */
    val percentage: Int
        get() = if (scale > 0) (level * 100 / scale).coerceIn(0, 100) else 0

    companion object {
        /** One-shot read of the sticky battery broadcast; null when the
         *  platform doesn't provide it (shouldn't happen, but a launcher
         *  must not crash over a chip). */
        fun read(context: Context): BatteryStatus? {
            val intent = try {
                context.registerReceiver(null, IntentFilter(Intent.ACTION_BATTERY_CHANGED))
            } catch (exception: Exception) {
                null
            }
            return intent?.let(::fromIntent)
        }

        /** Pure parse — the JVM-testable triple extraction. */
        fun fromIntent(intent: Intent): BatteryStatus? {
            val level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1)
            val scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1)
            val status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1)

            if (level < 0 || scale <= 0) return null

            val charging = status == BatteryManager.BATTERY_STATUS_CHARGING ||
                status == BatteryManager.BATTERY_STATUS_FULL

            return BatteryStatus(level, scale, charging)
        }
    }
}
