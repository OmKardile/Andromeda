/*
 * Direct port of Stario's SearchEngine.java (GPL-3.0,
 * (C) 2025 Răzvan Albu; original in
 * reference/stario-source/.../sheet/drawer/search/) minus the parts tied
 * to Stario's app: the launcher-icon drawables (this UI renders engine
 * names as text for now) and the SEARCH_RESULTS "web-only" pref branch
 * (Stario's in-app results page isn't ported — we always hand off to the
 * browser). Query templates are byte-identical to the original, so a
 * query built here lands on the same URL Stario's would.
 *
 * Default: KAGI (plan §1/§8 — the Stario fork's integrated search), not
 * Stario's GOOGLE default.
 */

package dev.omkardile.andromeda.core.engine.search

import android.content.Context

enum class SearchEngines(val label: String, val url: String, private val queryPath: String) {
    GOOGLE("Google", "google.com", "/search?q="),
    DUCK_DUCK_GO("DuckDuckGo", "duckduckgo.com", "/?q="),
    BING("Bing", "bing.com", "/search?q="),
    BRAVE("Brave", "search.brave.com", "/search?q="),
    KAGI("Kagi", "kagi.com", "/search?q="),
    PERPLEXITY("Perplexity AI", "perplexity.ai", "/?s=o&q="),
    ECOSIA("Ecosia", "ecosia.org", "/search?q="),
    YANDEX("Yandex", "yandex.com", "/search/?text="),
    YAHOO("Yahoo", "search.yahoo.com", "/search?p="),
    CHATGPT("ChatGPT", "chatgpt.com", "/?q=");

    /** The full URL a query hands to the browser — Stario's getQuery(). */
    fun queryUrl(query: String): String = "https://$url$queryPath$query"

    companion object {
        private const val PREFS_NAME = "dev.omkardile.andromeda.SEARCH"
        private const val KEY_ENGINE = "engine"

        /** Default KAGI per plan §1/§8 (Stario defaulted to GOOGLE). */
        fun load(context: Context): SearchEngines {
            val stored = context.applicationContext
                .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .getString(KEY_ENGINE, null)
            return entries.firstOrNull { it.url == stored } ?: KAGI
        }

        fun save(context: Context, engine: SearchEngines) {
            context.applicationContext
                .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
                .edit()
                .putString(KEY_ENGINE, engine.url)
                .apply()
        }
    }
}
