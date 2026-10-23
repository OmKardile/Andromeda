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
 * 0.2.2: the dock is now the real floating dock shape (plan §1) — a
 * Haze-blurred search pill plus a Canvas-drawn 2×2 apps button (the
 * shape Stario's drawer-open control used). No Material icons; both
 * glyphs are drawn.
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
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
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
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
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
    onOpenSearch: () -> Unit,
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

        // Layer 3 — the floating dock (0.2.2): Haze-blurred search pill +
        // Canvas-drawn 2×2 apps button. Sibling of the source layer.
        Row(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .padding(bottom = AndromedaSpacing.xl)
                .fillMaxWidth(0.92f)
                .height(72.dp),
            horizontalArrangement = Arrangement.spacedBy(AndromedaSpacing.sm),
        ) {
            // Search pill — opens the floating search (ui:search).
            Row(
                modifier = Modifier
                    .weight(1f)
                    .clip(RoundedCornerShape(28.dp))
                    .hazeEffect(state = hazeState) {
                        blurRadius = 24.dp
                    }
                    .clickable(onClick = onOpenSearch)
                    .padding(horizontal = AndromedaSpacing.md),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                MagnifierGlyph(color = colors.onSurfaceMuted)
                Spacer(Modifier.width(AndromedaSpacing.sm))
                BasicText(
                    text = "Search",
                    style = AndromedaType.Body.copy(color = colors.onSurfaceMuted),
                )
            }

            // Apps button — 2×2 rounded squares, the drawer/dock glyph.
            Box(
                modifier = Modifier
                    .size(72.dp)
                    .clip(RoundedCornerShape(28.dp))
                    .hazeEffect(state = hazeState) {
                        blurRadius = 24.dp
                    }
                    .clickable(onClick = onOpenDrawer),
                contentAlignment = Alignment.Center,
            ) {
                AppsGridGlyph(color = colors.onSurface)
            }
        }
    }
}

/** Magnifier glyph — a stroked circle with a diagonal handle. Drawn, not
 *  an icon font: no Material, and a vector res per glyph would bloat the
 *  design module for two primitives. */
@Composable
private fun MagnifierGlyph(color: Color, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier.size(20.dp)) {
        val stroke = 2.dp.toPx()
        val lensRadius = (size.minDimension - stroke) / 2.6f
        val center = Offset(size.width * 0.42f, size.height * 0.42f)
        drawCircle(
            color = color,
            radius = lensRadius,
            center = center,
            style = Stroke(width = stroke),
        )
        drawLine(
            color = color,
            strokeWidth = stroke,
            start = Offset(center.x + lensRadius * 0.72f, center.y + lensRadius * 0.72f),
            end = Offset(size.width - stroke, size.height - stroke),
            cap = StrokeCap.Round,
        )
    }
}

/** The 2×2 apps grid glyph — four rounded squares. */
@Composable
private fun AppsGridGlyph(color: Color, modifier: Modifier = Modifier) {
    Canvas(modifier = modifier.size(28.dp)) {
        val gap = 3.dp.toPx()
        val radius = 2.5.dp.toPx()
        val cell = (size.minDimension - gap) / 2f
        val origins = listOf(
            Offset(0f, 0f),
            Offset(cell + gap, 0f),
            Offset(0f, cell + gap),
            Offset(cell + gap, cell + gap),
        )
        origins.forEach { origin ->
            drawRoundRect(
                color = color,
                topLeft = origin,
                size = Size(cell, cell),
                cornerRadius = CornerRadius(radius, radius),
            )
        }
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
