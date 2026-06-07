/**
 * Alpha Mode Composable
 * 
 * Detects alpha mode from VITE_APP_MODE environment variable.
 * During alpha, the system uses projects.status_old field for access control
 * instead of the new sysreg-based status system.
 * 
 * Status_old values (alpha only):
 * - 'new': Project not yet activated (ignore, same as no access)
 * - 'draft': Project activated, visible to owners/members only
 * - 'public': Project published, visible to everyone
 * 
 * This will be removed in v0.5 when the full status system is implemented.
 * 
 * December 2025
 */

import { computed, type ComputedRef } from 'vue'

/**
 * Alpha mode status_old values
 */
export const ALPHA_STATUS_OLD = {
    NEW: 'new',
    DRAFT: 'draft',
    PUBLIC: 'public'
} as const

export type AlphaStatusOld = typeof ALPHA_STATUS_OLD[keyof typeof ALPHA_STATUS_OLD]

/**
 * Check if application is in alpha mode
 * Alpha mode is detected from VITE_APP_MODE environment variable
 */
export function isAlphaMode(): boolean {
    return import.meta.env.VITE_APP_MODE === 'alpha'
}

/**
 * Alpha mode composable
 * Provides reactive access to alpha mode state and helper functions
 */
export function useAlphaMode() {
    /**
     * Whether the app is in alpha mode
     */
    const isAlpha = computed(() => isAlphaMode())

    /**
     * Check if a project is accessible based on status_old (alpha mode only)
     * 
     * @param statusOld - The project's status_old value
     * @param hasProjectAccess - Whether user has owner/member access to project
     * @param previewMode - Whether preview mode is enabled (shows draft projects)
     * @returns true if project should be accessible
     */
    function isProjectAccessible(
        statusOld: string | null | undefined,
        hasProjectAccess: boolean,
        previewMode: boolean = false
    ): boolean {
        if (!isAlphaMode()) {
            // Non-alpha: use standard sysreg status logic (not implemented here)
            return true
        }

        // Alpha mode: check status_old
        const status = statusOld || ALPHA_STATUS_OLD.NEW

        // Public projects are always accessible
        if (status === ALPHA_STATUS_OLD.PUBLIC) {
            return true
        }

        // Draft projects accessible to owners/members (or if preview mode)
        if (status === ALPHA_STATUS_OLD.DRAFT) {
            return hasProjectAccess || previewMode
        }

        // 'new' projects only accessible to owners/members
        return hasProjectAccess
    }

    /**
     * Check if a project should show content (posts/events)
     * During alpha, filters based on status_old
     * 
     * @param projectStatusOld - The project's status_old value
     * @param previewMode - Whether preview mode is enabled
     * @returns true if project content should be shown
     */
    function shouldShowProjectContent(
        projectStatusOld: string | null | undefined,
        previewMode: boolean = false
    ): boolean {
        if (!isAlphaMode()) {
            return true // Non-alpha: handled by sysreg status
        }

        const status = projectStatusOld || ALPHA_STATUS_OLD.NEW

        // Always show public projects
        if (status === ALPHA_STATUS_OLD.PUBLIC) {
            return true
        }

        // Show draft projects only in preview mode
        if (status === ALPHA_STATUS_OLD.DRAFT) {
            return previewMode
        }

        // Never show 'new' projects in content lists
        return false
    }

    /**
     * Get valid status_old values for entity filtering
     * Used by API endpoints to filter entities by project status
     * 
     * @param previewMode - Whether preview mode is enabled
     * @returns Array of valid status_old values
     */
    function getValidProjectStatuses(previewMode: boolean = false): AlphaStatusOld[] {
        if (!isAlphaMode()) {
            return [ALPHA_STATUS_OLD.PUBLIC, ALPHA_STATUS_OLD.DRAFT, ALPHA_STATUS_OLD.NEW]
        }

        if (previewMode) {
            // Preview: show public + draft
            return [ALPHA_STATUS_OLD.PUBLIC, ALPHA_STATUS_OLD.DRAFT]
        }

        // Default: only public
        return [ALPHA_STATUS_OLD.PUBLIC]
    }

    return {
        isAlpha,
        isProjectAccessible,
        shouldShowProjectContent,
        getValidProjectStatuses,
        ALPHA_STATUS_OLD
    }
}

/**
 * Server-side alpha mode check
 * For use in API endpoints
 */
export function isServerAlphaMode(): boolean {
    // Server-side: check from process.env (Nitro runtime config)
    return process.env.VITE_APP_MODE === 'alpha'
}
