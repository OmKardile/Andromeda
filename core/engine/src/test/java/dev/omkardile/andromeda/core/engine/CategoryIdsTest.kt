package dev.omkardile.andromeda.core.engine

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotEquals
import org.junit.Test
import java.util.UUID

/**
 * The category-identifier oracle. Expected values were computed
 * INDEPENDENTLY of the implementation (a throwaway script doing
 * MD5(nameUUIDFromBytes-style version/variant fixups) over the 4-byte
 * big-endian int) and hardcoded below — so this test catches any drift
 * from Stario's UUID scheme, which persisted remaps and folder orders
 * depend on.
 */
class CategoryIdsTest {

    @Test
    fun matchesStarioUuidScheme() {
        // Games / Audio / Video / Images / Social
        assertEquals(UUID.fromString("f1d3ff84-4329-3732-862d-f21dc4e57262"), CategoryIds.fromInt(0))
        assertEquals(UUID.fromString("f1450306-5176-34a5-beaf-bbf8ed995985"), CategoryIds.fromInt(1))
        assertEquals(UUID.fromString("f11177d2-ec63-3995-bb4a-c628e0d782df"), CategoryIds.fromInt(2))
        assertEquals(UUID.fromString("584a15a9-0f2f-359d-8703-594ad447ae93"), CategoryIds.fromInt(3))
        assertEquals(UUID.fromString("ea4959eb-64a1-309b-a580-d950964f3843"), CategoryIds.fromInt(4))

        // News / Maps / Productivity / Accessibility / Finance
        assertEquals(UUID.fromString("bb3e7acf-9d84-34b5-a72b-2aa6f27bf644"), CategoryIds.fromInt(5))
        assertEquals(UUID.fromString("b25030c1-7661-3061-bb2b-bfd8194af2e0"), CategoryIds.fromInt(6))
        assertEquals(UUID.fromString("679e1923-4b29-3ee4-b2a3-920c30fda6ac"), CategoryIds.fromInt(7))
        assertEquals(UUID.fromString("c47b300a-ee4e-3125-80f9-ec8be0907186"), CategoryIds.fromInt(8))
        assertEquals(UUID.fromString("3d3e0205-46b9-34fe-9362-db781abce851"), CategoryIds.fromInt(9))

        // Health / Personalization / Sports
        assertEquals(UUID.fromString("cfb8bb33-95ce-39f3-b358-6c2516e966a6"), CategoryIds.fromInt(10))
        assertEquals(UUID.fromString("a6b6ca54-8431-3120-ae42-48ccf28fd4ad"), CategoryIds.fromInt(11))
        assertEquals(UUID.fromString("6fcc61d8-f99f-3449-ad80-8c1c10676cf0"), CategoryIds.fromInt(12))

        // MANAGED (-2) and UNSORTED (-1) sentinels
        assertEquals(UUID.fromString("b45ac8b2-52e9-3395-8264-1979716656a4"), CategoryIds.fromInt(CategoryIds.MANAGED))
        assertEquals(UUID.fromString("a54f0041-a9e1-3b05-8f25-c463f1db7449"), CategoryIds.fromInt(CategoryIds.UNSORTED))
    }

    @Test
    fun versionAndVariantBitsAreNameBased() {
        // nameUUIDFromBytes → version 3, IETF variant. Spot-check a few.
        for (value in listOf(-2, -1, 0, 7, 12)) {
            val uuid = CategoryIds.fromInt(value)
            assertEquals(3, uuid.version())
            assertEquals(2, uuid.variant())
        }
    }

    @Test
    fun distinctIntsGiveDistinctUuids() {
        assertNotEquals(CategoryIds.fromInt(0), CategoryIds.fromInt(1))
        assertNotEquals(CategoryIds.fromInt(-1), CategoryIds.fromInt(-2))
    }

    @Test
    fun defaultNamesCoverAllPlatformCategories() {
        // Every int the platform may report (0..12) resolves to a name;
        // the sentinels resolve through nameFor, not this map.
        assertEquals(13, CategoryIds.DEFAULT_NAMES.size)
        CategoryIds.DEFAULT_NAMES.values.forEach { name ->
            assert(name.isNotBlank())
        }
    }
}
