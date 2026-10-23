/*
 * New file — not a port. Spring physics tokens (plan §1: "springy
 * physics"), collected in one place so screens stay visually coherent
 * and future tuning (the plan's "Animations & Physics Tuning" phase)
 * has exactly one place to happen. Values are starting points chosen
 * against Compose's own spring vocabulary, deliberately not per-screen
 * one-offs.
 */

package dev.omkardile.andromeda.design

import androidx.compose.animation.core.Spring
import androidx.compose.animation.core.spring

object AndromedaMotion {

    /** Small UI feedback — tiles, chips, dock elements. Quick with just a
     *  hint of life at the end. */
    val snappy = spring<Float>(
        dampingRatio = Spring.DampingRatioLowBouncy,
        stiffness = Spring.StiffnessMediumLow,
    )

    /** Larger surfaces — scrims, sheets. No bounce; heavy things don't
     *  wobble. */
    val gentle = spring<Float>(
        dampingRatio = Spring.DampingRatioNoBouncy,
        stiffness = Spring.StiffnessLow,
    )

    /** Entrances (folder detail, screen content). Decidedly present but
     *  settling fast, tuned from Stario's visual character: noticeable
     *  spring, gone before it annoys. */
    val entrance = spring<Float>(
        dampingRatio = 0.75f,
        stiffness = 380f,
    )
}
