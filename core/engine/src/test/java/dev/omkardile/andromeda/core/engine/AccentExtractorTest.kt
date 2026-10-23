package dev.omkardile.andromeda.core.engine

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

/**
 * [AccentExtractor.dominantAccent] is pure over ARGB ints, so the whole
 * algorithm is tested without a device — including the edge that bit the
 * original test authoring: 0xFF3050F0 is near-white (v = 240/255 > 0.92)
 * and must be skipped, while 0xFF3050CC (v = 204/255) must survive.
 */
class AccentExtractorTest {

    private fun repeat(vararg pixels: Int, times: Int = 10): IntArray =
        IntArray(pixels.size * times) { pixels[it % pixels.size] }

    @Test
    fun monochromeInputReturnsNull() {
        val grays = repeat(0xFF808080.toInt(), 0xFF1A1A1A.toInt(), 0xFFEFEFEF.toInt())
        assertNull(AccentExtractor.dominantAccent(grays))
    }

    @Test
    fun emptyInputReturnsNull() {
        assertNull(AccentExtractor.dominantAccent(IntArray(0)))
    }

    @Test
    fun nearWhiteVividBlueIsSkipped() {
        // v = 0xF0/255 = 0.94 > 0.92 → skipped → nothing colorful → null.
        assertNull(AccentExtractor.dominantAccent(repeat(0xFF3050F0.toInt())))
    }

    @Test
    fun vividBlueSurvivesAndDominates() {
        // v = 0xCC/255 = 0.80, s = (0xCC-0x30)/0xCC = 0.76 → counted.
        val accent = AccentExtractor.dominantAccent(repeat(0xFF3050CC.toInt()))
        assertNotNull(accent)

        accent!!
        val r = (accent shr 16) and 0xFF
        val g = (accent shr 8) and 0xFF
        val b = accent and 0xFF
        assertTrue("blue channel must dominate", b > g && b > r)
        assertEquals("alpha must be opaque", 0xFF, (accent shr 24) and 0xFF)
    }

    @Test
    fun redWinsOverBlueByWeightNotJustCount() {
        // Both survive the skip filters (v ≤ 0.92). Red's per-pixel weight
        // (s²·v ≈ 0.48 at v=0.82, s=0.77) edges blue's (≈ 0.47 at v=0.80,
        // s=0.77) — saturation² × value, not count alone, decides.
        // Note: 0xFFFF3040 would NOT survive — v=1.0 trips the > 0.92
        // near-white cutoff — the same trap the original authoring round
        // hit with 0xFF3050F0.
        val mixed = repeat(0xFFD03040.toInt(), 0xFF3050CC.toInt())
        val accent = AccentExtractor.dominantAccent(mixed)
        assertNotNull(accent)

        accent!!
        val r = (accent shr 16) and 0xFF
        val b = accent and 0xFF
        assertTrue("red bucket should win the weighted vote", r > b)
    }

    @Test
    fun darkAccentIsNudgedVisible() {
        // A vivid but dark green: v = 0x40/255 = 0.25, s = 1.0. It wins
        // its bucket, but the dark-UI nudge must raise it to v ≥ 0.55.
        val accent = AccentExtractor.dominantAccent(repeat(0xFF004000.toInt()))
        assertNotNull(accent)

        accent!!
        val green = (accent shr 8) and 0xFF
        assertTrue("nudge should raise the dark green to visible", green >= 140)
    }
}
