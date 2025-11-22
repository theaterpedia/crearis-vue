/**
 * Composable: useSysreg (Unified Wrapper)
 * 
 * Single entry point for all sysreg operations.
 * Combines status, tags, options, and bit groups into one convenient API.
 * 
 * Features:
 * - Auto-initializes all caches
 * - Pre-translated labels (uses current i18n language)
 * - Synchronous access (no async/await needed)
 * - Simplified API - components don't handle i18n complexity
 * 
 * Usage:
 * ```ts
 * const sysreg = useSysreg()
 * 
 * // Get translated status label
 * const label = sysreg.getStatusLabel(hex, 'posts')
 * 
 * // Get options for dropdown
 * const options = sysreg.getOptions('ttags')
 * 
 * // Bit operations
 * if (sysreg.hasBit(value, 3)) { ... }
 * ```
 */

import { computed, type ComputedRef } from 'vue'
import { useI18n } from './useI18n'

// Status operations
import { 
    bufferToHex, 
    hexToBuffer,
    sanitizeStatusVal,
    getStatusInfo,
    getStatusLabel,
    getStatusDescription,
    getStatusesForTable
} from './useSysregStatus'

// Options and tags
import { 
    useSysregOptions,
    type SysregOption,
    type BitGroupOption
} from './useSysregOptions'

// Bit operations
import {
    parseByteaHex,
    byteaFromNumber,
    byteaFromUint8Array,
    uint8ArrayFromBytea,
    hasBit,
    setBit,
    clearBit,
    toggleBit,
    hasAllBits,
    hasAnyBit,
    bitsToByteArray,
    byteArrayToBits,
    toggleTag,
    buildCtagsByte,
    extractCtagsBitGroup,
    extractAllCtagsBitGroups,
    updateCtagsBitGroup,
    orBytea,
    countBits
} from './useSysregTags'

// Bit groups
import {
    useSysregBitGroups
} from './useSysregBitGroups'

/**
 * Unified sysreg composable - single entry point for all sysreg operations
 */
export function useSysreg() {
    const { language } = useI18n()
    const { 
        getOptions: getOptionsBase,
        ctagsBitGroupOptions,
        statusOptions,
        configOptions,
        rtagsOptions,
        ctagsOptions,
        ttagsOptions,
        dtagsOptions
    } = useSysregOptions()
    
    const {
        getBitGroupLabel,
        getBitGroupDescription,
        getBitGroupsWithLabels,
        getBitGroupRange
    } = useSysregBitGroups()

    // ========================================================================
    // Status Operations (synchronous, uses plugin cache)
    // ========================================================================

    /**
     * Convert Buffer to hex string
     */
    function toHex(buffer: any): string | null {
        return bufferToHex(buffer)
    }

    /**
     * Convert hex to database format
     */
    function toBuffer(hex: string | null): string | null {
        return hexToBuffer(hex)
    }

    /**
     * Sanitize status value for API save
     */
    function sanitizeStatus(value: any): string | null {
        return sanitizeStatusVal(value)
    }

    /**
     * Get status info by hex value (synchronous)
     */
    function getStatus(hexValue: string | null, table: string) {
        return getStatusInfo(hexValue, table)
    }

    /**
     * Get translated status label (synchronous, uses current language)
     */
    function getStatusLabelTranslated(hexValue: string | null, table: string, lang?: 'de' | 'en' | 'cz') {
        return getStatusLabel(hexValue, table, lang || language.value as any || 'de')
    }

    /**
     * Get status description (synchronous, uses current language)
     */
    function getStatusDesc(hexValue: string | null, table: string, lang?: 'de' | 'en' | 'cz') {
        return getStatusDescription(hexValue, table, lang || language.value as any || 'de')
    }

    /**
     * Get all statuses for a table
     */
    function getStatuses(table: string) {
        return getStatusesForTable(table)
    }

    // ========================================================================
    // Options Operations (auto-translated)
    // ========================================================================

    /**
     * Get options for a tagfamily (returns pre-translated labels)
     */
    function getOptions(tagfamily: string): ComputedRef<SysregOption[]> {
        return getOptionsBase(tagfamily)
    }

    /**
     * Get CTags bit group options
     */
    function getCtagsBitGroup(group: 'age_group' | 'subject_type' | 'access_level' | 'quality'): ComputedRef<BitGroupOption[]> {
        return ctagsBitGroupOptions[group]
    }

    // ========================================================================
    // Bit Operations (pure functions)
    // ========================================================================

    /**
     * Parse BYTEA hex string to byte array
     */
    function parseBytea(hex: string | null | undefined | any): number[] {
        return parseByteaHex(hex)
    }

    /**
     * Convert number to BYTEA hex string
     */
    function numberToBytea(num: number): string {
        return byteaFromNumber(num)
    }

    /**
     * Check if bit is set
     */
    function bitIsSet(bytea: string | null | undefined, bit: number): boolean {
        return hasBit(bytea, bit)
    }

    /**
     * Set a bit
     */
    function bitSet(bytea: string | null | undefined, bit: number): string {
        return setBit(bytea, bit)
    }

    /**
     * Clear a bit
     */
    function bitClear(bytea: string | null | undefined, bit: number): string {
        return clearBit(bytea, bit)
    }

    /**
     * Toggle a bit
     */
    function bitToggle(bytea: string | null | undefined, bit: number): string {
        return toggleBit(bytea, bit)
    }

    /**
     * Convert bit positions to byte array
     */
    function bitsToBytes(bits: number[]): number[] {
        return bitsToByteArray(bits)
    }

    /**
     * Convert byte array to bit positions
     */
    function bytesToBits(bytes: number[] | string): number[] {
        if (typeof bytes === 'string') {
            return byteArrayToBits(parseByteaHex(bytes))
        }
        return byteArrayToBits(bytes)
    }

    /**
     * Build CTags byte from bit groups
     */
    function buildCtags(groups: {
        age_group: number
        subject_type: number
        access_level: number
        quality: number
    }): string {
        return buildCtagsByte(groups)
    }

    /**
     * Extract CTags bit group value
     */
    function getCtagsGroup(bytea: string | null | undefined, group: 'age_group' | 'subject_type' | 'access_level' | 'quality'): number {
        return extractCtagsBitGroup(bytea, group)
    }

    /**
     * Extract all CTags bit groups
     */
    function getAllCtagsGroups(bytea: string | null | undefined) {
        return extractAllCtagsBitGroups(bytea)
    }

    // ========================================================================
    // Bit Group Operations (auto-translated)
    // ========================================================================

    /**
     * Get translated bit group label (uses current language)
     */
    function getBitGroupLabelTranslated(tagfamily: string, groupName: string, lang?: string) {
        return getBitGroupLabel(tagfamily, groupName, lang || language.value || 'de')
    }

    /**
     * Get bit group description (uses current language)
     */
    function getBitGroupDescTranslated(tagfamily: string, groupName: string, lang?: string) {
        return getBitGroupDescription(tagfamily, groupName, lang || language.value || 'de')
    }

    /**
     * Get all bit groups for a family with labels
     */
    function getBitGroups(tagfamily: string) {
        return getBitGroupsWithLabels(tagfamily)
    }

    /**
     * Get bit range for a group
     */
    function getBitRange(tagfamily: string, groupName: string): string {
        return getBitGroupRange(tagfamily, groupName)
    }

    // ========================================================================
    // Return unified API
    // ========================================================================

    return {
        // Status operations
        toHex,
        toBuffer,
        sanitizeStatus,
        getStatus,
        getStatusLabel: getStatusLabelTranslated,
        getStatusDescription: getStatusDesc,
        getStatuses,

        // Options (pre-translated)
        getOptions,
        getCtagsBitGroup,
        statusOptions,
        configOptions,
        rtagsOptions,
        ctagsOptions,
        ttagsOptions,
        dtagsOptions,

        // Bit operations
        parseBytea,
        numberToBytea,
        bitIsSet,
        bitSet,
        bitClear,
        bitToggle,
        bitsToBytes,
        bytesToBits,
        buildCtags,
        getCtagsGroup,
        getAllCtagsGroups,

        // Bit groups (auto-translated)
        getBitGroupLabel: getBitGroupLabelTranslated,
        getBitGroupDescription: getBitGroupDescTranslated,
        getBitGroups,
        getBitRange,

        // Legacy aliases for compatibility
        hasBit,
        setBit,
        clearBit,
        toggleBit,
        parseByteaHex,
        byteaFromNumber,
        bitsToByteArray,
        byteArrayToBits,
        buildCtagsByte,
        bufferToHex,
        sanitizeStatusVal
    }
}

// Export types
export type { SysregOption, BitGroupOption }

// Re-export commonly used functions for direct import
export {
    sanitizeStatusVal,
    bufferToHex,
    getStatusLabel
} from './useSysregStatus'
