/**
 * Status ID to BYTEA Value Mapping
 * 
 * Maps legacy status_id (INTEGER) to new status_val (BYTEA hex strings)
 * Generated from status_depr and sysreg_status tables
 * 
 * Format: [status_id] = 'hex_value'
 */

export const STATUS_ID_TO_BYTEA: Record<number, string> = {
    // Events statuses
    1: '0000',   // events > new
    2: '0001',   // events > demo  
    3: '0002',   // events > progress
    5: '0003',   // events > publish
    6: '0004',   // events > released
    8: '0006',   // events > confirmed
    9: '0008',   // events > running
    10: '0009',  // events > passed
    11: '000c',  // events > documented
    12: '0010',  // events > trash
    13: '0020',  // events > archived
    14: '0030',  // events > linked

    // Images statuses (need to query - using placeholder values)
    // Will be populated based on actual sysreg_status entries

    // Tasks statuses
    67: '0005',  // tasks > final
}

export const BYTEA_TO_STATUS_ID: Record<string, number> = {
    // Reverse mapping for backward compatibility
    '0000': 1,   // events > new
    '0001': 2,   // events > demo
    '0002': 3,   // events > progress
    '0003': 5,   // events > publish
    '0004': 6,   // events > released
    '0006': 8,   // events > confirmed
    '0008': 9,   // events > running
    '0009': 10,  // events > passed
    '000c': 11,  // events > documented
    '0010': 12,  // events > trash
    '0020': 13,  // events > archived
    '0030': 14,  // events > linked
    '0005': 67,  // tasks > final
}

/**
 * Convert legacy status_id to BYTEA Buffer
 */
export function statusIdToBytea(statusId: number): Buffer | null {
    const hex = STATUS_ID_TO_BYTEA[statusId]
    if (!hex) return null
    return Buffer.from(hex, 'hex')
}

/**
 * Convert BYTEA Buffer to legacy status_id
 */
export function byteaToStatusId(bytea: Buffer): number | null {
    const hex = bytea.toString('hex')
    return BYTEA_TO_STATUS_ID[hex] || null
}

/**
 * Get status name from BYTEA value
 */
export function getStatusName(bytea: Buffer): string | null {
    const names: Record<string, string> = {
        '0000': 'new',
        '0001': 'demo',
        '0002': 'progress',
        '0003': 'publish',
        '0004': 'released',
        '0005': 'final',
        '0006': 'confirmed',
        '0008': 'running',
        '0009': 'passed',
        '000c': 'documented',
        '0010': 'trash',
        '0020': 'archived',
        '0030': 'linked',
    }
    const hex = bytea.toString('hex')
    return names[hex] || null
}

/**
 * Check if entity has specific status
 */
export function hasStatus(entity: { status_val?: Buffer }, statusName: string): boolean {
    if (!entity.status_val) return false
    return getStatusName(entity.status_val) === statusName
}
