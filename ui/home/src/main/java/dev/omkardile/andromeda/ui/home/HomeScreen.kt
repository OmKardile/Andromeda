/*
 * The home screen. Started life as the engine-to-UI wiring proof (a real
 * installed-app count over a striped Haze backdrop — the stripes were
 * 0.1.8's honest blur-test surface). 0.2.1 made it a real home screen:
 * localized clock (30s tick), date, time-of-day greeting, and the actual
 * system wallpaper as the backdrop + Haze source. The stripes survive as
 * the live-wallpaper fallback (WallpaperManager returns null for live
 * wallpapers, and the Haze backdrop needs visible content to blur).
 *
 * 0.1.8's haze sibling structure is preserved (it was the 0.1.5 bug):
 * wallpaper/source layer and content/dock layers are siblings under one
 * Box, never parent-child.
 *
 * The wallpaper-reactive accent is applied one level up — MainActivity
 * feeds it into AndromedaTheme, so every screen inherits it — this
 * screen just reads the theme.
 *
 * No MaterialTheme/Text here on purpose — BasicText + this module's own
 * TextStyle tokens, per the "no Material UI" requirement.
 */

package dev.omkardile.andromeda.ui.home

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.Image
import androidx.compose.foundation.clickable
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
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import dev.chrisbanes.haze.HazeState
import dev.chrisbanes.haze.hazeEffect
import dev.chrisbanes.haze.hazeSource
import dev.omkardile.andromeda.core.engine.AppRepository
import dev.omkardile.andromeda.core.engine.WallpaperRepository
import dev.omkardile.andromeda.design.AndromedaSpacing
import dev.omkardile.andromeda.design.AndromedaType
import dev.omkardile.andromeda.design.LocalAndromedaColors
import kotlinx.coroutines.delay
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import java.time.format.FormatStyle
import java.util.Locale

@Composable
fun HomeScreen(
    appRepository: AppRepository,
    wallpaperRepository: WallpaperRepository,
    onOpenDrawer: () -> Unit,
    onOpenBlurPoc: () -> Unit,
    onOpenIconPicker: () -> Unit,
) {
    val apps by appRepository.apps.collectAsState()
    val wallpaper by wallpaperRepository.wallpaper.collectAsState()
    val colors = LocalAndromedaColors.current
    val hazeState = remember { HazeState() }

    val time by rememberTick()

    Box(modifier = Modifier.fillMaxSize()) {
        // Layer 1 — the source. The real system wallpaper, or the striped
        // pattern when the wallpaper is live (no drawable to read).
        // Sibling of layers 2/3, never their parent (0.1.5's bug).
        val wallpaperImage = remember(wallpaper) { wallpaper?.asImageBitmap() }
        if (wallpaperImage != null) {
            Image(
                bitmap = wallpaperImage,
                contentDescription = null, // decorative backdrop
                contentScale = ContentScale.Crop,
                modifier = Modifier
                    .fillMaxSize()
                    .hazeSource(state = hazeState),
            )
        } else {
            StripedFallback(modifier = Modifier.fillMaxSize().hazeSource(state = hazeState))
        }

        // Layer 2 — clock, date, greeting, dev links. Sibling of the source layer.
        Column(
            modifier = Modifier.fillMaxSize().padding(AndromedaSpacing.lg),
            verticalArrangement = Arrangement.Top,
        ) {
            Spacer(Modifier.height(AndromedaSpacing.xxl))
            BasicText(
                text = time.format(timeFormatter()),
                style = AndromedaType.Display.copy(color = colors.onSurface),
            )
            Spacer(Modifier.height(AndromedaSpacing.xs))
            BasicText(
                text = rememberDateLine(),
                style = AndromedaType.Body.copy(color = colors.onSurfaceMuted),
            )
            Spacer(Modifier.height(AndromedaSpacing.md))
            BasicText(
                text = greetingFor(time),
                style = AndromedaType.Title.copy(color = colors.onSurface),
            )
            BasicText(
                text = if (apps.isEmpty()) "Indexing apps…" else "${apps.size} apps found",
                style = AndromedaType.Label.copy(color = colors.onSurfaceMuted),
            )
            Spacer(Modifier.height(AndromedaSpacing.md))
            BasicText(
                text = "Blur POC →",
                modifier = Modifier.clickable(onClick = onOpenBlurPoc),
                style = AndromedaType.Label.copy(color = colors.onSurfaceMuted),
            )
            Spacer(Modifier.height(AndromedaSpacing.sm))
            BasicText(
                text = "App icon →",
                modifier = Modifier.clickable(onClick = onOpenIconPicker),
                style = AndromedaType.Label.copy(color = colors.onSurfaceMuted),
            )
        }

        // Layer 3 — dock. Tap opens the real app drawer (ui:drawer).
        // The real floating search/dock look (plan §1) is the next pass.
        Box(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = AndromedaSpacing.xl)
                .fillMaxWidth(0.85f)
                .height(72.dp)
                .clip(RoundedCornerShape(28.dp))
                .hazeEffect(state = hazeState) {
                    blurRadius = 24.dp
                }
                .clickable(onClick = onOpenDrawer),
        )
    }
}

/** Clock state, re-read every ~30 seconds — minute-accurate enough for a
 *  home-screen clock without per-frame recomposition. */
@Composable
private fun rememberTick(): androidx.compose.runtime.State<LocalTime> {
    val time = remember { mutableStateOf(LocalTime.now()) }

    LaunchedEffect(Unit) {
        while (true) {
            // Align the next tick to just past a half-minute boundary so
            // the clock never shows a stale minute after long suspension.
            val now = System.currentTimeMillis()
            delay(30_000 - (now % 30_000) + 50)
            time.value = LocalTime.now()
        }
    }

    return time
}

@Composable
private fun rememberDateLine(): String = remember {
    java.time.LocalDate.now().format(
        DateTimeFormatter.ofLocalizedDate(FormatStyle.FULL).withLocale(Locale.getDefault()),
    )
}

private fun timeFormatter(): DateTimeFormatter =
    DateTimeFormatter.ofLocalizedTime(FormatStyle.SHORT).withLocale(Locale.getDefault())

private fun greetingFor(time: LocalTime): String = when (time.hour) {
    in 5..11 -> "Good morning"
    in 12..16 -> "Good afternoon"
    in 17..21 -> "Good evening"
    else -> "Good night"
}

/** 0.1.8's honest blur-test surface, demoted (0.2.1) to the live-wallpaper
 *  fallback: real Haze blurring still needs visible structure behind it. */
@Composable
private fun StripedFallback(modifier: Modifier = Modifier) {
    Canvas(modifier = modifier) {
        val stripeWidth = 24.dp.toPx()
        var x = 0f
        var stripeIndex = 0
        while (x < size.width) {
            drawRect(
                color = if (stripeIndex % 2 == 0) Color(0xFF23233A) else Color(0xFF0D0D14),
                topLeft = Offset(x, 0f),
                size = Size(stripeWidth, size.height),
            )
            x += stripeWidth
            stripeIndex++
        }
    }
}
