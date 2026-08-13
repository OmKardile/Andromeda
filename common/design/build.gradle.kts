plugins {
    alias(libs.plugins.android.library)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "dev.omkardile.andromeda.design"
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
    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.foundation)

    // Not yet called from any Kotlin here — AndromedaTheme (Theme.kt) is a
    // plain CompositionLocal for now. Wired up ahead of use so Gradle
    // confirms it resolves; check composeunstyled.com/docs for whether its
    // theming approach changes how Theme.kt should actually be built.
    implementation(libs.composeunstyled)
}
