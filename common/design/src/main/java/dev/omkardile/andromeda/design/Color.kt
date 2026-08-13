/*
 * Base palette (Background/Surface) is new. The eleven accent values below
 * are not invented — they're pulled directly from Stario's real dark-theme
 * resources (res/themes/values/xyz_dark.xml, colorPrimary per accent), so
 * picking "Turquoise" here looks like picking "Turquoise" in the original
 * app. Swap freely — these are a grounded starting point, not a mandate.
 */

package dev.omkardile.andromeda.design

import androidx.compose.ui.graphics.Color

object AndromedaColors {
    val Background = Color(0xFF0A0A0F)
    val Surface = Color(0xFF191A1E)      // matches Stario's real colorSurface
    val OnSurface = Color(0xFFE1E1E5)    // matches Stario's real colorOnSurface
    val OnSurfaceMuted = Color(0xFFA0A0AC)
    val GlassTint = Color(0x33FFFFFF)
}

/** Mirrors Stario's real Theme enum (themes/Theme.java) — same eleven named
 * accents plus Dynamic/Monochrome, minus the XML style-resource plumbing
 * Compose doesn't need. */
enum class AndromedaAccent(val color: Color) {
    Blue(Color(0xFF7698FF)),
    Purple(Color(0xFFA476FF)),
    Turquoise(Color(0xFF76FFDD)),
    Cyan(Color(0xFF76E3FF)),
    Green(Color(0xFF8CFF76)),
    Lime(Color(0xFFD1FF76)),
    Yellow(Color(0xFFFFE876)),
    Orange(Color(0xFFFFAF76)),
    Red(Color(0xFFFF768C)),
    Pink(Color(0xFFFF76EC)),
    Monochrome(Color(0xFFC8C8C8)),
    // Dynamic (Material You wallpaper-derived) needs a real device/wallpaper
    // to resolve — wire this up when WallpaperAnimator work happens in Phase 4.
}
