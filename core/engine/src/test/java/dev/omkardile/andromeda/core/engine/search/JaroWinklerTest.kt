package dev.omkardile.andromeda.core.engine.search

import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Test

/**
 * The port's oracle: Stario's own documented example scores (which the
 * original inherited from Apache Commons Lang 3.3). If any of these fail,
 * the port changed behavior — that changes app-search ranking, not just
 * a number.
 */
class JaroWinklerTest {

    @Test
    fun nullInputsThrow() {
        assertThrows(IllegalArgumentException::class.java) {
            JaroWinkler.getScore(null, null)
        }
        assertThrows(IllegalArgumentException::class.java) {
            JaroWinkler.getScore("a", null)
        }
        assertThrows(IllegalArgumentException::class.java) {
            JaroWinkler.getScore(null, "a")
        }
    }

    @Test
    fun emptyStringCasesScoreZero() {
        assertEquals(0.0, JaroWinkler.getScore("", ""), 1e-9)
        assertEquals(0.0, JaroWinkler.getScore("", "a"), 1e-9)
        assertEquals(0.0, JaroWinkler.getScore("aaapppp", ""), 1e-9)
    }

    @Test
    fun noSimilarityCasesScoreZero() {
        assertEquals(0.0, JaroWinkler.getScore("fly", "ant"), 1e-9)
        assertEquals(0.0, JaroWinkler.getScore("hippo", "zzzzzzzz"), 1e-9)
    }

    @Test
    fun oracleScoresMatchStario() {
        assertEquals(0.93, JaroWinkler.getScore("frog", "fog"), 1e-9)
        assertEquals(0.44, JaroWinkler.getScore("elephant", "hippo"), 1e-9)
        assertEquals(0.44, JaroWinkler.getScore("hippo", "elephant"), 1e-9)
        assertEquals(0.88, JaroWinkler.getScore("hello", "hallo"), 1e-9)
        assertEquals(0.93, JaroWinkler.getScore("ABC Corporation", "ABC Corp"), 1e-9)
        assertEquals(
            0.95,
            JaroWinkler.getScore("D N H Enterprises Inc", "D & H Enterprises, Inc."),
            1e-9,
        )
        assertEquals(
            0.92,
            JaroWinkler.getScore("My Gym Children's Fitness Center", "My Gym. Childrens Fitness"),
            1e-9,
        )
        assertEquals(0.88, JaroWinkler.getScore("PENNSYLVANIA", "PENNCISYLVNIA"), 1e-9)
    }
}
