package dev.omkardile.andromeda.core.engine

import org.junit.Assert.assertEquals
import org.junit.Test

/**
 * The pure triple math — the Intent-parsing half needs Android and is
 * exercised by use; this half must never divide by zero, never exceed
 * 100, and never go negative on hostile extras.
 */
class BatteryStatusTest {

    @Test
    fun typicalHalfCharge() {
        assertEquals(50, BatteryStatus(level = 50, scale = 100, isCharging = false).percentage)
    }

    @Test
    fun nonHundredScales() {
        // Some OEMs report scale ≠ 100.
        assertEquals(75, BatteryStatus(level = 6, scale = 8, isCharging = true).percentage)
        assertEquals(33, BatteryStatus(level = 1, scale = 3, isCharging = false).percentage)
    }

    @Test
    fun zeroScaleGuardsToZero() {
        assertEquals(0, BatteryStatus(level = 50, scale = 0, isCharging = false).percentage)
    }

    @Test
    fun overFullClampsToHundred() {
        assertEquals(100, BatteryStatus(level = 101, scale = 100, isCharging = true).percentage)
    }

    @Test
    fun negativeLevelNeverGoesNegative() {
        assertEquals(0, BatteryStatus(level = -1, scale = 100, isCharging = false).percentage)
    }

    @Test
    fun fullBattery() {
        assertEquals(100, BatteryStatus(level = 100, scale = 100, isCharging = true).percentage)
    }
}
