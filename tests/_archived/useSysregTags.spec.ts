/**
 * Unit Tests: useSysregTags
 * 
 * Tests BYTEA manipulation and tag value utilities.
 * Total: 45 tests covering all core bit operations.
 */

import { describe, it, expect } from 'vitest'
import {
    parseByteaHex,
    byteArrayToBits,
    setBit,
    clearBit,
    toggleBit,
    hasBit,
    bitsToByteArray
} from '@/composables/useSysregTags'
import {
    byteaEqual,
    expectBitSet,
    expectBitClear,
    expectExactBits,
    expectBitCount,
    expectEmpty,
    expectNotEmpty,
    bitsToHex
} from '../helpers/sysreg-bytea-helpers'

describe('useSysregTags - BYTEA Operations', () => {

    // ============================================================================
    // parseByteaHex() - 8 tests
    // ============================================================================

    describe('parseByteaHex', () => {
        it('parses \\x00 to [0]', () => {
            expect(parseByteaHex('\\x00')).toEqual([0])
        })

        it('parses \\x01 to [1]', () => {
            expect(parseByteaHex('\\x01')).toEqual([1])
        })

        it('parses \\x05 to [5]', () => {
            expect(parseByteaHex('\\x05')).toEqual([5])
        })

        it('parses \\xff to [255]', () => {
            expect(parseByteaHex('\\xff')).toEqual([255])
        })

        it('handles lowercase hex', () => {
            expect(parseByteaHex('\\x0a')).toEqual([10])
        })

        it('handles uppercase hex', () => {
            expect(parseByteaHex('\\x0A')).toEqual([10])
        })

        it('handles multi-byte hex (2 bytes)', () => {
            expect(parseByteaHex('\\x0102')).toEqual([1, 2])
        })

        it('returns [0] for invalid input', () => {
            expect(parseByteaHex('invalid')).toEqual([0])
        })
    })

    // ============================================================================
    // byteArrayToBits() - 7 tests
    // ============================================================================

    describe('byteArrayToBits', () => {
        it('converts [0] to []', () => {
            expect(byteArrayToBits([0])).toEqual([])
        })

        it('converts [1] to [0]', () => {
            expect(byteArrayToBits([1])).toEqual([0])
        })

        it('converts [2] to [1]', () => {
            expect(byteArrayToBits([2])).toEqual([1])
        })

        it('converts [5] to [0, 2]', () => {
            expect(byteArrayToBits([5])).toEqual([0, 2])
        })

        it('converts 7 to [0, 1, 2]', () => {
            expect(byteArrayToBits(7)).toEqual([0, 1, 2])
        })

        it('converts 255 to [0,1,2,3,4,5,6,7]', () => {
            expect(byteArrayToBits(255)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
        })

        it('handles multi-bit integer (0x050003)', () => {
            expect(byteArrayToBits(0x0503)).toEqual([0, 1, 8, 10])
        })
    })

    // ============================================================================
    // setBit() - 6 tests
    // ============================================================================

    describe('setBit', () => {
        it('sets bit 0 in \\x00 → \\x01', () => {
            const result = setBit('\\x00', 0)
            expect(result).toBe(1)
        })

        it('sets bit 1 in \\x00 → \\x02', () => {
            const result = setBit('\\x00', 1)
            expect(result).toBe(2)
        })

        it('sets bit 2 in \\x01 → \\x05', () => {
            const result = setBit('\\x01', 2)
            expect(result).toBe(5)
        })

        it('setting already-set bit is idempotent', () => {
            const result = setBit('\\x01', 0)
            expect(result).toBe(1)
        })

        it('sets multiple bits sequentially', () => {
            let val = '\\x00'
            val = setBit(val, 0)
            val = setBit(val, 2)
            expect(val).toBe(5)
            expectBitSet(val, 0)
            expectBitSet(val, 2)
        })

        it('handles high bit numbers (bit 7)', () => {
            const result = setBit('\\x00', 7)
            expect(result).toBe(128)
        })
    })

    // ============================================================================
    // clearBit() - 6 tests
    // ============================================================================

    describe('clearBit', () => {
        it('clears bit 0 in \\x01 → \\x00', () => {
            const result = clearBit('\\x01', 0)
            expect(result).toBe(0)
        })

        it('clears bit 1 in \\x02 → \\x00', () => {
            const result = clearBit('\\x02', 1)
            expect(result).toBe(0)
        })

        it('clears bit 2 in \\x05 → \\x01', () => {
            const result = clearBit('\\x05', 2)
            expect(result).toBe(1)
        })

        it('clearing already-clear bit is idempotent', () => {
            const result = clearBit('\\x00', 0)
            expect(result).toBe(0)
        })

        it('clears multiple bits sequentially', () => {
            let val = '\\x07' // bits 0,1,2
            val = clearBit(val, 1)
            expect(val).toBe(5) // bits 0,2
            expectBitClear(val, 1)
        })

        it('handles high bit numbers (bit 7)', () => {
            const result = clearBit('\\x80', 7)
            expect(result).toBe(0)
        })
    })

    // ============================================================================
    // toggleBit() - 6 tests
    // ============================================================================

    describe('toggleBit', () => {
        it('toggles bit 0: off → on', () => {
            const result = toggleBit('\\x00', 0)
            expect(result).toBe(1)
        })

        it('toggles bit 0: on → off', () => {
            const result = toggleBit('\\x01', 0)
            expect(result).toBe(0)
        })

        it('toggles bit 2 in \\x01 → \\x05', () => {
            const result = toggleBit('\\x01', 2)
            expect(result).toBe(5)
        })

        it('toggles bit 2 in \\x05 → \\x01', () => {
            const result = toggleBit('\\x05', 2)
            expect(result).toBe(1)
        })

        it('multiple toggles return to original', () => {
            let val = '\\x03'
            val = toggleBit(val, 1)
            val = toggleBit(val, 1)
            expect(val).toBe(3)
        })

        it('handles high bit numbers', () => {
            const result = toggleBit('\\x00', 7)
            expect(result).toBe(128)
        })
    })

    // ============================================================================
    // hasBit() - 6 tests
    // ============================================================================

    describe('hasBit', () => {
        it('detects bit 0 in \\x01', () => {
            expect(hasBit('\\x01', 0)).toBe(true)
        })

        it('detects bit 0 NOT in \\x00', () => {
            expect(hasBit('\\x00', 0)).toBe(false)
        })

        it('detects bit 2 in \\x05', () => {
            expect(hasBit('\\x05', 2)).toBe(true)
        })

        it('detects bit 1 NOT in \\x05', () => {
            expect(hasBit('\\x05', 1)).toBe(false)
        })

        it('detects multiple bits correctly', () => {
            const val = '\\x07' // bits 0,1,2
            expect(hasBit(val, 0)).toBe(true)
            expect(hasBit(val, 1)).toBe(true)
            expect(hasBit(val, 2)).toBe(true)
            expect(hasBit(val, 3)).toBe(false)
        })

        it('handles high bit numbers', () => {
            expect(hasBit('\\x80', 7)).toBe(true)
            expect(hasBit('\\x80', 0)).toBe(false)
        })
    })

    // ============================================================================
    // bitsToByteArray() - 6 tests
    // ============================================================================

    describe('bitsToByteArray', () => {
        it('converts [] to [0]', () => {
            expect(bitsToByteArray([])).toBe(0)
        })

        it('converts [0] to [1]', () => {
            expect(bitsToByteArray([0])).toBe(1)
        })

        it('converts [1] to [2]', () => {
            expect(bitsToByteArray([1])).toBe(2)
        })

        it('converts [0, 2] to [5]', () => {
            expect(bitsToByteArray([0, 2])).toBe(5)
        })

        it('converts [0, 1, 2] to [7]', () => {
            expect(bitsToByteArray([0, 1, 2])).toBe(7)
        })

        it('handles high bit numbers', () => {
            expect(bitsToByteArray([7])).toBe(128)
        })
    })

    // ============================================================================
    // Integration Tests - Complex Scenarios
    // ============================================================================

    describe('Complex bit operations', () => {
        it('combines multiple operations correctly', () => {
            let val = 0

            // Set bits 0, 2, 4
            val = setBit(val, 0)
            val = setBit(val, 2)
            val = setBit(val, 4)
            expectExactBits(val, [0, 2, 4])

            // Clear bit 2
            val = clearBit(val, 2)
            expectExactBits(val, [0, 4])

            // Toggle bit 1 (on), toggle bit 0 (off)
            val = toggleBit(val, 1)
            val = toggleBit(val, 0)
            expectExactBits(val, [1, 4])
        })

        it('handles all bits set (\\xff)', () => {
            const val = '\\xff'
            expectBitCount(val, 8)
            expect(hasBit(val, 0)).toBe(true)
            expect(hasBit(val, 7)).toBe(true)
        })

        it('handles alternating bits pattern', () => {
            // Pattern: 01010101 = 0x55
            let val = 0
            val = setBit(val, 0)
            val = setBit(val, 2)
            val = setBit(val, 4)
            val = setBit(val, 6)

            expectBitCount(val, 4)
            expectBitSet(val, 0)
            expectBitClear(val, 1)
            expectBitSet(val, 2)
            expectBitClear(val, 3)
        })

        it('round-trip: bits → hex → bits', () => {
            const originalBits = [0, 2, 5, 7]
            const hex = bitsToHex(originalBits)
            expectExactBits(hex, originalBits)
        })

        it('validates idempotency of operations', () => {
            const val = 21 // bits 0, 2, 4 (0x15)

            // Setting already-set bits
            let result = setBit(val, 0)
            result = setBit(result, 2)
            result = setBit(result, 4)
            expect(result).toBe(21)

            // Clearing already-clear bits
            result = clearBit(val, 1)
            result = clearBit(result, 3)
            result = clearBit(result, 5)
            expect(result).toBe(21)
        })
    })

    // ============================================================================
    // Edge Cases
    // ============================================================================

    describe('Edge cases', () => {
        it('handles empty byte value', () => {
            const val = 0
            expectEmpty(val)
            expectBitCount(val, 0)
        })

        it('handles single bit patterns', () => {
            for (let bit = 0; bit < 8; bit++) {
                const val = setBit(0, bit)
                expectBitCount(val, 1)
                expectBitSet(val, bit)
            }
        })

        it('clears all bits one by one', () => {
            let val = 255 // All 8 bits set
            expectBitCount(val, 8)

            for (let bit = 0; bit < 8; bit++) {
                val = clearBit(val, bit)
            }

            expectEmpty(val)
        })

        it('handles rapid bit toggling', () => {
            let val = 0

            // Toggle each bit twice (should return to original)
            for (let bit = 0; bit < 4; bit++) {
                val = toggleBit(val, bit)
                val = toggleBit(val, bit)
            }

            expectEmpty(val)
        })

        it('verifies bit positions are independent', () => {
            let val = 0

            // Set every other bit
            val = setBit(val, 0)
            val = setBit(val, 2)
            val = setBit(val, 4)

            // Verify specific bits without affecting others
            expectBitSet(val, 0)
            expectBitClear(val, 1)
            expectBitSet(val, 2)
            expectBitClear(val, 3)
            expectBitSet(val, 4)
        })
    })
})
