/*
 * Picks between the alternate app icons declared as activity-aliases in
 * the manifest (see core:engine's IconSwitcher.kt for why it has to work
 * that way on Android). Lived in ui:home from 0.1.11 until 0.2.4, when
 * the real Settings area grew up around it — this was always the plan
 * (see the original file header note), and it's why the screen moved
 * modules rather than settings linking sideways into ui:home.
 *
 * The icon PNGs live in common:design's res/, not app's or this module's —
 * a picker screen here can't reference resources that only exist in the
 * app module (resources don't flow backward across module dependencies),
 * and common:design is a dependency both app and this module share.
 */

package dev.omkardile.andromeda.ui.settings

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.unit.dp
import dev.omkardile.andromeda.core.engine.AppIcon
import dev.omkardile.andromeda.core.engine.IconSwitcher
import dev.omkardile.andromeda.design.AndromedaSpacing
import dev.omkardile.andromeda.design.AndromedaType
import dev.omkardile.andromeda.design.LocalAndromedaColors
import dev.omkardile.andromeda.design.R as DesignR

@Composable
fun IconPickerScreen(onBack: () -> Unit) {
    val context = LocalContext.current
    val colors = LocalAndromedaColors.current
    var current by remember { mutableStateOf(IconSwitcher.current(context)) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(colors.background),
    ) {
        Row(
            modifier = Modifier.fillMaxWidth().padding(AndromedaSpacing.lg),
            horizontalArrangement = Arrangement.SpaceBetween,
        ) {
            BasicText(text = "App icon", style = AndromedaType.Title.copy(color = colors.onSurface))
            BasicText(
                text = "← Home",
                modifier = Modifier.clickable(onClick = onBack),
                style = AndromedaType.Label.copy(color = colors.onSurface),
            )
        }

        LazyVerticalGrid(
            columns = GridCells.Fixed(3),
            contentPadding = PaddingValues(AndromedaSpacing.lg),
            horizontalArrangement = Arrangement.spacedBy(AndromedaSpacing.md),
            verticalArrangement = Arrangement.spacedBy(AndromedaSpacing.md),
            modifier = Modifier.fillMaxSize(),
        ) {
            items(
                items = AppIcon.entries.toList(),
                key = { it.name },
            ) { icon ->
                IconOption(
                    icon = icon,
                    selected = icon == current,
                    onClick = {
                        IconSwitcher.switchTo(context, icon)
                        current = icon
                    },
                )
            }
        }
    }
}

@Composable
private fun IconOption(icon: AppIcon, selected: Boolean, onClick: () -> Unit) {
    val colors = LocalAndromedaColors.current

    Column(
        modifier = Modifier.clickable(onClick = onClick),
        horizontalAlignment = Alignment.CenterHorizontally,
    ) {
        Image(
            painter = painterResource(id = iconResource(icon)),
            contentDescription = icon.label,
            modifier = Modifier
                .aspectRatio(1f)
                .fillMaxWidth()
                .clip(RoundedCornerShape(20.dp))
                .border(
                    width = if (selected) 3.dp else 0.dp,
                    color = if (selected) colors.accent else colors.background,
                    shape = RoundedCornerShape(20.dp),
                ),
        )
        Spacer(Modifier.height(AndromedaSpacing.xs))
        BasicText(text = icon.label, style = AndromedaType.Label.copy(color = colors.onSurfaceMuted))
    }
}

private fun iconResource(icon: AppIcon): Int = when (icon) {
    AppIcon.ECLIPSE -> DesignR.mipmap.ic_launcher_eclipse
    AppIcon.EMBER -> DesignR.mipmap.ic_launcher_ember
    AppIcon.ORBIT -> DesignR.mipmap.ic_launcher_orbit
    AppIcon.IVORY -> DesignR.mipmap.ic_launcher_ivory
    AppIcon.PRISM -> DesignR.mipmap.ic_launcher_prism
    AppIcon.HORIZON -> DesignR.mipmap.ic_launcher_horizon
    AppIcon.COMET -> DesignR.mipmap.ic_launcher_comet
    AppIcon.DUSK -> DesignR.mipmap.ic_launcher_dusk
}
