plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "dev.omkardile.andromeda.ui.home"
    compileSdk = 36

    defaultConfig {
        minSdk = 29
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }

    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(project(":core:engine"))
    implementation(project(":common:design"))

    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.foundation)

    // Layered blur per plan §2: Haze everywhere, Cloudy for liquid-glass accents.
    implementation(libs.haze)
    implementation(libs.haze.materials)
    implementation(libs.cloudy)

    // composeunstyled's button/text-field modules aren't pulled in here yet —
    // 0.1.1 guessed at coordinates for them that didn't resolve (see
    // CHANGELOG 0.1.2), and nothing in this module actually calls them yet
    // anyway. common:design already pulls in the one confirmed
    // com.composables:compose-unstyled artifact; add real component modules
    // here once real controls replace HomeScreen/BlurPocScreen's
    // Box/BasicText placeholders and their exact current coordinates are confirmed.

    implementation(libs.coil.compose)
}
