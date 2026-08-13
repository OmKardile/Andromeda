/*
 * Phase 2 deliverable (plan §3): side-by-side comparison of the two blur
 * layers the plan settled on. Left card: Haze, the everywhere backdrop
 * blur. Right card: Cloudy, reserved for liquid-glass accents (folders,
 * dock).
 *
 * RESOLVED 0.1.8 (see CHANGELOG): confirmed working on real hardware
 * (Motorola, Android 13) via the striped backdrop below — stripes smear
 * inside the Haze box, stay sharp outside it. The real fix was 0.1.5's
 * hazeSource/hazeEffect sibling restructuring (they were in a parent-child
 * relationship, which Haze's own docs flag as causing broken/recursive
 * drawing); 0.1.6/0.1.7 were about building a test that could prove it,
 * not additional bug-chasing. Diagnostic tint removed — it did its job.
 * Kept the striped backdrop over the original smooth gradient since it's
 * a genuinely more honest way to eyeball blur radius/quality than a
 * gradient ever was; swap for a real wallpaper bitmap when available.
 */

package dev.omkardile.andromeda.ui.home

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.skydoves.cloudy.cloudy
import dev.chrisbanes.haze.HazeState
import dev.chrisbanes.haze.hazeEffect
import dev.chrisbanes.haze.hazeSource
import dev.omkardile.andromeda.design.AndromedaSpacing
import dev.omkardile.andromeda.design.AndromedaType
import dev.omkardile.andromeda.design.LocalAndromedaColors

@Composable
fun BlurPocScreen() {
    val hazeState = remember { HazeState() }
    val colors = LocalAndromedaColors.current

    Box(modifier = Modifier.fillMaxSize()) {
        // Layer 1 — the source. A sibling of layer 2 below, not its parent
        // (that relationship was 0.1.5's actual bug). Striped, not a smooth
        // gradient — proved out the fix on real hardware; see file header.
        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .hazeSource(state = hazeState),
        ) {
            val stripeWidth = 24.dp.toPx()
            var x = 0f
            var stripeIndex = 0
            while (x < size.width) {
                drawRect(
                    color = if (stripeIndex % 2 == 0) Color(0xFFFFC857) else Color(0xFF1B1B3A),
                    topLeft = Offset(x, 0f),
                    size = androidx.compose.ui.geometry.Size(stripeWidth, size.height),
                )
                x += stripeWidth
                stripeIndex++
            }
        }

        // Layer 2 — foreground content, including the hazeEffect box. Sibling
        // of layer 1, so it can blur what's behind it without being inside it.
        Column(
            modifier = Modifier.fillMaxSize().padding(AndromedaSpacing.lg),
            verticalArrangement = Arrangement.spacedBy(AndromedaSpacing.lg, Alignment.CenterVertically),
        ) {
            BasicText(
                text = "Blur POC — Haze (left) vs Cloudy (right)",
                style = AndromedaType.Label.copy(color = colors.onSurface),
            )

            Row(horizontalArrangement = Arrangement.spacedBy(AndromedaSpacing.md)) {
                // Haze — backdrop blur, used everywhere in the real app.
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(160.dp)
                        .clip(RoundedCornerShape(28.dp))
                        .hazeEffect(state = hazeState) {
                            blurRadius = 24.dp
                        },
                    contentAlignment = Alignment.Center,
                ) {
                    BasicText("Haze", style = AndromedaType.Body.copy(color = colors.onSurface))
                }

                // Cloudy — classic blur shown here; swap for the liquid-glass
                // call once you've checked com.github.skydoves/cloudy's current README.
                Box(
                    modifier = Modifier
                        .weight(1f)
                        .height(160.dp)
                        .clip(RoundedCornerShape(28.dp))
                        .cloudy(radius = 20),
                    contentAlignment = Alignment.Center,
                ) {
                    BasicText("Cloudy", style = AndromedaType.Body.copy(color = colors.onSurface))
                }
            }
        }
    }
}
