/*
 * Phase 3 (plan §1, High priority): the App Library — iOS-style folder
 * grid over Stario's real category system (ported as CategoryRepository;
 * see that file for the porting notes). UI is all new Compose, no
 * Material, per house rules.
 *
 * Structure: a 2-column grid of liquid-glass folder cards (Cloudy, per
 * plan §2's blur layering — Cloudy is the "accent" blur). Tapping a
 * folder opens a full detail overlay: a Haze-blurred scrim (with a
 * HazeTint, the 1.x-API shape — see CHANGELOG 0.1.6 for why `tints` is
 * a list) over the grid behind it, a spring entrance via
 * MutableTransitionState + AndromedaMotion tokens, and long-press-to-
 * move reordering inside the folder (permutation persists through
 * CategoryRepository; Stario's updatePermutation semantics).
 *
 * The hazeSource is the grid itself and the overlay's hazeEffect is its
 * sibling — the parent-child shape was 0.1.5's blur bug, not repeated
 * here.
 */

package dev.omkardile.andromeda.ui.drawer

import androidx.compose.animation.core.MutableTransitionState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.updateTransition
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.unit.dp
import com.skydoves.cloudy.cloudy
import dev.chrisbanes.haze.HazeState
import dev.chrisbanes.haze.HazeTint
import dev.chrisbanes.haze.hazeEffect
import dev.chrisbanes.haze.hazeSource
import dev.omkardile.andromeda.core.engine.AppCategory
import dev.omkardile.andromeda.core.engine.AppRepository
import dev.omkardile.andromeda.core.engine.CategoryRepository
import dev.omkardile.andromeda.core.engine.LauncherApplication
import dev.omkardile.andromeda.design.AndromedaMotion
import dev.omkardile.andromeda.design.AndromedaSpacing
import dev.omkardile.andromeda.design.AndromedaType
import dev.omkardile.andromeda.design.LocalAndromedaColors
import dev.omkardile.andromeda.design.toImageBitmapOrNull

@Composable
fun FolderGridScreen(
    appRepository: AppRepository,
    categoryRepository: CategoryRepository,
    onBack: () -> Unit,
) {
    val colors = LocalAndromedaColors.current
    val categories by categoryRepository.categories.collectAsState()
    val hazeState = remember { HazeState() }
    var selected by remember { mutableStateOf<AppCategory?>(null) }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background),
    ) {
        Column(modifier = Modifier.fillMaxSize()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(AndromedaSpacing.lg),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                BasicText(text = "App Library", style = AndromedaType.Title.copy(color = colors.onSurface))
                BasicText(
                    text = "← Drawer",
                    modifier = Modifier.clickable(onClick = onBack),
                    style = AndromedaType.Label.copy(color = colors.onSurface),
                )
            }

            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                contentPadding = PaddingValues(AndromedaSpacing.lg),
                horizontalArrangement = Arrangement.spacedBy(AndromedaSpacing.md),
                verticalArrangement = Arrangement.spacedBy(AndromedaSpacing.md),
                modifier = Modifier
                    .fillMaxSize()
                    .hazeSource(state = hazeState),
            ) {
                items(
                    items = categories,
                    key = { it.identifier.toString() },
                ) { category ->
                    CategoryCard(category = category, onClick = { selected = category })
                }
            }
        }

        selected?.let { category ->
            FolderDetailOverlay(
                category = category,
                hazeState = hazeState,
                onLaunch = { app -> appRepository.launch(app) },
                onMove = { from, to -> categoryRepository.moveApp(category.identifier, from, to) },
                onDismiss = { selected = null },
            )
        }
    }
}

@Composable
private fun CategoryCard(category: AppCategory, onClick: () -> Unit) {
    val colors = LocalAndromedaColors.current

    Column(
        modifier = Modifier
            .aspectRatio(1f)
            .clip(RoundedCornerShape(24.dp))
            .cloudy(radius = 14)
            .background(colors.surface.copy(alpha = 0.55f), RoundedCornerShape(24.dp))
            .clickable(onClick = onClick)
            .padding(AndromedaSpacing.md),
    ) {
        BasicText(
            text = category.name,
            style = AndromedaType.Title.copy(color = colors.onSurface),
        )
        Spacer(Modifier.height(AndromedaSpacing.xs))
        BasicText(
            text = "${category.apps.size} ${if (category.apps.size == 1) "app" else "apps"}",
            style = AndromedaType.Label.copy(color = colors.onSurfaceMuted),
        )

        Spacer(Modifier.weight(1f))

        // Up to four icons as a 2×2 preview, plain Rows — cards are too
        // small to justify (or fit) another lazy container.
        category.apps.take(4).chunked(2).forEach { rowApps ->
            Row(horizontalArrangement = Arrangement.spacedBy(AndromedaSpacing.sm)) {
                rowApps.forEach { app ->
                    AppIcon(app = app, size = 32.dp)
                }
                repeat(2 - rowApps.size) { Spacer(Modifier.size(32.dp)) }
            }
            Spacer(Modifier.height(AndromedaSpacing.xs))
        }
    }
}

@Composable
private fun FolderDetailOverlay(
    category: AppCategory,
    hazeState: HazeState,
    onLaunch: (LauncherApplication) -> Unit,
    onMove: (Int, Int) -> Unit,
    onDismiss: () -> Unit,
) {
    val colors = LocalAndromedaColors.current
    var movingIndex by remember(category.identifier) { mutableStateOf<Int?>(null) }

    // MutableTransitionState starts at false and immediately targets true,
    // so the entrance animation actually runs on first composition — a
    // plain animate*AsState here would render at its final value instantly.
    val entrance = remember(category.identifier) {
        MutableTransitionState(false).apply { targetState = true }
    }
    val transition = updateTransition(entrance)
    val alpha by transition.animateFloat(transitionSpec = { AndromedaMotion.entrance }) {
        if (it) 1f else 0f
    }
    val scale by transition.animateFloat(transitionSpec = { AndromedaMotion.entrance }) {
        if (it) 1f else 0.92f
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .hazeEffect(state = hazeState) {
                blurRadius = 28.dp
                tints = listOf(HazeTint(colors.background.copy(alpha = 0.6f)))
            }
            .clickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = onDismiss,
            ),
    ) {
        Column(
            modifier = Modifier
                .align(Alignment.Center)
                .fillMaxWidth()
                .padding(AndromedaSpacing.lg)
                .graphicsLayer {
                    this.alpha = alpha
                    scaleX = scale
                    scaleY = scale
                }
                .clip(RoundedCornerShape(32.dp))
                .background(colors.surface.copy(alpha = 0.92f))
                .clickable(
                    interactionSource = remember { MutableInteractionSource() },
                    indication = null,
                    onClick = {}, // consume taps so they don't dismiss the overlay
                )
                .padding(AndromedaSpacing.lg),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                BasicText(
                    text = category.name,
                    style = AndromedaType.Title.copy(color = colors.onSurface),
                )
                BasicText(
                    text = if (movingIndex == null) "long-press to move" else "tap a slot → move",
                    style = AndromedaType.Label.copy(color = colors.onSurfaceMuted),
                )
            }
            Spacer(Modifier.height(AndromedaSpacing.md))

            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState()),
            ) {
                category.apps.forEachIndexed { index, app ->
                    AppRow(
                        app = app,
                        highlighted = movingIndex == index,
                        onClick = {
                            val moving = movingIndex
                            when {
                                moving == null -> onLaunch(app)
                                moving == index -> movingIndex = null // tap again: cancel
                                else -> {
                                    onMove(moving, index)
                                    movingIndex = null
                                }
                            }
                        },
                        onLongClick = { movingIndex = index },
                    )
                    Spacer(Modifier.height(AndromedaSpacing.xs))
                }
            }
        }
    }
}

@Composable
private fun AppRow(
    app: LauncherApplication,
    highlighted: Boolean,
    onClick: () -> Unit,
    onLongClick: () -> Unit,
) {
    val colors = LocalAndromedaColors.current

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .combinedClickable(
                interactionSource = remember { MutableInteractionSource() },
                indication = null,
                onClick = onClick,
                onLongClick = onLongClick,
            )
            .background(if (highlighted) colors.accent.copy(alpha = 0.2f) else Color.Transparent)
            .padding(AndromedaSpacing.sm),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        AppIcon(app = app, size = 40.dp)
        Spacer(Modifier.size(AndromedaSpacing.md))
        BasicText(
            text = app.label,
            style = AndromedaType.Body.copy(color = colors.onSurface),
        )
    }
}

@Composable
private fun AppIcon(app: LauncherApplication, size: androidx.compose.ui.unit.Dp) {
    val colors = LocalAndromedaColors.current
    val bitmap = remember(app.icon) { app.icon?.toImageBitmapOrNull() }

    if (bitmap != null) {
        Image(
            bitmap = bitmap,
            contentDescription = app.label,
            modifier = Modifier.size(size),
        )
    } else {
        Box(modifier = Modifier.size(size).background(colors.surface))
    }
}
