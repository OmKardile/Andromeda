/*
 * Direct port of Stario's JaroWinklerDistance.java (GPL-3.0,
 * (C) 2025 Răzvan Albu; original in
 * reference/stario-source/.../sheet/drawer/search/), which is itself
 * adapted from Apache Commons Lang 3.3 — the original attribution stays
 * with the file. Semantics are preserved exactly, including the
 * percentage rounding (2 decimals) and the null-argument exception,
 * because Stario's example scores (see the doc below) are the test
 * oracle: a "cleanup" that changes any score would silently change app
 * search ranking vs the original.
 */

package dev.omkardile.andromeda.core.engine.search

/**
 * A similarity algorithm indicating the percentage of matched characters
 * between two character sequences.
 *
 * The Jaro measure is the weighted sum of percentage of matched characters
 * from each file and transposed characters. Winkler increased this measure
 * for matching initial characters.
 *
 * Adapted from Apache Commons Lang 3.3.
 */
object JaroWinkler {

    /**
     * Find the Jaro Winkler Distance which indicates the similarity score
     * between two CharSequences.
     *
     * Example scores (Stario's documented oracle, used by the unit test):
     * ```
     * getScore(null, null)          = IllegalArgumentException
     * getScore("","")               = 0.0
     * getScore("","a")              = 0.0
     * getScore("aaapppp", "")       = 0.0
     * getScore("frog", "fog")       = 0.93
     * getScore("fly", "ant")        = 0.0
     * getScore("elephant", "hippo") = 0.44
     * getScore("hippo", "elephant") = 0.44
     * getScore("hippo", "zzzzzzzz") = 0.0
     * getScore("hello", "hallo")    = 0.88
     * getScore("ABC Corporation", "ABC Corp") = 0.93
     * getScore("D N H Enterprises Inc", "D & H Enterprises, Inc.") = 0.95
     * getScore("My Gym Children's Fitness Center", "My Gym. Childrens Fitness") = 0.92
     * getScore("PENNSYLVANIA", "PENNCISYLVNIA")    = 0.88
     * ```
     *
     * @throws IllegalArgumentException if either input is null.
     */
    fun getScore(left: CharSequence?, right: CharSequence?): Double {
        val defaultScalingFactor = 0.1
        val percentageRoundValue = 100.0

        if (left == null || right == null) {
            throw IllegalArgumentException("Strings must not be null")
        }

        val mtp = matches(left, right)
        val m = mtp[0].toDouble()
        if (m == 0.0) {
            return 0.0
        }
        val j = ((m / left.length + m / right.length + (m - mtp[1]) / m) / 3)
        val jw = if (j < 0.7) {
            j
        } else {
            j + minOf(defaultScalingFactor, 1.0 / mtp[3]) * mtp[2] * (1.0 - j)
        }
        return Math.round(jw * percentageRoundValue) / percentageRoundValue
    }

    /**
     * The Jaro-Winkler string matches, transpositions, prefix, max array.
     *
     * @return mtp array containing: matches, transpositions, prefix, and
     *         max length.
     */
    private fun matches(first: CharSequence, second: CharSequence): IntArray {
        val max: CharSequence
        val min: CharSequence
        if (first.length > second.length) {
            max = first
            min = second
        } else {
            max = second
            min = first
        }
        val range = maxOf(max.length / 2 - 1, 0)
        val matchIndexes = IntArray(min.length) { -1 }
        val matchFlags = BooleanArray(max.length)
        var matches = 0
        for (mi in 0 until min.length) {
            val c1 = min[mi]
            var xi = maxOf(mi - range, 0)
            val xn = minOf(mi + range + 1, max.length)
            while (xi < xn) {
                if (!matchFlags[xi] && c1 == max[xi]) {
                    matchIndexes[mi] = xi
                    matchFlags[xi] = true
                    matches++
                    break
                }
                xi++
            }
        }
        val ms1 = CharArray(matches)
        val ms2 = CharArray(matches)
        var si = 0
        for (i in 0 until min.length) {
            if (matchIndexes[i] != -1) {
                ms1[si] = min[i]
                si++
            }
        }
        si = 0
        for (i in 0 until max.length) {
            if (matchFlags[i]) {
                ms2[si] = max[i]
                si++
            }
        }
        var transpositions = 0
        for (mi in 0 until ms1.size) {
            if (ms1[mi] != ms2[mi]) {
                transpositions++
            }
        }
        var prefix = 0
        for (mi in 0 until min.length) {
            if (first[mi] == second[mi]) {
                prefix++
            } else {
                break
            }
        }
        return intArrayOf(matches, transpositions / 2, prefix, max.length)
    }
}
