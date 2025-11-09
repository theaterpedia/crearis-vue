/**
 * Migration Package System
 * 
 * Allows selective execution of migration ranges (A-E) based on environment variables.
 * This enables controlled schema updates and provides foundation for master-slave sync.
 */

export type MigrationPackage = 'A' | 'B' | 'C' | 'D' | 'E'

export const PACKAGE_RANGES: Record<MigrationPackage, { start: number; end: number }> = {
    A: { start: 0, end: 18 },    // 000-018: Setup (base schema)
    B: { start: 19, end: 20 },   // 019-020: Core-Schema (tags, status, xmlid, i18n)
    C: { start: 22, end: 29 },   // 022-029: Alpha (reserved for future features)
    D: { start: 30, end: 39 },   // 030-039: Beta (reserved for refinements)
    E: { start: 40, end: 999 },  // 040+: Final (reserved for production)
}

/**
 * Get migration range for package(s)
 */
export function getMigrationPackageRange(
    startPackage?: string,
    endPackage?: string
): { start: number; end: number } | null {
    const start = (startPackage?.toUpperCase() as MigrationPackage) || 'A'
    const end = (endPackage?.toUpperCase() as MigrationPackage) || 'E'

    if (!PACKAGE_RANGES[start] || !PACKAGE_RANGES[end]) {
        return null
    }

    return {
        start: PACKAGE_RANGES[start].start,
        end: PACKAGE_RANGES[end].end
    }
}

/**
 * Filter migrations by package range
 */
export function filterMigrationsByPackage<T extends { metadata: { id: string } }>(
    migrations: T[],
    startPackage?: string,
    endPackage?: string
): T[] {
    const range = getMigrationPackageRange(startPackage, endPackage)

    if (!range) {
        return migrations
    }

    return migrations.filter(m => {
        // Extract numeric ID from migration ID (e.g., "000" from "migration-000")
        const idMatch = m.metadata.id.match(/(\d+)/)
        if (!idMatch) return true

        const id = parseInt(idMatch[1], 10)
        return id >= range.start && id <= range.end
    })
}

/**
 * Get migration ID number from metadata ID string
 */
export function getMigrationNumber(migrationId: string): number {
    const match = migrationId.match(/(\d+)/)
    return match ? parseInt(match[1], 10) : -1
}
