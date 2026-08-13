package dev.omkardile.andromeda.design

import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.Color

/**
 * No MaterialTheme anywhere in this project on purpose (plan §1: "no
 * Material UI"). This CompositionLocal is the entire theming mechanism —
 * Compose Unstyled's own theming module (composeunstyled-theming) may offer
 * something more structured; check its docs before this grows much further.
 */
data class AndromedaColorScheme(
    val background: Color = AndromedaColors.Background,
    val surface: Color = AndromedaColors.Surface,
    val onSurface: Color = AndromedaColors.OnSurface,
    val onSurfaceMuted: Color = AndromedaColors.OnSurfaceMuted,
    val accent: Color = AndromedaAccent.Blue.color,
    val glassTint: Color = AndromedaColors.GlassTint,
)

val LocalAndromedaColors = staticCompositionLocalOf { AndromedaColorScheme() }

@Composable
fun AndromedaTheme(
    colorScheme: AndromedaColorScheme = AndromedaColorScheme(),
    content: @Composable () -> Unit,
) {
    CompositionLocalProvider(LocalAndromedaColors provides colorScheme) {
        content()
    }
}
