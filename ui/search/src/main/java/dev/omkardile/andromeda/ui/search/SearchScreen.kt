/*
 * The floating search (plan §1, High priority) — 0.2.2. Rank-first
 * local search over the visible app list (prefix matches first, then
 * Jaro-Winkler similarity, the exact algorithm Stario used — ported to
 * core:engine's search package), with a browser-handoff row for the
 * current engine (default Kagi, per plan §1/§8 — the query templates
 * are Stario's own).
 *
 * No Material TextField — foundation's BasicTextField + own tokens.
 * Auto-focus on entry (FocusRequester), and imePadding so the results
 * clear the keyboard.
 *
 * Known edge: imePadding relies on WindowInsets.IME, which behaves on
 * API 30+; on API 29 with the manifest's adjustNothing the keyboard can
 * cover the last row. Documented in help.md rather than papered over —
 * 29 is the floor, not the target, and the launcher's edge-to-edge
 * posture is worth more than that row.
 */

package dev.omkardile.andromeda.ui.search

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
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
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import dev.omkardile.andromeda.core.engine.AppRepository
import dev.omkardile.andromeda.core.engine.HiddenAppsRepository
import dev.omkardile.andromeda.core.engine.LauncherApplication
import dev.omkardile.andromeda.core.engine.Vibrations
import dev.omkardile.andromeda.core.engine.search.JaroWinkler
import dev.omkardile.andromeda.core.engine.search.SearchEngines
import dev.omkardile.andromeda.design.AndromedaSpacing
import dev.omkardile.andromeda.design.AndromedaType
import dev.omkardile.andromeda.design.LocalAndromedaColors
import dev.omkardile.andromeda.design.toImageBitmapOrNull

private const val SIMILARITY_THRESHOLD = 0.4

@Composable
fun SearchScreen(
    appRepository: AppRepository,
    hiddenAppsRepository: HiddenAppsRepository,
    onBack: () -> Unit,
) {
    val context = LocalContext.current
    val colors = LocalAndromedaColors.current

    val apps by appRepository.apps.collectAsState()
    val hidden by hiddenAppsRepository.hidden.collectAsState()
    val visible = remember(apps, hidden) {
        apps.filterNot { hidden.contains(hiddenAppsRepository.keyOf(it)) }
    }

    var query by remember { mutableStateOf("") }
    val engine = remember { SearchEngines.load(context) }

    val focusRequester = remember { FocusRequester() }
    LaunchedEffect(Unit) { focusRequester.requestFocus() }

    val trimmed = query.trim()
    val results = remember(visible, trimmed) {
        if (trimmed.isEmpty()) emptyList() else rankApps(visible, trimmed)
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background)
            .imePadding(),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(AndromedaSpacing.lg),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            BasicText(text = "Search", style = AndromedaType.Title.copy(color = colors.onSurface))
            BasicText(
                text = "← Home",
                modifier = Modifier.clickable(onClick = onBack),
                style = AndromedaType.Label.copy(color = colors.onSurface),
            )
        }

        BasicTextField(
            value = query,
            onValueChange = { query = it },
            singleLine = true,
            textStyle = AndromedaType.Body.copy(color = colors.onSurface),
            cursorBrush = SolidColor(colors.accent),
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = AndromedaSpacing.lg)
                .focusRequester(focusRequester)
                .clip(RoundedCornerShape(24.dp))
                .background(colors.surface)
                .padding(AndromedaSpacing.md),
            decorationBox = { innerTextField ->
                Box {
                    if (query.isEmpty()) {
                        BasicText(
                            text = "Search apps or the web",
                            style = AndromedaType.Body.copy(color = colors.onSurfaceMuted),
                        )
                    }
                    innerTextField()
                }
            },
        )

        Spacer(Modifier.height(AndromedaSpacing.md))

        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = AndromedaSpacing.lg),
        ) {
            results.forEach { (app, _) ->
                AppResultRow(
                    app = app,
                    onClick = {
                        Vibrations.vibrate(context)
                        appRepository.launch(app)
                    },
                )
                Spacer(Modifier.height(AndromedaSpacing.xs))
            }

            if (trimmed.isNotEmpty()) {
                WebFallbackRow(
                    engine = engine,
                    query = trimmed,
                    onClick = {
                        Vibrations.vibrate(context)
                        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(engine.queryUrl(trimmed)))
                        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                        runCatching { context.startActivity(intent) }
                    },
                )
            }
        }
    }
}

/** Prefix matches first (alphabetical), then Jaro-Winkler similarity
 *  descending — Stario's ranking shape. */
private fun rankApps(apps: List<LauncherApplication>, query: String): List<Pair<LauncherApplication, Double>> {
    val needle = query.lowercase()

    val prefixes = apps
        .filter { it.label.lowercase().startsWith(needle) }
        .sortedBy { it.label }
        .map { it to 1.0 }

    val prefixSet = prefixes.map { it.first }.toSet()

    val similar = apps
        .asSequence()
        .filterNot { it in prefixSet }
        .map { app ->
            app to JaroWinkler.getScore(app.label.lowercase(), needle)
        }
        .filter { it.second >= SIMILARITY_THRESHOLD }
        .sortedByDescending { it.second }
        .toList()

    return prefixes + similar
}

@Composable
private fun AppResultRow(app: LauncherApplication, onClick: () -> Unit) {
    val colors = LocalAndromedaColors.current
    val bitmap = remember(app.icon) { app.icon?.toImageBitmapOrNull() }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .clickable(onClick = onClick)
            .background(colors.surface.copy(alpha = 0.6f))
            .padding(AndromedaSpacing.sm),
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
        Spacer(Modifier.size(AndromedaSpacing.md))
        BasicText(
            text = app.label,
            style = AndromedaType.Body.copy(color = colors.onSurface),
        )
    }
}

@Composable
private fun WebFallbackRow(engine: SearchEngines, query: String, onClick: () -> Unit) {
    val colors = LocalAndromedaColors.current

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(14.dp))
            .clickable(onClick = onClick)
            .background(colors.accent.copy(alpha = 0.14f))
            .padding(AndromedaSpacing.sm),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        BasicText(
            text = "Search ${engine.label} for \"$query\"",
            style = AndromedaType.Body.copy(color = colors.onSurface),
        )
    }
}
