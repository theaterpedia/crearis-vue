/**
 * Sysreg Status Composable
 * 
 * Handles proper conversion between Node.js Buffer objects and hex strings
 * for status_val BYTEA fields. Prevents the common issue where Buffers get
 * stringified into huge JSON representations that grow on each save.
 * 
 * The status_val field in PostgreSQL is BYTEA (binary data), typically 2 bytes.
 * Node.js returns it as a Buffer object. When sent to the client, it becomes
 * { type: 'Buffer', data: [0, 0] }. If improperly stringified, it grows exponentially.
 * 
 * This composable integrates with the Sysreg plugin for synchronous access to
 * status names, labels, and translations from the preloaded cache.
 * 
 * Usage:
 * - bufferToHex(): Convert Buffer to hex string
 * - sanitizeStatusVal(): Prepare status for API save
 * - getStatusInfo(): Get name/label for a hex value (synchronous)
 * - getStatusLabel(): Get translated label (synchronous)
 */

import { computed, type Ref } from 'vue'
import { getSysregCache, type SysregStatusEntry } from '@/plugins/sysreg'

/**
 * Convert Buffer-like object to hex string
 * Handles both Node.js Buffer objects and their JSON representation
 */
export function bufferToHex(buffer: any): string | null {
    if (!buffer) return null

    // If it's already a string (hex), return it
    if (typeof buffer === 'string') {
        // Remove '0x' or '\x' prefix if present
        return buffer.replace(/^(0x|\\x)/, '')
    }

    // If it's a Buffer object from Node.js
    if (buffer.type === 'Buffer' && Array.isArray(buffer.data)) {
        return buffer.data.map((b: number) => b.toString(16).padStart(2, '0')).join('')
    }

    // If it's an actual Buffer instance (shouldn't happen in browser, but just in case)
    if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(buffer)) {
        return buffer.toString('hex')
    }

    return null
}

/**
 * Convert hex string to format suitable for database
 * Returns hex string without '0x' prefix
 */
export function hexToBuffer(hex: string | null): string | null {
    if (!hex) return null

    // Remove '0x' or '\x' prefix if present
    const cleanHex = hex.replace(/^(0x|\\x)/, '')

    // Validate hex string (only 0-9, a-f, A-F)
    if (!/^[0-9a-fA-F]+$/.test(cleanHex)) {
        console.warn('[useSysregStatus] Invalid hex string:', hex)
        return null
    }

    // Ensure even length (each byte is 2 hex chars)
    return cleanHex.length % 2 === 0 ? cleanHex : '0' + cleanHex
}

/**
 * Get status information from cache (synchronous)
 * @param hexValue - Hex value (e.g., '0000', '0001') or full format ('\\x0000')
 * @param table - Entity table (e.g., 'posts', 'events')
 * @returns Status entry or null if not found
 */
export function getStatusInfo(hexValue: string | null, table: string): SysregStatusEntry | null {
    if (!hexValue) return null

    const cache = getSysregCache()
    const cleanHex = hexValue.replace(/^(0x|\\x)/, '').toLowerCase()

    return cache.find(entry =>
        entry.hex_value.toLowerCase() === cleanHex &&
        entry.table === table
    ) || null
}

/**
 * Get translated status label (synchronous)
 * @param hexValue - Hex value from status_val
 * @param table - Entity table
 * @param lang - Language code ('de', 'en', 'cz')
 * @returns Translated label or fallback
 */
export function getStatusLabel(hexValue: string | null, table: string, lang: 'de' | 'en' | 'cz' = 'de'): string {
    const info = getStatusInfo(hexValue, table)
    if (!info) return ''

    switch (lang) {
        case 'en':
            return info.name_en
        case 'cz':
            return info.name_cz
        case 'de':
        default:
            return info.name_de
    }
}

/**
 * Get status description (synchronous)
 */
export function getStatusDescription(hexValue: string | null, table: string, lang: 'de' | 'en' | 'cz' = 'de'): string | null {
    const info = getStatusInfo(hexValue, table)
    if (!info) return null

    switch (lang) {
        case 'en':
            return info.desc_en || null
        case 'cz':
            return info.desc_cz || null
        case 'de':
        default:
            return info.desc_de || null
    }
}

/**
 * Get all statuses for a table (synchronous)
 * Useful for populating status dropdowns
 */
export function getStatusesForTable(table: string): SysregStatusEntry[] {
    const cache = getSysregCache()
    return cache.filter(entry => entry.table === table)
}

/**
 * Composable for managing sysreg status values in forms
 * 
 * Usage:
 * ```ts
 * const { statusHex, updateStatus, prepareForSave } = useSysregStatus(formData, 'status')
 * 
 * // Display: use statusHex for v-model on select
 * <select v-model="statusHex">
 * 
 * // On save: use prepareForSave to get proper value
 * const payload = {
 *   ...formData,
 *   status: prepareForSave()
 * }
 * ```
 */
export function useSysregStatus(data: Ref<any>, fieldName: string = 'status') {
    /**
     * Computed hex value for display/binding
     * Converts Buffer to hex string
     */
    const statusHex = computed({
        get: () => {
            const value = data.value[fieldName]
            return bufferToHex(value)
        },
        set: (newHex: string | null) => {
            // Store the hex value directly (will be converted on save)
            data.value[fieldName] = newHex
        }
    })

    /**
     * Update status with hex value
     */
    function updateStatus(hex: string | null) {
        data.value[fieldName] = hex
    }

    /**
     * Prepare value for saving to database
     * Ensures proper format (hex string without prefix)
     */
    function prepareForSave(): string | null {
        const current = data.value[fieldName]

        // If it's already been converted to hex string
        if (typeof current === 'string') {
            return hexToBuffer(current)
        }

        // If it's still a Buffer object
        const hex = bufferToHex(current)
        return hexToBuffer(hex)
    }

    return {
        statusHex,
        updateStatus,
        prepareForSave
    }
}

/**
 * Sanitize status_val for API payload
 * Use this in save handlers to ensure proper format
 * 
 * Post-Migration 036: status is now INTEGER, not BYTEA.
 * This function now returns the numeric value directly.
 * 
 * @param value - The status from form data (number, Buffer, hex string, or null)
 * @returns Numeric status value or null
 */
export function sanitizeStatusVal(value: any): number | null {
    if (value === undefined || value === '' || value === null) {
        return null
    }

    // If it's already a number, return it directly
    if (typeof value === 'number') {
        return value
    }

    // If it's a hex string, parse it
    if (typeof value === 'string') {
        const cleanHex = value.replace(/^(0x|\\x)/, '')
        if (/^[0-9a-fA-F]+$/.test(cleanHex)) {
            return parseInt(cleanHex, 16)
        }
        // Try parsing as decimal
        const num = parseInt(value, 10)
        if (!isNaN(num)) {
            return num
        }
    }

    // Legacy: Handle Buffer objects (pre-Migration 036)
    const hex = bufferToHex(value)
    if (hex) {
        return parseInt(hex, 16)
    }

    return null
}

