plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "dev.omkardile.andromeda"
    compileSdk = 36

    defaultConfig {
        applicationId = "dev.omkardile.andromeda"
        // Stario's own archived codebase requires SDK 29+ (Android 10) — matching that
        // floor here rather than the "API 27 or lower" the very first draft of this plan
        // guessed at. See plan doc §7 for the low-end fallback notes this implies.
        minSdk = 29
        targetSdk = 36
        versionCode = 9
        versionName = "0.1.8"
    }

    buildTypes {
        release {
            isMinifyEnabled = false // flip on + add proguard rules once there's enough surface area to matter
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
        }
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
    implementation(project(":ui:home"))

    implementation(libs.core.ktx)
    implementation(libs.lifecycle.runtime.ktx)
    implementation(libs.activity.compose)

    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.foundation)
    debugImplementation(libs.compose.ui.tooling)
    implementation(libs.compose.ui.tooling.preview)
}
