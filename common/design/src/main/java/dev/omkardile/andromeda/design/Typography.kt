/*
 * A note before you drop real fonts in: Apple's SF Pro is licensed for use
 * in software built for Apple platforms — bundling the actual font files in
 * an Android APK sits outside that license. Inter (SIL Open Font License)
 * is the standard substitute the Android community reaches for when chasing
 * an "SF Pro" look — near-identical proportions, fully open for this. Drop
 * Inter's .ttf files in app/src/main/res/font/ and wire them into the
 * FontFamily below when you get to Phase 2's design pass. Left as the
 * system default here so this module compiles without any font assets.
 */

package dev.omkardile.andromeda.design

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

object AndromedaType {
    private val family = FontFamily.Default // swap for Inter once font assets exist

    val Display = TextStyle(fontFamily = family, fontWeight = FontWeight.SemiBold, fontSize = 34.sp)
    val Title = TextStyle(fontFamily = family, fontWeight = FontWeight.SemiBold, fontSize = 22.sp)
    val Body = TextStyle(fontFamily = family, fontWeight = FontWeight.Normal, fontSize = 16.sp)
    val Label = TextStyle(fontFamily = family, fontWeight = FontWeight.Medium, fontSize = 13.sp)
}
