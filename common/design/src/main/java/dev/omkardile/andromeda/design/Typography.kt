/*
 * Inter (SIL Open Font License 1.1) is the app's typography — the
 * standard open-licensed stand-in for Apple's SF Pro, whose license
 * covers Apple platforms only and can't be bundled in an Android APK.
 * Full license text: THIRD_PARTY_LICENSES.md at the repo root.
 *
 * The variable font is one resource covering the whole weight axis:
 * each Font entry pins the weight it's matched against (Compose's
 * Font() derives the wght variation settings from the weight by
 * default), and TextStyle font weights resolve to real axis positions
 * rather than synthetic bold. The three entries below are the weights
 * this project's tokens actually use.
 */

package dev.omkardile.andromeda.design

import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.Font
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp
import dev.omkardile.andromeda.design.R as DesignR

object AndromedaType {

    private val family = FontFamily(
        Font(DesignR.font.inter_variable, weight = FontWeight.Normal),
        Font(DesignR.font.inter_variable, weight = FontWeight.Medium),
        Font(DesignR.font.inter_variable, weight = FontWeight.SemiBold),
    )

    val Display = TextStyle(fontFamily = family, fontWeight = FontWeight.SemiBold, fontSize = 34.sp)
    val Title = TextStyle(fontFamily = family, fontWeight = FontWeight.SemiBold, fontSize = 22.sp)
    val Body = TextStyle(fontFamily = family, fontWeight = FontWeight.Normal, fontSize = 16.sp)
    val Label = TextStyle(fontFamily = family, fontWeight = FontWeight.Medium, fontSize = 13.sp)
}
