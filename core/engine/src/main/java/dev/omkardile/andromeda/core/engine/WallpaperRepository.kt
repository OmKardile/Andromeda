/*
 * New file — not a port. Stario's wallpaper reactivity lived in
 * themes/Theme.java + WallpaperAnimator.java; neither is in the curated
 * reference subset, and both are welded to Stario's own theming internals.
 * This is the decoupled equivalent: read the system wallpaper
 * (WallpaperManager needs no permission for a launcher reading its own
 * system wallpaper — plan §8), expose a downscaled Bitmap snapshot for
 * the home backdrop plus an accent ARGB int extracted from it, and keep
 * both fresh via WallpaperManager.OnColorsChangedListener + a resume-
 * time re-read.
 *
 * On the change signal: ACTION_WALLPAPER_CHANGED (the old broadcast) was
 * deprecated in API 33 and is REMOVED from the API 36 SDK — it doesn't
 * compile. OnColorsChangedListener is the platform's sanctioned
 * replacement and doubles as a live-wallpaper change signal (it fires on
 * color changes too, which live wallpapers produce as they animate).
 *
 * Live wallpapers: WallpaperManager.getDrawable() returns null for them
 * (or a static snapshot on some OEMs) — the UI treats null as "fall back
 * to the striped test pattern" so the Haze backdrop still has visible
 * content to blur (same reasoning as 0.1.8's stripe decision).
 */

package dev.omkardile.andromeda.core.engine

import android.app.WallpaperManager
import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.drawable.BitmapDrawable
import android.os.Handler
import android.os.Looper
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

class WallpaperRepository(private val context: Context) {

    private val _wallpaper = MutableStateFlow<Bitmap?>(null)
    val wallpaper: StateFlow<Bitmap?> = _wallpaper.asStateFlow()

    /** Dominant wallpaper accent as an ARGB int, or null when monochrome.
     *  Kept as Int (not a Compose Color) so this module stays Compose-free. */
    private val _accent = MutableStateFlow<Int?>(null)
    val accent: StateFlow<Int?> = _accent.asStateFlow()

    private var listenerRegistered = false

    private val listener = WallpaperManager.OnColorsChangedListener { _, _ -> refresh() }

    init {
        refresh()
    }

    /** Keep [refresh] cheap enough to call on resume as a fallback for
     *  devices/OEMs where the change broadcast doesn't reach us. */
    fun refresh() {
        val manager = context.getSystemService(WallpaperManager::class.java) ?: return
        val drawable = try {
            manager.drawable
        } catch (exception: Exception) {
            null
        }

        if (drawable == null) {
            _wallpaper.value = null
            _accent.value = null
            return
        }

        val bitmap = drawable.toScaledBitmap(SNAPSHOT_MAX_DIM)
        _wallpaper.value = bitmap
        _accent.value = AccentExtractor.fromBitmap(bitmap)
    }

    /**
     * OnColorsChangedListener — the sanctioned change signal (the old
     * ACTION_WALLPAPER_CHANGED broadcast is gone from the API 36 SDK,
     * and runtime receiver registration for protected broadcasts was
     * already fragile territory). The listener also fires for live
     * wallpaper color drift; refresh() is cheap by design, so that's
     * fine. Resume-time re-read (MainActivity) is the belt to this
     * listener's braces for OEMs where even this doesn't fire.
     */
    fun start() {
        if (listenerRegistered) return

        val manager = context.getSystemService(WallpaperManager::class.java) ?: return
        try {
            manager.addOnColorsChangedListener(listener, Handler(Looper.getMainLooper()))
            listenerRegistered = true
        } catch (exception: Exception) {
            // Not fatal — resume-refresh covers us. Deliberately quiet.
        }
    }

    private fun android.graphics.drawable.Drawable.toScaledBitmap(maxDim: Int): Bitmap {
        if (this is BitmapDrawable && bitmap != null) {
            val source = bitmap
            val scale = maxDim.toFloat() / maxOf(source.width, source.height)
            return if (scale < 1f) {
                Bitmap.createScaledBitmap(source, (source.width * scale).toInt().coerceAtLeast(1), (source.height * scale).toInt().coerceAtLeast(1), true)
            } else {
                source
            }
        }

        val width = intrinsicWidth.coerceIn(1, maxDim)
        val height = intrinsicHeight.coerceIn(1, maxDim)
        val target = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(target)
        setBounds(0, 0, canvas.width, canvas.height)
        draw(canvas)
        return target
    }

    private companion object {
        /** Backdrop snapshot size — screen-ish, not wallpaper-native (which
         *  can be 4K+ and would be pure waste in memory). */
        const val SNAPSHOT_MAX_DIM = 1440
    }
}
