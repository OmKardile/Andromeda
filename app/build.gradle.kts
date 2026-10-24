import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

// Release signing (opt-in): drop a `keystore.properties` file at the repo root
// (see keystore.properties.example / README "Release signing") and release
// builds come out signed and installable. File absent -> release stays
// unsigned, exactly as before. The properties file and the keystore itself
// are both gitignored — never commit secrets.
val keystorePropsFile = rootProject.file("keystore.properties")
val keystoreProps = Properties().apply {
    if (keystorePropsFile.exists()) {
        keystorePropsFile.inputStream().use { load(it) }
    }
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
        versionCode = 19
        versionName = "0.2.6"
    }

    signingConfigs {
        if (keystorePropsFile.exists()) {
            create("release") {
                storeFile = rootProject.file(keystoreProps["storeFile"] as String)
                storePassword = keystoreProps["storePassword"] as String
                keyAlias = keystoreProps["keyAlias"] as String
                keyPassword = keystoreProps["keyPassword"] as String
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false // flip on + add proguard rules once there's enough surface area to matter
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            if (keystorePropsFile.exists()) {
                signingConfig = signingConfigs.getByName("release")
            }
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
    implementation(project(":ui:drawer"))
    implementation(project(":ui:search"))
    implementation(project(":ui:settings"))

    implementation(libs.core.ktx)
    implementation(libs.lifecycle.runtime.ktx)
    implementation(libs.activity.compose)
    implementation(libs.navigation.compose)

    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.foundation)
    debugImplementation(libs.compose.ui.tooling)
    implementation(libs.compose.ui.tooling.preview)
}
