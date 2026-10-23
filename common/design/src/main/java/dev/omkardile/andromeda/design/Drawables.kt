/*
 * New file — not a port. The Drawable -> ImageBitmap conversion every
 * icon-rendering screen needs; lived as a private fun inside
 * ui:drawer's DrawerScreen.kt until 0.2.0, promoted to common:design
 * when the folder grid (also in ui:drawer at the time) needed it too
 * and a second copy would have been inevitable.
 */

package dev.omkardile.andromeda.design

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.graphics.drawable.Drawable
import androidx.compose.ui.graphics.ImageBitmap
import androidx.compose.ui.graphics.asImageBitmap

/**
 * Renders any Drawable into a Compose-usable ImageBitmap, or null if it
 * can't be drawn (defensive: a launcher iterates every installed app and
 * a single broken icon must never crash the grid — callers show a plain
 * placeholder box instead).
 */
fun Drawable.toImageBitmapOrNull(): ImageBitmap? {
    return try {
        val bitmap = if (this is BitmapDrawable && bitmap != null) {
            bitmap
        } else {
            val width = intrinsicWidth.coerceAtLeast(1)
            val height = intrinsicHeight.coerceAtLeast(1)
            val target = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
            val canvas = Canvas(target)
            setBounds(0, 0, canvas.width, canvas.height)
            draw(canvas)
            target
        }
        bitmap.asImageBitmap()
    } catch (e: Exception) {
        null
    }
}
