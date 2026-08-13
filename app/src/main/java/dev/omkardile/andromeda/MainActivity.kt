package dev.omkardile.andromeda

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import dev.omkardile.andromeda.core.engine.AppRepository
import dev.omkardile.andromeda.design.AndromedaTheme
import dev.omkardile.andromeda.ui.home.BlurPocScreen
import dev.omkardile.andromeda.ui.home.HomeScreen

class MainActivity : ComponentActivity() {

    private val appRepository by lazy { AppRepository(applicationContext) }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        appRepository.refresh()
        appRepository.registerForChanges()

        setContent {
            AndromedaTheme {
                var showBlurPoc by remember { mutableStateOf(false) }

                Box(modifier = Modifier.fillMaxSize()) {
                    if (showBlurPoc) {
                        BlurPocScreen()
                    } else {
                        HomeScreen(appRepository = appRepository)
                    }

                    // Temporary nav — delete once real navigation exists.
                    // One tap toggles the Phase 2 blur comparison from §3.
                    BasicText(
                        text = if (showBlurPoc) "← Home" else "Blur POC →",
                        modifier = Modifier
                            .align(Alignment.TopEnd)
                            .padding(top = 48.dp, end = 16.dp)
                            .clickable { showBlurPoc = !showBlurPoc },
                        style = androidx.compose.ui.text.TextStyle(color = Color.White),
                    )
                }
            }
        }
    }
}
