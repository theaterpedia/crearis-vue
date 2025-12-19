/**
 * Server-side Alpha Mode Utilities
 * 
 * Provides alpha mode detection and project filtering for API endpoints.
 * During alpha, filters entities by projects.status_old instead of status.
 * 
 * December 2025
 * TODO v0.5: Remove this file when migrating to full sysreg status system
 */

/**
 * Alpha status_old values
 */
export const ALPHA_STATUS_OLD = {
    NEW: 'new',
    DRAFT: 'draft',
    PUBLIC: 'public'
} as const

/**
 * Check if server is in alpha mode
 * Reads from VITE_APP_MODE environment variable
 */
export function isServerAlphaMode(): boolean {
    return process.env.VITE_APP_MODE === 'alpha'
}

/**
 * Get valid project status_old values for entity filtering
 * 
 * @param previewMode - If true, include 'draft' projects
 * @returns Array of valid status_old values for SQL IN clause
 */
export function getAlphaProjectStatuses(previewMode: boolean = false): string[] {
    if (!isServerAlphaMode()) {
        // Non-alpha: return all (filtering handled by sysreg status)
        return [ALPHA_STATUS_OLD.PUBLIC, ALPHA_STATUS_OLD.DRAFT, ALPHA_STATUS_OLD.NEW]
    }

    if (previewMode) {
        return [ALPHA_STATUS_OLD.PUBLIC, ALPHA_STATUS_OLD.DRAFT]
    }

    return [ALPHA_STATUS_OLD.PUBLIC]
}

/**
 * Build SQL WHERE clause for alpha project filtering
 * Adds a JOIN and WHERE condition to filter by projects.status_old
 * 
 * @param tableAlias - Alias of the entity table (e.g., 'p' for posts, 'e' for events)
 * @param previewMode - If true, include 'draft' projects
 * @returns SQL fragment to add to WHERE clause
 */
export function buildAlphaProjectFilter(
    tableAlias: string,
    previewMode: boolean = false
): string {
    if (!isServerAlphaMode()) {
        // Non-alpha: no additional filtering
        return ''
    }

    const statuses = getAlphaProjectStatuses(previewMode)
    const quotedStatuses = statuses.map(s => `'${s}'`).join(', ')

    // Assumes projects table is already joined as 'pr' or 'p' (projects)
    // We need to add a subquery check
    return ` AND EXISTS (
        SELECT 1 FROM projects alpha_pr 
        WHERE alpha_pr.id = ${tableAlias}.project_id 
        AND alpha_pr.status_old IN (${quotedStatuses})
    )`
}

/**
 * Check if a project is accessible based on alpha mode
 * 
 * @param statusOld - Project's status_old value
 * @param hasUserAccess - Whether user has owner/member access
 * @param previewMode - Whether preview mode is enabled
 * @returns true if project should be accessible
 */
export function isProjectAccessibleAlpha(
    statusOld: string | null | undefined,
    hasUserAccess: boolean,
    previewMode: boolean = false
): boolean {
    if (!isServerAlphaMode()) {
        return true // Non-alpha: use standard logic
    }

    const status = statusOld || ALPHA_STATUS_OLD.NEW

    // Public projects always accessible
    if (status === ALPHA_STATUS_OLD.PUBLIC) {
        return true
    }

    // Draft projects: need user access or preview mode
    if (status === ALPHA_STATUS_OLD.DRAFT) {
        return hasUserAccess || previewMode
    }

    // 'new' projects: only with user access
    return hasUserAccess
}
