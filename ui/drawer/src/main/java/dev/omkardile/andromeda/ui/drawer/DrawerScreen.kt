/*
 * Phase 3/4: the actual app drawer (plan §1, High priority — was just a
 * "5 apps found" count on the home screen until now). Real icons this
 * time — AppRepository only ever counted apps before; loading icons
 * (LauncherActivityInfo.getIcon, handles adaptive icons + work-profile
 * badging correctly) was added alongside this screen since nothing needed
 * them until now.
 *
 * Niagara-style A–Z quick-scroll rail on the trailing edge — tap a letter,
 * jump straight to that section. Drag-to-scroll (thumb never leaves the
 * rail) is the more Niagara-authentic gesture but is a bigger lift; tap
 * gets the core behavior in now, drag is a reasonable follow-up rather
 * than a blocker.
 *
 * 0.2.0: hidden apps are actually hidden here too (HiddenAppsRepository
 * — same set the App Library filters against), and the header gained a
 * link into the App Library (FolderGridScreen, same module). The
 * Drawable→ImageBitmap helper moved out of this file into common:design
 * (Drawables.kt) — the folder grid needs it too.
 *
 * Also 0.2.0, found by this version's first real compile: LazyColumn's
 * `stickyHeader` no longer exists in the foundation version BOM 2026.06.00
 * resolves (deprecated 1.7, since removed — LazyListScope has only
 * item/items/itemsIndexed now). The letter headers are therefore plain
 * list items that scroll with content, not pinned. A pinned-header pass
 * (scroll-aware external header) is the follow-up if the stickiness is
 * missed in practice; see CHANGELOG 0.2.0.
 *
 * No MaterialTheme/Text/LazyColumn-with-Material-defaults here — BasicText
 * + this module's own tokens, consistent with the rest of the project.
 */

package dev.omkardile.andromeda.ui.drawer

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import dev.omkardile.andromeda.core.engine.AppRepository
import dev.omkardile.andromeda.core.engine.HiddenAppsRepository
import dev.omkardile.andromeda.core.engine.LauncherApplication
import dev.omkardile.andromeda.design.AndromedaSpacing
import dev.omkardile.andromeda.design.AndromedaType
import dev.omkardile.andromeda.design.LocalAndromedaColors
import dev.omkardile.andromeda.design.toImageBitmapOrNull
import kotlinx.coroutines.launch

private data class LetterSection(
    val letter: Char,
    val apps: List<LauncherApplication>,
    val startIndex: Int,
)

private fun buildSections(apps: List<LauncherApplication>): List<LetterSection> {
    val groups = apps.groupBy { app ->
        val first = app.label.firstOrNull()?.uppercaseChar()
        if (first != null && first in 'A'..'Z') first else '#'
    }.toSortedMap()

    var index = 0
    return groups.map { (letter, appsInGroup) ->
        val section = LetterSection(letter, appsInGroup, index)
        index += 1 + appsInGroup.size // +1 accounts for the sticky header item itself
        section
    }
}

@Composable
fun DrawerScreen(
    appRepository: AppRepository,
    hiddenAppsRepository: HiddenAppsRepository,
    onOpenFolders: () -> Unit,
    onBack: () -> Unit,
) {
    val apps by appRepository.apps.collectAsState()
    val hidden by hiddenAppsRepository.hidden.collectAsState()
    val visible = remember(apps, hidden) {
        apps.filterNot { hidden.contains(hiddenAppsRepository.keyOf(it)) }
    }
    val colors = LocalAndromedaColors.current
    val listState = rememberLazyListState()
    val scope = rememberCoroutineScope()

    val sections = remember(visible) { buildSections(visible) }

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
                BasicText(
                    text = "All apps",
                    style = AndromedaType.Title.copy(color = colors.onSurface),
                )
                Row(horizontalArrangement = Arrangement.spacedBy(AndromedaSpacing.md)) {
                    BasicText(
                        text = "Folders →",
                        modifier = Modifier.clickable(onClick = onOpenFolders),
                        style = AndromedaType.Label.copy(color = colors.onSurface),
                    )
                    BasicText(
                        text = "← Home",
                        modifier = Modifier.clickable(onClick = onBack),
                        style = AndromedaType.Label.copy(color = colors.onSurface),
                    )
                }
            }

            Row(modifier = Modifier.fillMaxSize()) {
                LazyColumn(
                    state = listState,
                    modifier = Modifier.weight(1f).fillMaxHeight(),
                    contentPadding = PaddingValues(horizontal = AndromedaSpacing.lg, vertical = AndromedaSpacing.sm),
                ) {
                    sections.forEach { section ->
                        item(key = "header_${section.letter}") {
                            LetterHeader(section.letter)
                        }
                        items(
                            items = section.apps,
                            key = { "${it.info.packageName}_${it.handle}" },
                        ) { app ->
                            AppRow(app = app, onClick = { appRepository.launch(app) })
                        }
                    }
                }

                QuickScrollRail(
                    sections = sections,
                    onLetterSelected = { section ->
                        scope.launch { listState.scrollToItem(section.startIndex) }
                    },
                )
            }
        }
    }
}

@Composable
private fun LetterHeader(letter: Char) {
    val colors = LocalAndromedaColors.current
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .background(colors.background)
            .padding(vertical = AndromedaSpacing.xs),
    ) {
        BasicText(
            text = letter.toString(),
            style = AndromedaType.Label.copy(color = colors.onSurfaceMuted),
        )
    }
}

@Composable
private fun AppRow(app: LauncherApplication, onClick: () -> Unit) {
    val colors = LocalAndromedaColors.current
    val bitmap = remember(app.icon) { app.icon?.toImageBitmapOrNull() }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(vertical = AndromedaSpacing.sm),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        if (bitmap != null) {
            Image(
                bitmap = bitmap,
                contentDescription = app.label,
                modifier = Modifier.size(40.dp),
            )
        } else {
            Box(modifier = Modifier.size(40.dp).background(colors.surface))
        }
        Spacer(Modifier.width(AndromedaSpacing.md))
        BasicText(text = app.label, style = AndromedaType.Body.copy(color = colors.onSurface))
    }
}

@Composable
private fun QuickScrollRail(
    sections: List<LetterSection>,
    onLetterSelected: (LetterSection) -> Unit,
) {
    val colors = LocalAndromedaColors.current
    Column(
        modifier = Modifier
            .fillMaxHeight()
            .width(28.dp)
            .padding(vertical = AndromedaSpacing.md),
        verticalArrangement = Arrangement.SpaceEvenly,
    ) {
        sections.forEach { section ->
            BasicText(
                text = section.letter.toString(),
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onLetterSelected(section) },
                style = AndromedaType.Label.copy(color = colors.onSurfaceMuted),
            )
        }
    }
}
