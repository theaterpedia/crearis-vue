/**
 * useCapabilities — admin-bit detection (Item 1 / 3c, SFR-9 resolution).
 *
 * Bit-31 of sysreg_config rule-bitmask; toggling flips bitmask to negative-int32.
 * Examples from _CHECKLIST_SFR SFR-9:
 *   0x4800D20                 = 75500832      → no admin bit
 *   0x4800D20 | 0x80000000    = -2071982816   → admin bit set
 *   0x80000000                = -2147483648   → only admin bit
 */

import { describe, it, expect } from 'vitest'
import { hasAdminBitSet, ADMIN_BIT_MASK } from '@/composables/useCapabilities'

describe('ADMIN_BIT_MASK constant', () => {
    it('is bit-31 (0x80000000 = 2147483648)', () => {
        expect(ADMIN_BIT_MASK).toBe(0x80000000)
        expect(ADMIN_BIT_MASK).toBe(2147483648)
    })
})

describe('hasAdminBitSet', () => {
    it('returns false for null / undefined / 0', () => {
        expect(hasAdminBitSet(null)).toBe(false)
        expect(hasAdminBitSet(undefined)).toBe(false)
        expect(hasAdminBitSet(0)).toBe(false)
    })

    it('returns false for low-bit status values (no admin)', () => {
        expect(hasAdminBitSet(1)).toBe(false)     // NEW
        expect(hasAdminBitSet(64)).toBe(false)    // DRAFT
        expect(hasAdminBitSet(512)).toBe(false)   // CONFIRMED
        expect(hasAdminBitSet(4096)).toBe(false)  // RELEASED
    })

    it('returns false for admin-UI realistic bitmask without bit-31', () => {
        // 0x4800D20 = 75500832 (multiple category bits, no admin)
        expect(hasAdminBitSet(0x4800d20)).toBe(false)
        expect(hasAdminBitSet(75500832)).toBe(false)
    })

    it('returns true for admin-UI realistic bitmask with bit-31 set', () => {
        // 0x4800D20 | 0x80000000 = -2071982816 (signed int32 wrap)
        const withAdmin = 0x4800d20 | 0x80000000
        expect(withAdmin).toBe(-2071982816)
        expect(hasAdminBitSet(withAdmin)).toBe(true)
        expect(hasAdminBitSet(-2071982816)).toBe(true)
    })

    it('returns true for bit-31-only values in both signed + unsigned representations', () => {
        // 0x80000000 interpreted as signed-int32 = -2147483648
        expect(hasAdminBitSet(-2147483648)).toBe(true)
        // Unsigned-positive representation — still has bit-31 set
        expect(hasAdminBitSet(0x80000000)).toBe(true)
    })

    it('returns true regardless of other bits set alongside bit-31', () => {
        expect(hasAdminBitSet(0x80000001)).toBe(true)   // admin + NEW
        expect(hasAdminBitSet(0x80000200)).toBe(true)   // admin + CONFIRMED
        expect(hasAdminBitSet(0x80001000)).toBe(true)   // admin + RELEASED
    })
})
