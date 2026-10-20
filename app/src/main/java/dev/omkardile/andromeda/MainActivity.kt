package dev.omkardile.andromeda

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import dev.omkardile.andromeda.core.engine.AppRepository
import dev.omkardile.andromeda.design.AndromedaTheme
import dev.omkardile.andromeda.ui.drawer.DrawerScreen
import dev.omkardile.andromeda.ui.home.BlurPocScreen
import dev.omkardile.andromeda.ui.home.HomeScreen
import dev.omkardile.andromeda.ui.home.IconPickerScreen

private object Routes {
    const val HOME = "home"
    const val DRAWER = "drawer"
    const val BLUR_POC = "blur_poc"
    const val ICON_PICKER = "icon_picker"
}

class MainActivity : ComponentActivity() {

    private val appRepository by lazy { AppRepository(applicationContext) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        appRepository.refresh()
        appRepository.registerForChanges()

        setContent {
            AndromedaTheme {
                val navController = rememberNavController()

                NavHost(navController = navController, startDestination = Routes.HOME) {
                    composable(Routes.HOME) {
                        HomeScreen(
                            appRepository = appRepository,
                            onOpenDrawer = { navController.navigate(Routes.DRAWER) },
                            onOpenBlurPoc = { navController.navigate(Routes.BLUR_POC) },
                            onOpenIconPicker = { navController.navigate(Routes.ICON_PICKER) },
                        )
                    }
                    composable(Routes.DRAWER) {
                        DrawerScreen(
                            appRepository = appRepository,
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
}
