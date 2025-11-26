/**
 * Composable: useSysregTags
 * 
 * Unified tag management for sysreg system.
 * Handles bit operations, BYTEA conversion, and multi-select tags.
 * 
 * Features:
 * - Auto-initializes cache on module load (no manual setup needed)
 * - CTags bit group extraction/building (age_group, subject_type, etc.)
 * - Multi-tag operations (rtags, ttags, dtags)
 * - BYTEA ↔ hex string ↔ bit array conversions
 * - Tag suggestions from project context
 * 
 * Note: Cache is initialized automatically. Components can start using
 * bit operations immediately without calling initCache().
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
    value: string  // BYTEA as hex string (e.g., "\\x01")
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
// BYTEA Conversion Helpers
// ============================================================================

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
// Bit Operations
// ============================================================================

/**
 * Check if a specific bit is set
 * @param bytea - BYTEA hex string
 * @param bit - Bit position (0-7)
 * @returns True if bit is set
 */
export function hasBit(bytea: string | null | undefined, bit: number): boolean {
    if (bit < 0 || bit > 7) {
        throw new Error(`Invalid bit position: ${bit} (must be 0-7)`)
    }

    const bytes = parseByteaHex(bytea)
    const num = bytes[0] || 0
    return (num & (1 << bit)) !== 0
}

/**
 * Set a specific bit
 * @param bytea - BYTEA hex string
 * @param bit - Bit position (0-7)
 * @returns New BYTEA hex string with bit set
 */
export function setBit(bytea: string | null | undefined, bit: number): string {
    if (bit < 0 || bit > 7) {
        throw new Error(`Invalid bit position: ${bit} (must be 0-7)`)
    }

    const bytes = parseByteaHex(bytea)
    const num = bytes[0] || 0
    const updated = num | (1 << bit)
    return byteaFromNumber(updated)
}

/**
 * Clear a specific bit
 * @param bytea - BYTEA hex string
 * @param bit - Bit position (0-7)
 * @returns New BYTEA hex string with bit cleared
 */
export function clearBit(bytea: string | null | undefined, bit: number): string {
    if (bit < 0 || bit > 7) {
        throw new Error(`Invalid bit position: ${bit} (must be 0-7)`)
    }

    const bytes = parseByteaHex(bytea)
    const num = bytes[0] || 0
    const updated = num & ~(1 << bit)
    return byteaFromNumber(updated)
}

/**
 * Toggle a specific bit
 * @param bytea - BYTEA hex string
 * @param bit - Bit position (0-7)
 * @returns New BYTEA hex string with bit toggled
 */
export function toggleBit(bytea: string | null | undefined, bit: number): string {
    if (bit < 0 || bit > 7) {
        throw new Error(`Invalid bit position: ${bit} (must be 0-7)`)
    }

    const bytes = parseByteaHex(bytea)
    const num = bytes[0] || 0
    const updated = num ^ (1 << bit)
    return byteaFromNumber(updated)
}

/**
 * Check if multiple bits are ALL set (AND logic)
 * @param bytea - BYTEA hex string
 * @param bits - Array of bit positions
 * @returns True if all bits are set
 */
export function hasAllBits(bytea: string | null | undefined, bits: number[]): boolean {
    const bytes = parseByteaHex(bytea)
    const num = bytes[0] || 0
    const mask = bits.reduce((acc, bit) => acc | (1 << bit), 0)
    return (num & mask) === mask
}

/**
 * Check if ANY of the bits are set (OR logic)
 * @param bytea - BYTEA hex string
 * @param bits - Array of bit positions
 * @returns True if any bit is set
 */
export function hasAnyBit(bytea: string | null | undefined, bits: number[]): boolean {
    const bytes = parseByteaHex(bytea)
    const num = bytes[0] || 0
    const mask = bits.reduce((acc, bit) => acc | (1 << bit), 0)
    return (num & mask) !== 0
}

// ============================================================================
// Multi-Tag Operations (rtags, ttags, dtags)
// ============================================================================

/**
 * Convert bit positions array to byte array
 * @param bits - Array of bit positions (e.g., [0, 2, 5])
 * @returns Array of byte values
 */
export function bitsToByteArray(bits: number[]): number[] {
    if (bits.length === 0) return [0]

    let byte = 0
    bits.forEach(bit => {
        if (bit >= 0 && bit <= 7) {
            byte |= (1 << bit)
        }
    })
    return [byte]
}

/**
 * Convert byte array to array of set bit positions
 * @param bytes - Array of byte values
 * @returns Array of bit positions that are set
 */
export function byteArrayToBits(bytes: number[]): number[] {
    if (!bytes || bytes.length === 0) return []

    const bits: number[] = []

    // Process each byte
    bytes.forEach((byte, byteIndex) => {
        const num = byte || 0
        const bitOffset = byteIndex * 8

        for (let i = 0; i < 8; i++) {
            if (num & (1 << i)) {
                bits.push(bitOffset + i)
            }
        }
    })

    return bits
}

/**
 * Toggle a tag in multi-tag array
 * @param currentBits - Current bit positions
 * @param bit - Bit to toggle
 * @returns New array of bit positions
 */
export function toggleTag(currentBits: number[], bit: number): number[] {
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
 * Build CTags byte from bit groups
 * @param groups - Object with bit group values
 * @returns BYTEA hex string
 */
export function buildCtagsByte(groups: CtagsBitGroups): string {
    let byte = 0
    byte |= (groups.age_group & 0x03) << 0       // bits 0-1
    byte |= (groups.subject_type & 0x03) << 2    // bits 2-3
    byte |= (groups.access_level & 0x03) << 4    // bits 4-5
    byte |= (groups.quality & 0x03) << 6         // bits 6-7

    return byteaFromNumber(byte)
}

/**
 * Extract bit group value from CTags
 * @param bytea - BYTEA hex string
 * @param group - Group name
 * @returns Group value (0-3)
 */
export function extractCtagsBitGroup(
    bytea: string | null | undefined,
    group: keyof CtagsBitGroups
): number {
    const bytes = parseByteaHex(bytea)
    const num = bytes[0] || 0

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
 * @param bytea - BYTEA hex string
 * @returns Object with all bit group values
 */
export function extractAllCtagsBitGroups(bytea: string | null | undefined): CtagsBitGroups {
    return {
        age_group: extractCtagsBitGroup(bytea, 'age_group'),
        subject_type: extractCtagsBitGroup(bytea, 'subject_type'),
        access_level: extractCtagsBitGroup(bytea, 'access_level'),
        quality: extractCtagsBitGroup(bytea, 'quality')
    }
}

/**
 * Update a specific bit group in CTags
 * @param bytea - Current BYTEA hex string
 * @param group - Group name
 * @param value - New value (0-3)
 * @returns Updated BYTEA hex string
 */
export function updateCtagsBitGroup(
    bytea: string | null | undefined,
    group: keyof CtagsBitGroups,
    value: number
): string {
    if (value < 0 || value > 3) {
        throw new Error(`Invalid bit group value: ${value} (must be 0-3)`)
    }

    const current = extractAllCtagsBitGroups(bytea)
    current[group] = value
    return buildCtagsByte(current)
}

// ============================================================================
// BYTEA Combination Operations
// ============================================================================

/**
 * Combine multiple BYTEA values using OR operation
 * @param values - Array of BYTEA hex strings
 * @returns Combined BYTEA hex string
 */
export function orBytea(values: (string | null | undefined)[]): string {
    if (values.length === 0) return '\\x00'

    let result = 0
    for (const val of values) {
        const bytes = parseByteaHex(val)
        result |= (bytes[0] || 0)
    }

    return byteaFromNumber(result)
}

/**
 * Count number of set bits in BYTEA value
 * @param bytea - BYTEA hex string
 * @returns Number of bits set to 1
 */
export function countBits(bytea: string | null | undefined): number {
    const bytes = parseByteaHex(bytea)
    const num = bytes[0] || 0

    let count = 0
    for (let i = 0; i < 8; i++) {
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

        // BYTEA conversion
        parseByteaHex,
        byteaFromNumber,
        byteaFromUint8Array,
        uint8ArrayFromBytea,

        // Bit operations
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

        // BYTEA combination
        orBytea,
        countBits,

        // CTags bit groups
        buildCtagsByte,
        extractCtagsBitGroup,
        extractAllCtagsBitGroups,
        updateCtagsBitGroup
    }
}
