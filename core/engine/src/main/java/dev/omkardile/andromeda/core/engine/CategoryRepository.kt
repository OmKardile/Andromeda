/*
 * Decoupled port of Stario's category trio — apps/Category.java,
 * apps/CategoryManager.java, apps/CategoryMappings.java (GPL-3.0,
 * (C) 2025 Răzvan Albu; originals in reference/stario-source).
 *
 * What survived the port, deliberately byte-compatible where it matters:
 * - Category identifiers are Stario's exact UUID scheme —
 *   Utils.intToUUID(int), i.e. UUID.nameUUIDFromBytes over the 4-byte
 *   big-endian int (MD5, version 3). A Stario install's persisted
 *   remap/category keys stay readable by this code.
 * - The SharedPreferences layout mirrors Stario's Entry.* structure:
 *   <app>.CATEGORIES (packageKey -> uuid remaps),
 *   <app>.CATEGORY_NAMES (uuid -> custom display name),
 *   <app>.CATEGORY_MAP.CATEGORIES (uuid -> category order index),
 *   <app>.CATEGORY_MAP.<uuid> (appKey -> index within category).
 *
 * What changed and why:
 * - No singleton/`Stario` Application coupling: plain constructor, and
 *   StateFlow instead of the listener zoo (CategoryItemListener /
 *   CategoryListener / LauncherApplicationListener all collapse into
 *   "collect the flow").
 * - Stario creates unnamed categories for category ints it has no string
 *   for; here unknown ints fold into the Unsorted bucket (-1) so no
 *   category ever renders nameless.
 * - Default category names are Kotlin constants rather than string
 *   resources (engine layer stays resource-free/testable); custom names
 *   still win over them, exactly like Stario's.
 */

package dev.omkardile.andromeda.core.engine

import android.content.Context
import android.content.SharedPreferences
import android.os.Process
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.nio.ByteBuffer
import java.util.UUID

/** One category as the UI sees it: identity + display name + sorted apps. */
data class AppCategory(
    val identifier: UUID,
    val name: String,
    val apps: List<LauncherApplication>,
)

/** Stario's int ↔ UUID mapping + the default category names it shipped. */
object CategoryIds {

    const val MANAGED = -2 // work-profile apps, matching Stario
    const val UNSORTED = -1 // no/unknown platform category

    /** Stario's DEFAULT_CATEGORIES string resources, as constants. */
    val DEFAULT_NAMES: Map<Int, String> = linkedMapOf(
        0 to "Games",
        1 to "Audio",
        2 to "Video",
        3 to "Images",
        4 to "Social",
        5 to "News",
        6 to "Maps",
        7 to "Productivity",
        8 to "Accessibility",
        9 to "Finance",
        10 to "Health",
        11 to "Personalization",
        12 to "Sports",
    )

    /** Stario's Utils.intToUUID — name-based (v3) UUID over the 4-byte int.
     *  (Stario wrote this in Java as `Integer.SIZE / Byte.SIZE`; Kotlin's
     *  equivalent for the same 4 is Int.SIZE_BYTES.) */
    fun fromInt(value: Int): UUID =
        UUID.nameUUIDFromBytes(ByteBuffer.allocate(Int.SIZE_BYTES).putInt(value).array())
}

/**
 * Builds and persists the app-category assignment (the "App Library").
 *
 * Ownership of the data flow is deliberately inverted from Stario: the
 * repository does no package indexing of its own — something (MainActivity
 * in practice) hands it the current visible app list via [refresh] and it
 * recomputes. That keeps this class free of LauncherApps and testable.
 */
class CategoryRepository(context: Context) {

    private val appContext = context.applicationContext

    private val remapped: SharedPreferences =
        appContext.getSharedPreferences("$PREFIX.CATEGORIES", Context.MODE_PRIVATE)
    private val customNames: SharedPreferences =
        appContext.getSharedPreferences("$PREFIX.CATEGORY_NAMES", Context.MODE_PRIVATE)
    private val categoryOrder: SharedPreferences =
        appContext.getSharedPreferences("$PREFIX.CATEGORY_MAP.CATEGORIES", Context.MODE_PRIVATE)

    /** appKey -> target category uuid, exactly Stario's remap mechanism. */
    private var remapCache: Map<String, String> =
        remapped.all.mapNotNull { (k, v) -> if (v is String) k to v else null }.toMap()

    /** category uuid -> custom name (wins over [CategoryIds.DEFAULT_NAMES]). */
    private var nameCache: Map<String, String> =
        customNames.all.mapNotNull { (k, v) -> if (v is String) k to v else null }.toMap()

    /** category uuid -> order index within the folder grid. */
    private var orderCache: Map<String, Int> =
        categoryOrder.all.mapNotNull { (k, v) -> if (v is Int) k to v else null }.toMap()

    private val lastApps = mutableListOf<LauncherApplication>()

    private val _categories = MutableStateFlow<List<AppCategory>>(emptyList())
    val categories: StateFlow<List<AppCategory>> = _categories.asStateFlow()

    /** Recompute categories from [apps]. Call again whenever the visible
     *  app set changes — MainActivity re-fires this on both app-index and
     *  hidden-set changes. */
    fun refresh(apps: List<LauncherApplication>) {
        lastApps.clear()
        lastApps.addAll(apps)
        _categories.value = build(apps)
    }

    /** The stable per-profile preference key for an app — Stario's scheme:
     *  plain packageName on the owner profile, packageName:handleHash on
     *  work profiles, so the same package on two profiles is two keys. */
    fun appKey(app: LauncherApplication): String = AppKeys.keyOf(app)

    /** Which category an app belongs to: explicit user remap first, then
     *  work-profile apps all land in Managed, then the platform category
     *  int mapped through Stario's UUID scheme (unknown ints -> Unsorted). */
    fun identifierFor(app: LauncherApplication): UUID {
        remapCache[appKey(app)]?.let { stored ->
            runCatching { UUID.fromString(stored) }.getOrNull()?.let { return it }
        }
        if (app.handle != Process.myUserHandle()) {
            return CategoryIds.fromInt(CategoryIds.MANAGED)
        }
        val platformCategory = app.info.category
        return if (CategoryIds.DEFAULT_NAMES.containsKey(platformCategory)) {
            CategoryIds.fromInt(platformCategory)
        } else {
            CategoryIds.fromInt(CategoryIds.UNSORTED)
        }
    }

    /** Custom display name > platform-int default name > "Unsorted". */
    fun nameFor(identifier: UUID): String =
        nameCache[identifier.toString()] ?: DEFAULT_NAME_BY_UUID[identifier.toString()] ?: UNSORTED_NAME

    /** Move an app to a new slot inside its category and persist the
     *  permutation (Stario's updatePermutation semantics: full rewrite). */
    fun moveApp(categoryId: UUID, fromIndex: Int, toIndex: Int) {
        val category = _categories.value.firstOrNull { it.identifier == categoryId } ?: return
        val apps = category.apps.toMutableList()
        if (fromIndex == toIndex || fromIndex !in apps.indices || toIndex !in apps.indices) return

        apps.add(toIndex, apps.removeAt(fromIndex))
        persistAppOrder(categoryId, apps)
        _categories.value = build(lastApps.toList())
    }

    /** Reassign an app to a different category (Stario's updateCategory). */
    fun remapApp(app: LauncherApplication, target: UUID) {
        remapped.edit().putString(appKey(app), target.toString()).apply()
        remapCache = remapCache + (appKey(app) to target.toString())
        _categories.value = build(lastApps.toList())
    }

    /** Set a category's custom display name (Stario's updateCategory(uuid, text)). */
    fun renameCategory(identifier: UUID, name: String) {
        customNames.edit().putString(identifier.toString(), name).apply()
        nameCache = nameCache + (identifier.toString() to name)
        _categories.value = build(lastApps.toList())
    }

    // ---------------------------------------------------------------- internals

    private fun build(apps: List<LauncherApplication>): List<AppCategory> {
        val grouped = apps.groupBy { identifierFor(it) }

        return grouped.map { (uuid, appsInCategory) ->
            AppCategory(uuid, nameFor(uuid), sortedApps(uuid, appsInCategory))
        }.sortedWith { a, b ->
            // Stario's MapComparator: saved order when both have it, else uuid.
            val aIndex = orderCache[a.identifier.toString()]
            val bIndex = orderCache[b.identifier.toString()]
            if (aIndex != null && bIndex != null) aIndex.compareTo(bIndex)
            else a.identifier.compareTo(b.identifier)
        }
    }

    /** Stario's ApplicationComparator: saved permutation when both sides
     *  have one, else LauncherApplication's natural (label) ordering. */
    private fun sortedApps(uuid: UUID, list: List<LauncherApplication>): List<LauncherApplication> {
        val index = appOrder(uuid)
        return list.sortedWith { a, b ->
            val ia = index[appKey(a)]
            val ib = index[appKey(b)]
            if (ia != null && ib != null) ia.compareTo(ib) else a.compareTo(b)
        }
    }

    private fun appOrder(uuid: UUID): Map<String, Int> {
        val prefs = appContext.getSharedPreferences("$PREFIX.CATEGORY_MAP.$uuid", Context.MODE_PRIVATE)
        return prefs.all.mapNotNull { (k, v) -> if (v is Int) k to v else null }.toMap()
    }

    private fun persistAppOrder(uuid: UUID, apps: List<LauncherApplication>) {
        val prefs = appContext.getSharedPreferences("$PREFIX.CATEGORY_MAP.$uuid", Context.MODE_PRIVATE)
        prefs.edit().clear().apply()
        val editor = prefs.edit()
        apps.forEachIndexed { index, app -> editor.putInt(appKey(app), index) }
        editor.apply()
    }

    private companion object {
        const val PREFIX = "dev.omkardile.andromeda"
        const val UNSORTED_NAME = "Unsorted"
        val DEFAULT_NAME_BY_UUID: Map<String, String> =
            CategoryIds.DEFAULT_NAMES.entries.associate { (id, name) ->
                CategoryIds.fromInt(id).toString() to name
            } + mapOf(
                CategoryIds.fromInt(CategoryIds.UNSORTED).toString() to UNSORTED_NAME,
                CategoryIds.fromInt(CategoryIds.MANAGED).toString() to "Managed",
            )
    }
}

/** Per-profile app preference keys, shared by hidden-apps and category
 *  persistence so both always agree on identity. */
internal object AppKeys {
    fun keyOf(app: LauncherApplication): String =
        if (app.handle == Process.myUserHandle()) {
            app.info.packageName
        } else {
            "${app.info.packageName}:${app.handle.hashCode()}"
        }
}
