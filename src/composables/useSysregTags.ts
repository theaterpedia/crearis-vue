/**
 * Composable: useSysregTags
 * 
 * Unified tag management for sysreg system.
 * Handles bit operations, INTEGER values, and multi-select tags.
 * 
 * Features:
 * - Auto-initializes cache on module load (no manual setup needed)
 * - CTags bit group extraction/building (age_group, subject_type, etc.)
 * - Multi-tag operations (rtags, ttags, dtags)
 * - INTEGER bit operations (32-bit values)
 * - Tag suggestions from project context
 * 
 * Note: Cache is initialized automatically. Components can start using
 * bit operations immediately without calling initCache().
 * 
 * Migration Note: Post-Migration 036, all sysreg values are now 32-bit INTEGERs
 * instead of BYTEA hex strings. Legacy BYTEA conversion functions are kept
 * for backward compatibility during transition.
 */

import { ref, readonly, type Ref } from 'vue'

// ============================================================================
// Types
// ============================================================================

export interface CtagsBitGroups {
    age_group: number      // bits 0-1 (0-3)
    subject_type: number   // bits 2-3 (0-3)
    access_level: number   // bits 4-5 (0-3)
    quality: number        // bits 6-7 (0-3)
}

export interface SysregEntry {
    id: number     // Database ID
    value: number  // INTEGER (32-bit power-of-2 value)
    name: string
    tagfamily: string
    taglogic: string
    is_default: boolean
    name_i18n?: Record<string, string>
    desc_i18n?: Record<string, string>
}

export interface SysregCache {
    status: SysregEntry[]
    config: SysregEntry[]
    rtags: SysregEntry[]
    ctags: SysregEntry[]
    ttags: SysregEntry[]
    dtags: SysregEntry[]
}

// ============================================================================
// Global Cache
// ============================================================================

const sysregCache = ref<SysregCache | null>(null)
const cacheInitialized = ref(false)
const cacheLoading = ref(false)

/**
 * Initialize sysreg cache from server
 */
async function initCache(): Promise<void> {
    if (cacheInitialized.value || cacheLoading.value) return

    cacheLoading.value = true

    try {
        const response = await fetch('/api/sysreg/all')
        if (!response.ok) {
            throw new Error(`Failed to fetch sysreg data: ${response.statusText}`)
        }

        const data = await response.json()

        // Validate response structure
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid sysreg data: expected object')
        }

        // Check for required tagfamilies
        const requiredFamilies = ['status', 'ttags', 'dtags', 'rtags', 'ctags', 'config']
        const missingFamilies = requiredFamilies.filter(family => !data[family])
        if (missingFamilies.length > 0) {
            throw new Error(`Invalid sysreg data: missing tagfamilies: ${missingFamilies.join(', ')}`)
        }

        sysregCache.value = data
        cacheInitialized.value = true
        console.log('✅ Sysreg cache initialized')
    } catch (error) {
        console.error('❌ Failed to initialize sysreg cache:', error)
        throw error
    } finally {
        cacheLoading.value = false
    }
}

// Auto-initialize cache on module load
if (!cacheInitialized.value && !cacheLoading.value) {
    initCache().catch(err => {
        console.error('[useSysregTags] Failed to auto-initialize cache:', err)
    })
}

/**
 * Reset cache (for testing)
 */
function resetCache(): void {
    sysregCache.value = null
    cacheInitialized.value = false
    cacheLoading.value = false
}

// ============================================================================
// Legacy BYTEA Conversion Helpers (for backward compatibility)
// ============================================================================
//
// Note: Post-Migration 036, sysreg values are stored as INTEGERs in the database.
// These functions are kept for backward compatibility with existing code that
// may still pass BYTEA hex strings. New code should work directly with integers.
//

/**
 * Parse BYTEA hex string to byte array
 * @param hex - BYTEA hex string (e.g., "\\x01" or "\\x0102")
 * @returns Array of byte values
 */
export function parseByteaHex(hex: string | null | undefined | Buffer | any): number[] {
    if (!hex) return [0]

    // Convert Buffer or other objects to string
    let hexString: string
    if (typeof hex === 'string') {
        hexString = hex
    } else if (Buffer.isBuffer(hex)) {
        hexString = `\\x${hex.toString('hex')}`
    } else if (hex && typeof hex === 'object' && 'toString' in hex) {
        hexString = String(hex)
    } else {
        return [0]
    }

    // Remove \x or 0x prefix
    const cleaned = hexString.replace(/^\\x|^0x/, '')

    // Validate hex string (only hex chars allowed)
    if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
        return [0]
    }

    // Handle multi-byte hex strings
    const bytes: number[] = []
    for (let i = 0; i < cleaned.length; i += 2) {
        const byteStr = cleaned.substring(i, i + 2)
        const byte = parseInt(byteStr, 16)
        bytes.push(isNaN(byte) ? 0 : byte)
    }

    return bytes.length > 0 ? bytes : [0]
}

/**
 * Convert number to BYTEA hex string
 * @param num - Numeric value (0-255)
 * @returns BYTEA hex string (e.g., "\\x01")
 */
export function byteaFromNumber(num: number): string {
    if (num < 0 || num > 255) {
        throw new Error(`Invalid byte value: ${num} (must be 0-255)`)
    }

    const hex = num.toString(16).padStart(2, '0')
    return `\\x${hex}`
}

/**
 * Convert Uint8Array to BYTEA hex string
 * @param bytes - Uint8Array
 * @returns BYTEA hex string
 */
export function byteaFromUint8Array(bytes: Uint8Array): string {
    if (bytes.length === 0) return '\\x00'
    return byteaFromNumber(bytes[0] || 0)
}

/**
 * Convert BYTEA hex string to Uint8Array
 * @param hex - BYTEA hex string
 * @returns Uint8Array
 */
export function uint8ArrayFromBytea(hex: string | null | undefined): Uint8Array {
    const bytes = parseByteaHex(hex)
    return new Uint8Array(bytes)
}

// ============================================================================
// Integer Normalization
// ============================================================================

/**
 * Normalize input to integer value
 * Handles: number, BYTEA hex string, Buffer, null, undefined
 * @param value - Input value (number, string, Buffer, null, undefined)
 * @returns Integer value (0 if invalid)
 */
export function normalizeToInteger(value: number | string | null | undefined | Buffer | any): number {
    // Already a number
    if (typeof value === 'number') {
        return Math.floor(value)
    }

    // Null or undefined
    if (value == null) {
        return 0
    }

    // Convert BYTEA hex string or Buffer to integer
    let hexString: string
    if (typeof value === 'string') {
        hexString = value
    } else if (Buffer.isBuffer(value)) {
        hexString = `\\x${value.toString('hex')}`
    } else if (value && typeof value === 'object' && 'toString' in value) {
        hexString = String(value)
    } else {
        return 0
    }

    // Remove \x or 0x prefix
    const cleaned = hexString.replace(/^\\x|^0x/, '')

    // Validate hex string
    if (!/^[0-9a-fA-F]*$/.test(cleaned)) {
        return 0
    }

    // Parse as hex integer (supports multi-byte values)
    const parsed = parseInt(cleaned || '0', 16)
    return isNaN(parsed) ? 0 : parsed
}

// ============================================================================
// Bit Operations (32-bit integers)
// ============================================================================

/**
 * Check if a specific bit is set
 * @param value - INTEGER value (or BYTEA hex string for backward compatibility)
 * @param bit - Bit position (0-31)
 * @returns True if bit is set
 */
export function hasBit(value: number | string | null | undefined, bit: number): boolean {
    if (bit < 0 || bit > 31) {
        throw new Error(`Invalid bit position: ${bit} (must be 0-31)`)
    }

    const num = normalizeToInteger(value)
    return (num & (1 << bit)) !== 0
}

/**
 * Set a specific bit
 * @param value - INTEGER value (or BYTEA hex string for backward compatibility)
 * @param bit - Bit position (0-31)
 * @returns New integer with bit set
 */
export function setBit(value: number | string | null | undefined, bit: number): number {
    if (bit < 0 || bit > 31) {
        throw new Error(`Invalid bit position: ${bit} (must be 0-31)`)
    }

    const num = normalizeToInteger(value)
    return num | (1 << bit)
}

/**
 * Clear a specific bit
 * @param value - INTEGER value (or BYTEA hex string for backward compatibility)
 * @param bit - Bit position (0-31)
 * @returns New integer with bit cleared
 */
export function clearBit(value: number | string | null | undefined, bit: number): number {
    if (bit < 0 || bit > 31) {
        throw new Error(`Invalid bit position: ${bit} (must be 0-31)`)
    }

    const num = normalizeToInteger(value)
    return num & ~(1 << bit)
}

/**
 * Toggle a specific bit
 * @param value - INTEGER value (or BYTEA hex string for backward compatibility)
 * @param bit - Bit position (0-31)
 * @returns New integer with bit toggled
 */
export function toggleBit(value: number | string | null | undefined, bit: number): number {
    if (bit < 0 || bit > 31) {
        throw new Error(`Invalid bit position: ${bit} (must be 0-31)`)
    }

    const num = normalizeToInteger(value)
    return num ^ (1 << bit)
}

/**
 * Check if multiple bits are ALL set (AND logic)
 * @param value - INTEGER value (or BYTEA hex string for backward compatibility)
 * @param bits - Array of bit positions (0-31)
 * @returns True if all bits are set
 */
export function hasAllBits(value: number | string | null | undefined, bits: number[]): boolean {
    const num = normalizeToInteger(value)
    const mask = bits.reduce((acc, bit) => acc | (1 << bit), 0)
    return (num & mask) === mask
}

/**
 * Check if ANY of the bits are set (OR logic)
 * @param value - INTEGER value (or BYTEA hex string for backward compatibility)
 * @param bits - Array of bit positions (0-31)
 * @returns True if any bit is set
 */
export function hasAnyBit(value: number | string | null | undefined, bits: number[]): boolean {
    const num = normalizeToInteger(value)
    const mask = bits.reduce((acc, bit) => acc | (1 << bit), 0)
    return (num & mask) !== 0
}

// ============================================================================
// Multi-Tag Operations (rtags, ttags, dtags)
// ============================================================================

/**
 * Convert bit positions array to integer
 * @param bits - Array of bit positions (e.g., [0, 2, 5])
 * @returns Integer value with bits set
 */
export function bitsToByteArray(bits: number[]): number {
    if (bits.length === 0) return 0

    let value = 0
    bits.forEach(bit => {
        if (bit >= 0 && bit <= 31) {
            value |= (1 << bit)
        }
    })
    return value
}

/**
 * Convert integer to array of set bit positions
 * @param value - Integer value (or BYTEA hex string for backward compatibility)
 * @returns Array of bit positions that are set (0-31)
 */
export function byteArrayToBits(value: number | string | null | undefined): number[] {
    const num = normalizeToInteger(value)
    const bits: number[] = []

    for (let i = 0; i < 32; i++) {
        if (num & (1 << i)) {
            bits.push(i)
        }
    }

    return bits
}

/**
 * Toggle a tag in multi-tag array
 * @param currentBits - Current bit positions (0-31)
 * @param bit - Bit to toggle (0-31)
 * @returns New array of bit positions
 */
export function toggleTag(currentBits: number[], bit: number): number[] {
    if (bit < 0 || bit > 31) {
        throw new Error(`Invalid bit position: ${bit} (must be 0-31)`)
    }

    const index = currentBits.indexOf(bit)
    if (index > -1) {
        return currentBits.filter(b => b !== bit)
    } else {
        return [...currentBits, bit]
    }
}

// ============================================================================
// CTags Bit Group Operations
// ============================================================================

/**
 * Build CTags integer from bit groups
 * @param groups - Object with bit group values
 * @returns Integer value with bit groups set
 */
export function buildCtagsByte(groups: CtagsBitGroups): number {
    let value = 0
    value |= (groups.age_group & 0x03) << 0       // bits 0-1
    value |= (groups.subject_type & 0x03) << 2    // bits 2-3
    value |= (groups.access_level & 0x03) << 4    // bits 4-5
    value |= (groups.quality & 0x03) << 6         // bits 6-7

    return value
}

/**
 * Extract bit group value from CTags
 * @param value - INTEGER value (or BYTEA hex string for backward compatibility)
 * @param group - Group name
 * @returns Group value (0-3)
 */
export function extractCtagsBitGroup(
    value: number | string | null | undefined,
    group: keyof CtagsBitGroups
): number {
    const num = normalizeToInteger(value)

    switch (group) {
        case 'age_group':
            return (num >> 0) & 0x03
        case 'subject_type':
            return (num >> 2) & 0x03
        case 'access_level':
            return (num >> 4) & 0x03
        case 'quality':
            return (num >> 6) & 0x03
        default:
            return 0
    }
}

/**
 * Extract all bit groups from CTags
 * @param value - INTEGER value (or BYTEA hex string for backward compatibility)
 * @returns Object with all bit group values
 */
export function extractAllCtagsBitGroups(value: number | string | null | undefined): CtagsBitGroups {
    return {
        age_group: extractCtagsBitGroup(value, 'age_group'),
        subject_type: extractCtagsBitGroup(value, 'subject_type'),
        access_level: extractCtagsBitGroup(value, 'access_level'),
        quality: extractCtagsBitGroup(value, 'quality')
    }
}

/**
 * Update a specific bit group in CTags
 * @param currentValue - Current INTEGER value (or BYTEA hex string for backward compatibility)
 * @param group - Group name
 * @param value - New value (0-3)
 * @returns Updated integer value
 */
export function updateCtagsBitGroup(
    currentValue: number | string | null | undefined,
    group: keyof CtagsBitGroups,
    value: number
): number {
    if (value < 0 || value > 3) {
        throw new Error(`Invalid bit group value: ${value} (must be 0-3)`)
    }

    const current = extractAllCtagsBitGroups(currentValue)
    current[group] = value
    return buildCtagsByte(current)
}

// ============================================================================
// BYTEA Combination Operations
// ============================================================================

/**
 * Combine multiple integer values using OR operation
 * @param values - Array of integers (or BYTEA hex strings for backward compatibility)
 * @returns Combined integer value
 */
export function orBytea(values: (number | string | null | undefined)[]): number {
    if (values.length === 0) return 0

    let result = 0
    for (const val of values) {
        result |= normalizeToInteger(val)
    }

    return result
}

/**
 * Count number of set bits in integer value
 * @param value - INTEGER value (or BYTEA hex string for backward compatibility)
 * @returns Number of bits set to 1 (in 32-bit integer)
 */
export function countBits(value: number | string | null | undefined): number {
    const num = normalizeToInteger(value)

    let count = 0
    for (let i = 0; i < 32; i++) {
        if ((num & (1 << i)) !== 0) {
            count++
        }
    }

    return count
}

// ============================================================================
// Main Composable
// ============================================================================

export function useSysregTags() {
    return {
        // Cache management
        sysregCache: readonly(sysregCache),
        cacheInitialized: readonly(cacheInitialized),
        cacheLoading: readonly(cacheLoading),
        initCache,
        resetCache,

        // Integer normalization
        normalizeToInteger,

        // Legacy BYTEA conversion (for backward compatibility)
        parseByteaHex,
        byteaFromNumber,
        byteaFromUint8Array,
        uint8ArrayFromBytea,

        // Bit operations (32-bit integers)
        hasBit,
        setBit,
        clearBit,
        toggleBit,
        hasAllBits,
        hasAnyBit,

        // Multi-tag operations
        bitsToByteArray,
        byteArrayToBits,
        toggleTag,

        // Integer combination
        orBytea,
        countBits,

        // CTags bit groups
        buildCtagsByte,
        extractCtagsBitGroup,
        extractAllCtagsBitGroups,
        updateCtagsBitGroup
    }
}
