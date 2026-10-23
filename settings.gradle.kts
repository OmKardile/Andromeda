pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}

dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
        // Cloudy (com.github.skydoves:cloudy) is published via JitPack, not Maven Central.
        maven { url = uri("https://jitpack.io") }
    }
}

rootProject.name = "Andromeda"

include(":app")
include(":core:engine")
include(":common:design")
include(":ui:home")
include(":ui:drawer")
include(":ui:search")
