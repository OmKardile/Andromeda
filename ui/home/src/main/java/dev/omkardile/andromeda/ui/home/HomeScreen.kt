/*
 * Placeholder home screen — enough to prove the engine-to-UI wiring works
 * end to end: a real installed-app count via LauncherApps (core:engine),
 * rendered over a real Haze backdrop blur. The actual Niagara-style list,
 * dock, and search from plan §1 aren't built yet — that's Phase 4 onward.
 * No MaterialTheme/Text here on purpose — BasicText + this module's own
 * TextStyle tokens, per the "no Material UI" requirement.
 *
 * RESOLVED 0.1.8 (see CHANGELOG): 0.1.5 fixed hazeSource/hazeEffect being
 * in a parent-child relationship (restructured as siblings, per Haze's own
 * docs), confirmed working via BlurPocScreen.kt's striped test on real
 * hardware. Swapped this screen's smooth gradient for the same striped
 * pattern so the dock's blur is actually visible/provable here too, not
 * just asserted by analogy — a flat gradient wouldn't show it either way.
 */

package dev.omkardile.andromeda.ui.home

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import dev.chrisbanes.haze.HazeState
import dev.chrisbanes.haze.hazeEffect
import dev.chrisbanes.haze.hazeSource
import dev.omkardile.andromeda.core.engine.AppRepository
import dev.omkardile.andromeda.design.AndromedaSpacing
import dev.omkardile.andromeda.design.AndromedaType
import dev.omkardile.andromeda.design.LocalAndromedaColors

@Composable
fun HomeScreen(appRepository: AppRepository) {
    val apps by appRepository.apps.collectAsState()
    val colors = LocalAndromedaColors.current
    val hazeState = remember { HazeState() }

    Box(modifier = Modifier.fillMaxSize()) {
        // Layer 1 — the source. A sibling of layer 2/3 below, not their
        // parent: this was 0.1.5's actual bug. Striped rather than a smooth
        // gradient so the dock's blur is genuinely visible against it.
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
                    color = if (stripeIndex % 2 == 0) Color(0xFF23233A) else Color(0xFF0D0D14),
                    topLeft = Offset(x, 0f),
                    size = androidx.compose.ui.geometry.Size(stripeWidth, size.height),
                )
                x += stripeWidth
                stripeIndex++
            }
        }

        // Layer 2 — title + app count. Sibling of the source layer.
        Column(
            modifier = Modifier.fillMaxSize().padding(AndromedaSpacing.lg),
            verticalArrangement = Arrangement.Top,
        ) {
            Spacer(Modifier.height(AndromedaSpacing.xxl))
            BasicText(text = "Andromeda", style = AndromedaType.Display.copy(color = colors.onSurface))
            Spacer(Modifier.height(AndromedaSpacing.xs))
            BasicText(
                text = if (apps.isEmpty()) "Indexing apps…" else "${apps.size} apps found",
                style = AndromedaType.Body.copy(color = colors.onSurfaceMuted),
            )
        }

        // Layer 3 — dock placeholder, also a sibling of the source layer so
        // its hazeEffect can actually blur what's behind it. The real
        // floating search/dock (plan §1) lands here in Phase 4.
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = AndromedaSpacing.xl)
                .fillMaxWidth(0.85f)
                .height(72.dp)
                .clip(RoundedCornerShape(28.dp))
                .hazeEffect(state = hazeState) {
                    blurRadius = 24.dp
                },
        )
    }
}
