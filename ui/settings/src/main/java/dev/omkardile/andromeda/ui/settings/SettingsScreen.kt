/*
 * Settings (0.2.4) — plan §1's Low-priority-but-inevitable surface, done
 * in this fork's language: no Material, no preference-fragment machinery,
 * one scrollable Column of sections over the design tokens.
 *
 * Sections: Accent picker (11 accents + Dynamic = follow wallpaper;
 * chunked Rows deliberately — a LazyVerticalGrid inside a scrollable
 * Column is the classic infinite-height crash, same class of bug as
 * nesting one lazy container in another), Search engine (Stario's ten,
 * persisted through SearchEngines), Haptics (GlassSwitch on the pref
 * Vibrations reads — one source of truth), Hidden apps (the set the
 * drawer and App Library both filter against), Developer links (Blur
 * POC + app-icon picker, moved off the home screen where they were
 * always guests), and About (plan §10 attribution copy).
 */

package dev.omkardile.andromeda.ui.settings

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
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
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.unit.dp
import dev.omkardile.andromeda.core.engine.AppRepository
import dev.omkardile.andromeda.core.engine.HiddenAppsRepository
import dev.omkardile.andromeda.core.engine.SettingsRepository
import dev.omkardile.andromeda.core.engine.Vibrations
import dev.omkardile.andromeda.core.engine.search.SearchEngines
import dev.omkardile.andromeda.design.AndromedaAccent
import dev.omkardile.andromeda.design.AndromedaMotion
import dev.omkardile.andromeda.design.AndromedaSpacing
import dev.omkardile.andromeda.design.AndromedaType
import dev.omkardile.andromeda.design.LocalAndromedaColors
import dev.omkardile.andromeda.design.toImageBitmapOrNull
import androidx.compose.foundation.Image

private const val VERSION_LINE = "0.2.4"

@Composable
fun SettingsScreen(
    appRepository: AppRepository,
    hiddenAppsRepository: HiddenAppsRepository,
    settingsRepository: SettingsRepository,
    onOpenIconPicker: () -> Unit,
    onOpenBlurPoc: () -> Unit,
    onBack: () -> Unit,
) {
    val colors = LocalAndromedaColors.current

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
            .verticalScroll(rememberScrollState()),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(AndromedaSpacing.lg),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            BasicText(text = "Settings", style = AndromedaType.Title.copy(color = colors.onSurface))
            BasicText(
                text = "← Home",
                modifier = Modifier.clickable(onClick = onBack),
                style = AndromedaType.Label.copy(color = colors.onSurface),
            )
        }

        AccentSection(settingsRepository = settingsRepository)
        SearchEngineSection()
        HapticsSection(settingsRepository = settingsRepository)
        HiddenAppsSection(
            appRepository = appRepository,
            hiddenAppsRepository = hiddenAppsRepository,
        )
        DeveloperSection(
            onOpenIconPicker = onOpenIconPicker,
            onOpenBlurPoc = onOpenBlurPoc,
        )
        AboutSection()

        Spacer(Modifier.height(AndromedaSpacing.xxl))
    }
}

// ------------------------------------------------------------- sections

@Composable
private fun SectionLabel(text: String) {
    val colors = LocalAndromedaColors.current
    BasicText(
        text = text,
        style = AndromedaType.Label.copy(color = colors.onSurfaceMuted),
        modifier = Modifier.padding(horizontal = AndromedaSpacing.lg),
    )
}

@Composable
private fun AccentSection(settingsRepository: SettingsRepository) {
    val colors = LocalAndromedaColors.current
    val chosen by settingsRepository.accentName.collectAsState()

    SectionLabel("ACCENT")
    Spacer(Modifier.height(AndromedaSpacing.sm))

    // Chunked Rows, NOT a LazyVerticalGrid inside the scrollable Column —
    // see file header. Swatch + label pairs, four per row.
    val options: List<Pair<String, Color?>> = buildList {
        add("Dynamic" to null)
        AndromedaAccent.entries.forEach { add(it.name to it.color) }
    }
    options.chunked(4).forEach { rowOptions ->
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = AndromedaSpacing.lg),
            horizontalArrangement = Arrangement.spacedBy(AndromedaSpacing.md),
        ) {
            rowOptions.forEach { (name, swatch) ->
                val selected = chosen == name || (name == "Dynamic" && chosen == null)
                AccentOption(
                    name = name,
                    swatch = swatch,
                    selected = selected,
                    modifier = Modifier.weight(1f),
                    onClick = { settingsRepository.setAccent(if (name == "Dynamic") null else name) },
                )
            }
            repeat(4 - rowOptions.size) { Spacer(Modifier.weight(1f)) }
        }
        Spacer(Modifier.height(AndromedaSpacing.md))
    }
}

@Composable
private fun AccentOption(
    name: String,
    swatch: Color?,
    selected: Boolean,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    val colors = LocalAndromedaColors.current

    Column(
        modifier = modifier.clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Box(
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
                .background(swatch ?: colors.surface)
                .border(
                    width = if (selected) 3.dp else 1.dp,
                    color = if (selected) colors.onSurface else colors.onSurfaceMuted.copy(alpha = 0.4f),
                    shape = CircleShape,
                ),
            contentAlignment = Alignment.Center,
        ) {
            // Dynamic's swatch: a half-and-half of the current accent and
            // surface — "whatever the wallpaper says" rendered as a chip.
            if (swatch == null) {
                Box(
                    Modifier
                        .fillMaxSize()
                        .clip(CircleShape)
                        .background(lerp(colors.accent, colors.surface, 0.5f)),
                )
            }
        }
        Spacer(Modifier.height(AndromedaSpacing.xs))
        BasicText(
            text = name,
            style = AndromedaType.Label.copy(color = colors.onSurfaceMuted),
        )
    }
}

@Composable
private fun SearchEngineSection() {
    val colors = LocalAndromedaColors.current
    var current by remember { mutableStateOf<SearchEngines?>(null) }
    // Load once; the local state is the single write point's echo.
    val context = androidx.compose.ui.platform.LocalContext.current
    if (current == null) {
        current = SearchEngines.load(context)
    }

    SectionLabel("SEARCH ENGINE")
    Spacer(Modifier.height(AndromedaSpacing.sm))

    SearchEngines.entries.forEach { engine ->
        val selected = engine == current
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable {
                    SearchEngines.save(context, engine)
                    current = engine
                }
                .padding(horizontal = AndromedaSpacing.lg, vertical = AndromedaSpacing.sm),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BasicText(
                text = engine.label,
                style = AndromedaType.Body.copy(color = colors.onSurface),
            )
            Spacer(Modifier.weight(1f))
            if (selected) {
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .clip(CircleShape)
                        .background(colors.accent),
                )
            }
        }
    }
    Spacer(Modifier.height(AndromedaSpacing.md))
}

@Composable
private fun HapticsSection(settingsRepository: SettingsRepository) {
    val colors = LocalAndromedaColors.current
    val enabled by settingsRepository.hapticsEnabled.collectAsState()

    SectionLabel("FEEDBACK")
    Spacer(Modifier.height(AndromedaSpacing.sm))

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = AndromedaSpacing.lg, vertical = AndromedaSpacing.xs),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Column {
            BasicText(
                text = "Haptic feedback",
                style = AndromedaType.Body.copy(color = colors.onSurface),
            )
            BasicText(
                text = "Stario's 5ms tap feedback",
                style = AndromedaType.Label.copy(color = colors.onSurfaceMuted),
            )
        }
        Spacer(Modifier.weight(1f))
        GlassSwitch(
            checked = enabled,
            onChange = { settingsRepository.setHapticsEnabled(it) },
        )
    }
    Spacer(Modifier.height(AndromedaSpacing.md))
}

@Composable
private fun HiddenAppsSection(
    appRepository: AppRepository,
    hiddenAppsRepository: HiddenAppsRepository,
) {
    val colors = LocalAndromedaColors.current
    val apps by appRepository.apps.collectAsState()
    val hidden by hiddenAppsRepository.hidden.collectAsState()

    SectionLabel("HIDDEN APPS")
    Spacer(Modifier.height(AndromedaSpacing.sm))

    if (apps.isEmpty()) {
        BasicText(
            text = "Indexing apps…",
            style = AndromedaType.Label.copy(color = colors.onSurfaceMuted),
            modifier = Modifier.padding(horizontal = AndromedaSpacing.lg),
        )
    }

    apps.forEach { app ->
        val isHidden = hidden.contains(hiddenAppsRepository.keyOf(app))
        val bitmap = remember(app.icon) { app.icon?.toImageBitmapOrNull() }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { hiddenAppsRepository.setHidden(app, !isHidden) }
                .padding(horizontal = AndromedaSpacing.lg, vertical = AndromedaSpacing.xs),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (bitmap != null) {
                Image(
                    bitmap = bitmap,
                    contentDescription = app.label,
                    modifier = Modifier.size(32.dp),
                )
            } else {
                Box(modifier = Modifier.size(32.dp).background(colors.surface))
            }
            Spacer(Modifier.width(AndromedaSpacing.md))
            BasicText(
                text = app.label,
                style = AndromedaType.Body.copy(
                    color = if (isHidden) colors.onSurfaceMuted else colors.onSurface,
                ),
                modifier = Modifier.weight(1f),
            )
            Box(
                modifier = Modifier
                    .size(22.dp)
                    .clip(RoundedCornerShape(7.dp))
                    .background(if (isHidden) colors.accent else Color.Transparent)
                    .border(1.dp, colors.onSurfaceMuted, RoundedCornerShape(7.dp)),
                contentAlignment = Alignment.Center,
            ) {
                if (isHidden) {
                    BasicText(
                        text = "✓",
                        style = AndromedaType.Label.copy(color = Color(0xFF0A0A0F)),
                    )
                }
            }
        }
    }
    Spacer(Modifier.height(AndromedaSpacing.md))
}

@Composable
private fun DeveloperSection(
    onOpenIconPicker: () -> Unit,
    onOpenBlurPoc: () -> Unit,
) {
    val colors = LocalAndromedaColors.current

    SectionLabel("DEVELOPER")
    Spacer(Modifier.height(AndromedaSpacing.sm))

    SettingsLink(text = "App icon", onClick = onOpenIconPicker)
    SettingsLink(text = "Blur POC (Haze vs Cloudy)", onClick = onOpenBlurPoc)
    Spacer(Modifier.height(AndromedaSpacing.md))
}

@Composable
private fun SettingsLink(text: String, onClick: () -> Unit) {
    val colors = LocalAndromedaColors.current
    BasicText(
        text = "$text →",
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(horizontal = AndromedaSpacing.lg, vertical = AndromedaSpacing.xs),
        style = AndromedaType.Body.copy(color = colors.onSurface),
    )
}

@Composable
private fun AboutSection() {
    val colors = LocalAndromedaColors.current

    SectionLabel("ABOUT")
    Spacer(Modifier.height(AndromedaSpacing.sm))

    Column(modifier = Modifier.padding(horizontal = AndromedaSpacing.lg)) {
        BasicText(
            text = "Andromeda $VERSION_LINE",
            style = AndromedaType.Title.copy(color = colors.onSurface),
        )
        Spacer(Modifier.height(AndromedaSpacing.sm))
        BasicText(
            text = "A home screen built the way software should feel — refined, " +
                "fluid, and considered down to the corner radius. Andromeda " +
                "started as a fork of Stario and became a full rebuild: new " +
                "UI, new physics, new glass.",
            style = AndromedaType.Body.copy(color = colors.onSurfaceMuted),
        )
        Spacer(Modifier.height(AndromedaSpacing.sm))
        BasicText(
            text = "Design & development\nOmkar K. (\"omik // whysoserious\")\nomkardile.is-a.dev · github.com/OmKardile",
            style = AndromedaType.Label.copy(color = colors.onSurface),
        )
        Spacer(Modifier.height(AndromedaSpacing.sm))
        BasicText(
            text = "Original Stario concept & engine\nRăzvan Albu · github.com/albu-razvan/Stario · GPL-3.0",
            style = AndromedaType.Label.copy(color = colors.onSurface),
        )
    }
}

// ------------------------------------------------------------- controls

/**
 * The house switch — glassy track, spring-thrown knob. No Material
 * Switch anywhere in the project, on principle; this one animates with
 * AndromedaMotion.snappy and carries the haptic profile itself.
 */
@Composable
private fun GlassSwitch(checked: Boolean, onChange: (Boolean) -> Unit) {
    val colors = LocalAndromedaColors.current
    val context = androidx.compose.ui.platform.LocalContext.current
    val progress by animateFloatAsState(
        targetValue = if (checked) 1f else 0f,
        animationSpec = AndromedaMotion.snappy,
        label = "glassSwitch",
    )

    val trackColor = lerp(colors.surface, colors.accent, progress)

    Box(
        modifier = Modifier
            .width(52.dp)
            .height(30.dp)
            .clip(CircleShape)
            .background(trackColor)
            .border(1.dp, colors.onSurfaceMuted.copy(alpha = 0.3f), CircleShape)
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
            ) {
                Vibrations.vibrate(context)
                onChange(!checked)
            },
    ) {
        Box(
            modifier = Modifier
                .align(Alignment.CenterStart)
                .padding(3.dp)
                .size(24.dp)
                .graphicsLayer { translationX = progress * 22.dp.toPx() }
                .clip(CircleShape)
                .background(colors.onSurface),
        )
    }
}
