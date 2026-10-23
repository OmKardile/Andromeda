/*
 * New file — not a port. Stario's accent extraction went through
 * androidx.palette (Material You lineage); Andromeda has no Material
 * dependency to preserve, so this is a small purpose-built quantizer
 * instead: 12 hue buckets, saturation² × value weights (s² makes muddy
 * colors lose to vivid ones; scaling by value keeps dark colors from
 * winning just by being "colorful" in the HSV sense), a monochrome null
 * result, and a dark-UI visibility nudge on the winner.
 *
 * [dominantAccent] is pure Kotlin over ARGB ints — no android.graphics
 * types — so the unit test covers the whole algorithm without a device.
 * [fromBitmap] is the thin Android wrapper (sampled to a ~192px grid).
 */

package dev.omkardile.andromeda.core.engine

import android.graphics.Bitmap
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.max
import kotlin.math.sin

object AccentExtractor {

    private const val BUCKETS = 12
    private const val NEAR_WHITE_VALUE = 0.92f
    private const val NEAR_BLACK_VALUE = 0.08f
    private const val MIN_SATURATION = 0.12f
    private const val MIN_COLORFUL_FRACTION = 0.05f
    private const val MIN_VISIBLE_VALUE = 0.55f
    private const val MIN_VISIBLE_SATURATION = 0.35f
    private const val SAMPLE_MAX_DIM = 192

    /**
     * @param pixels ARGB ints (any order, any stride).
     * @return an ARGB accent int representative of the dominant vivid hue,
     *         or null if the input is effectively monochrome / all pixels
     *         were skipped.
     */
    fun dominantAccent(pixels: IntArray): Int? {
        val weight = FloatArray(BUCKETS)
        val sumSin = FloatArray(BUCKETS)
        val sumCos = FloatArray(BUCKETS)
        val sumSaturation = FloatArray(BUCKETS)
        val sumValue = FloatArray(BUCKETS)
        var colorful = 0

        for (pixel in pixels) {
            val r = ((pixel shr 16) and 0xFF) / 255f
            val g = ((pixel shr 8) and 0xFF) / 255f
            val b = (pixel and 0xFF) / 255f

            val value = max(r, max(g, b))
            val min = minOf(r, g, b)
            val saturation = if (value <= 0f) 0f else (value - min) / value

            if (value > NEAR_WHITE_VALUE || value < NEAR_BLACK_VALUE || saturation < MIN_SATURATION) {
                continue
            }

            val hue = hueOf(r, g, b, value, min)
            val bucket = ((hue / (360f / BUCKETS)).toInt() % BUCKETS)
            val w = saturation * saturation * value

            weight[bucket] += w
            sumSin[bucket] += sin(Math.toRadians(hue.toDouble())).toFloat() * w
            sumCos[bucket] += cos(Math.toRadians(hue.toDouble())).toFloat() * w
            sumSaturation[bucket] += saturation * w
            sumValue[bucket] += value * w
            colorful++
        }

        if (colorful == 0 || colorful < pixels.size * MIN_COLORFUL_FRACTION) {
            return null
        }

        var winner = -1
        var winnerWeight = 0f
        for (bucket in 0 until BUCKETS) {
            if (weight[bucket] > winnerWeight) {
                winnerWeight = weight[bucket]
                winner = bucket
            }
        }
        if (winner < 0 || winnerWeight <= 0f) return null

        val hue = atan2(sumSin[winner], sumCos[winner]).let { radians ->
            val degrees = Math.toDegrees(radians.toDouble()).toFloat()
            if (degrees < 0f) degrees + 360f else degrees
        }

        // Dark-UI visibility nudge: an accent that is genuinely dark or
        // washed-out on a dark launcher background reads as mud, not color.
        val saturation = max(sumSaturation[winner] / winnerWeight, MIN_VISIBLE_SATURATION)
        val value = max(sumValue[winner] / winnerWeight, MIN_VISIBLE_VALUE)

        return hsv(hue, saturation, value)
    }

    /** Samples the bitmap to a ~[SAMPLE_MAX_DIM] grid, then delegates. */
    fun fromBitmap(bitmap: Bitmap): Int? {
        val width = bitmap.width
        val height = bitmap.height
        if (width <= 0 || height <= 0) return null

        val step = maxOf(width, height) / SAMPLE_MAX_DIM + 1
        val samples = ArrayList<Int>((width / step + 1) * (height / step + 1))

        var y = 0
        while (y < height) {
            var x = 0
            while (x < width) {
                samples.add(bitmap.getPixel(x, y))
                x += step
            }
            y += step
        }

        return dominantAccent(samples.toIntArray())
    }

    private fun hueOf(r: Float, g: Float, b: Float, value: Float, min: Float): Float {
        if (value == min) return 0f
        val delta = value - min
        return when (value) {
            r -> 60f * ((g - b) / delta).mod(6f)
            g -> 60f * ((b - r) / delta + 2f)
            else -> 60f * ((r - g) / delta + 4f)
        }
    }

    private fun hsv(hue: Float, saturation: Float, value: Float): Int {
        val c = value * saturation
        // x follows the classic triangle wave: c * (1 - |(h/60) mod 2 - 1|)
        val hp = (hue / 60f).mod(2f)
        val distFromOne = if (hp < 1f) 1f - hp else hp - 1f
        val x = c * (1f - distFromOne)
        val m = value - c

        val (r, g, b) = when {
            hue < 60f -> Triple(c, x, 0f)
            hue < 120f -> Triple(x, c, 0f)
            hue < 180f -> Triple(0f, c, x)
            hue < 240f -> Triple(0f, x, c)
            hue < 300f -> Triple(x, 0f, c)
            else -> Triple(c, 0f, x)
        }

        return (0xFF shl 24) or
            (((r + m) * 255f).toInt().coerceIn(0, 255) shl 16) or
            (((g + m) * 255f).toInt().coerceIn(0, 255) shl 8) or
            ((b + m) * 255f).toInt().coerceIn(0, 255)
    }
}
