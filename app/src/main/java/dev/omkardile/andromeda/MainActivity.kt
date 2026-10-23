package dev.omkardile.andromeda

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import dev.omkardile.andromeda.core.engine.AppRepository
import dev.omkardile.andromeda.core.engine.CategoryRepository
import dev.omkardile.andromeda.core.engine.HiddenAppsRepository
import dev.omkardile.andromeda.core.engine.SettingsRepository
import dev.omkardile.andromeda.core.engine.WallpaperRepository
import dev.omkardile.andromeda.design.AndromedaAccent
import dev.omkardile.andromeda.design.AndromedaColorScheme
import dev.omkardile.andromeda.design.AndromedaTheme
import androidx.compose.ui.graphics.Color
import dev.omkardile.andromeda.ui.drawer.DrawerScreen
import dev.omkardile.andromeda.ui.drawer.FolderGridScreen
import dev.omkardile.andromeda.ui.home.BlurPocScreen
import dev.omkardile.andromeda.ui.home.HomeScreen
import dev.omkardile.andromeda.ui.search.SearchScreen
import dev.omkardile.andromeda.ui.settings.IconPickerScreen
import dev.omkardile.andromeda.ui.settings.SettingsScreen

private object Routes {
    const val HOME = "home"
    const val DRAWER = "drawer"
    const val FOLDERS = "folders"
    const val SEARCH = "search"
    const val SETTINGS = "settings"
    const val BLUR_POC = "blur_poc"
    const val ICON_PICKER = "icon_picker"
}

class MainActivity : ComponentActivity() {

    private val appRepository by lazy { AppRepository(applicationContext) }
    private val categoryRepository by lazy { CategoryRepository(applicationContext) }
    private val hiddenAppsRepository by lazy { HiddenAppsRepository(applicationContext) }
    private val wallpaperRepository by lazy { WallpaperRepository(applicationContext) }
    private val settingsRepository by lazy { SettingsRepository(applicationContext) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        appRepository.refresh()
        appRepository.registerForChanges()
        wallpaperRepository.start()

        setContent {
            // Accent resolution (0.2.4): the user's explicit choice from
            // Settings wins; Dynamic/never-set follows the wallpaper accent
            // (the 0.2.1+ behavior); monochrome/absent falls back to Blue.
            val userAccentName by settingsRepository.accentName.collectAsState()
            val wallpaperAccent by wallpaperRepository.accent.collectAsState()
            val colorScheme = remember(userAccentName, wallpaperAccent) {
                AndromedaColorScheme(
                    accent = resolveAccent(userAccentName, wallpaperAccent),
                )
            }

            AndromedaTheme(colorScheme = colorScheme) {
                // Hidden apps are filtered out BEFORE the category refresh,
                // and this re-fires whenever either input changes — a
                // hidden-set edit on its own must re-sort the App Library
                // even when the app index hasn't moved.
                val apps by appRepository.apps.collectAsState()
                val hidden by hiddenAppsRepository.hidden.collectAsState()
                LaunchedEffect(apps, hidden) {
                    val visible = apps.filterNot { hidden.contains(hiddenAppsRepository.keyOf(it)) }
                    categoryRepository.refresh(visible)
                }

                val navController = rememberNavController()

                NavHost(navController = navController, startDestination = Routes.HOME) {
                    composable(Routes.HOME) {
                        HomeScreen(
                            appRepository = appRepository,
                            wallpaperRepository = wallpaperRepository,
                            onOpenDrawer = { navController.navigate(Routes.DRAWER) },
                            onOpenSearch = { navController.navigate(Routes.SEARCH) },
                            onOpenSettings = { navController.navigate(Routes.SETTINGS) },
                        )
                    }
                    composable(Routes.DRAWER) {
                        DrawerScreen(
                            appRepository = appRepository,
                            hiddenAppsRepository = hiddenAppsRepository,
                            onOpenFolders = { navController.navigate(Routes.FOLDERS) },
                            onBack = { navController.popBackStack() },
                        )
                    }
                    composable(Routes.FOLDERS) {
                        FolderGridScreen(
                            appRepository = appRepository,
                            categoryRepository = categoryRepository,
                            onBack = { navController.popBackStack() },
                        )
                    }
                    composable(Routes.SEARCH) {
                        SearchScreen(
                            appRepository = appRepository,
                            hiddenAppsRepository = hiddenAppsRepository,
                            onBack = { navController.popBackStack() },
                        )
                    }
                    composable(Routes.SETTINGS) {
                        SettingsScreen(
                            appRepository = appRepository,
                            hiddenAppsRepository = hiddenAppsRepository,
                            settingsRepository = settingsRepository,
                            onOpenIconPicker = { navController.navigate(Routes.ICON_PICKER) },
                            onOpenBlurPoc = { navController.navigate(Routes.BLUR_POC) },
                            onBack = { navController.popBackStack() },
                        )
                    }
                    composable(Routes.BLUR_POC) {
                        BlurPocScreen()
                    }
                    composable(Routes.ICON_PICKER) {
                        IconPickerScreen(onBack = { navController.popBackStack() })
                    }
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        // Cheap re-read for wallpaper changes that never reached the
        // broadcast receiver (see WallpaperRepository.start's note).
        wallpaperRepository.refresh()
    }

    /** Accent precedence: explicit user choice > wallpaper-derived > Blue.
     *  Stored names are enum names; an unknown name (renamed/removed enum
     *  entry) degrades to the wallpaper path rather than crashing. */
    private fun resolveAccent(userAccentName: String?, wallpaperAccent: Int?): Color {
        userAccentName?.let { name ->
            runCatching { AndromedaAccent.valueOf(name) }
                .getOrNull()
                ?.let { return it.color }
        }
        return wallpaperAccent?.let { Color(it) } ?: AndromedaAccent.Blue.color
    }
}
