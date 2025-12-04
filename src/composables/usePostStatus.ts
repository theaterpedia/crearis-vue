/**
 * Post Status Composable
 * 
 * Vue composable for post status workflow UI (StatusEditor).
 * Provides status options, labels, colors, and transition logic.
 * 
 * Uses usePostPermissions for authorization checks.
 * 
 * ## i18n Integration (TODO)
 * 
 * Labels are currently hardcoded in German in:
 * - STATUS_META: Status labels and descriptions
 * - SCOPE_META: Scope toggle labels and descriptions  
 * - TRANSITION_LABELS: Workflow action labels
 * 
 * To integrate with useI18n:
 * 1. Create DB entries in i18n_codes table with type='sysreg'
 * 2. Use useI18n().getText('status_new', '', 'sysreg') pattern
 * 3. Replace hardcoded strings with computed i18n lookups
 * 
 * Usage:
 * ```vue
 * const { currentStatusLabel, availableStatusOptions, transitionTo } = usePostStatus(post, project)
 * ```
 */

import { computed, ref, type Ref, type ComputedRef } from 'vue'
import { usePostPermissions, STATUS, type PostData, type ProjectData, type MembershipData } from './usePostPermissions'

/**
 * Scope toggle bits (17-21)
 * These control visibility independent of workflow status
 */
export const SCOPE = {
    TEAM: 1 << 17,      // 131072 - visible to team members
    LOGIN: 1 << 18,     // 262144 - visible to logged-in users
    PROJECT: 1 << 19,   // 524288 - visible within project
    REGIO: 1 << 20,     // 1048576 - visible in region
    PUBLIC: 1 << 21,    // 2097152 - publicly visible
} as const

/**
 * Scope option for toggle UI
 */
export interface ScopeOption {
    bit: number
    name: string
    label: string
    description: string
    icon: string
    isActive: boolean
}

/**
 * Scope metadata
 */
const SCOPE_META: Record<number, { name: string; label: string; description: string; icon: string }> = {
    [SCOPE.TEAM]: {
        name: 'team',
        label: 'Team',
        description: 'Sichtbar für Teammitglieder',
        icon: '👥'
    },
    [SCOPE.LOGIN]: {
        name: 'login',
        label: 'Angemeldete',
        description: 'Sichtbar für angemeldete Nutzer',
        icon: '🔑'
    },
    [SCOPE.PROJECT]: {
        name: 'project',
        label: 'Projekt',
        description: 'Sichtbar innerhalb des Projekts',
        icon: '📁'
    },
    [SCOPE.REGIO]: {
        name: 'regio',
        label: 'Region',
        description: 'Sichtbar in der Region',
        icon: '🗺️'
    },
    [SCOPE.PUBLIC]: {
        name: 'public',
        label: 'Öffentlich',
        description: 'Öffentlich sichtbar',
        icon: '🌐'
    }
}

/**
 * Status option for dropdown/buttons
 */
export interface StatusOption {
    value: number
    label: string
    color: string
    icon: string
    description: string
    isCurrentStatus: boolean
    canTransition: boolean
}

/**
 * Status metadata
 */
const STATUS_META: Record<number, { label: string; color: string; icon: string; description: string }> = {
    [STATUS.NEW]: {
        label: 'Neu',
        color: 'muted',
        icon: '📝',
        description: 'Gerade erstellt, nur für Ersteller sichtbar'
    },
    [STATUS.DEMO]: {
        label: 'Demo',
        color: 'secondary',
        icon: '👁️',
        description: 'Vorschau-Modus'
    },
    [STATUS.DRAFT]: {
        label: 'Entwurf',
        color: 'warning',
        icon: '✏️',
        description: 'In Bearbeitung, für Team sichtbar'
    },
    [STATUS.REVIEW]: {
        label: 'Review',
        color: 'accent',
        icon: '🔍',
        description: 'Bereit zur Prüfung'
    },
    [STATUS.CONFIRMED]: {
        label: 'Bestätigt',
        color: 'positive',
        icon: '✅',
        description: 'Vom Owner freigegeben'
    },
    [STATUS.RELEASED]: {
        label: 'Veröffentlicht',
        color: 'primary',
        icon: '🚀',
        description: 'Öffentlich sichtbar'
    },
    [STATUS.ARCHIVED]: {
        label: 'Archiviert',
        color: 'dimmed',
        icon: '📦',
        description: 'Nicht mehr aktiv'
    },
    [STATUS.TRASH]: {
        label: 'Papierkorb',
        color: 'negative',
        icon: '🗑️',
        description: 'Zum Löschen markiert'
    }
}

/**
 * Workflow transitions with labels
 */
const TRANSITION_LABELS: Record<string, string> = {
    [`${STATUS.NEW}_${STATUS.DRAFT}`]: 'Als Entwurf speichern',
    [`${STATUS.DRAFT}_${STATUS.REVIEW}`]: 'Zur Prüfung einreichen',
    [`${STATUS.DRAFT}_${STATUS.CONFIRMED}`]: 'Direkt bestätigen',
    [`${STATUS.REVIEW}_${STATUS.CONFIRMED}`]: 'Freigeben',
    [`${STATUS.REVIEW}_${STATUS.DRAFT}`]: 'Zurück an Autor',
    [`${STATUS.CONFIRMED}_${STATUS.RELEASED}`]: 'Veröffentlichen',
    [`${STATUS.CONFIRMED}_${STATUS.REVIEW}`]: 'Erneut prüfen',
    [`${STATUS.RELEASED}_${STATUS.ARCHIVED}`]: 'Archivieren',
    [`${STATUS.RELEASED}_${STATUS.CONFIRMED}`]: 'Zurückziehen',
    [`${STATUS.ARCHIVED}_${STATUS.RELEASED}`]: 'Wieder veröffentlichen'
}

/**
 * Post status composable for StatusEditor UI
 */
export function usePostStatus(
    post: Ref<PostData | null>,
    project: Ref<ProjectData>,
    membership?: Ref<MembershipData | null>
) {
    const permissions = usePostPermissions(post, project, membership)

    // Loading state for async transitions
    const isTransitioning = ref(false)
    const transitionError = ref<string | null>(null)

    // ============================================================
    // STATUS INFO
    // ============================================================

    const currentStatus = computed(() => {
        // Treat 0, null, undefined as NEW
        const status = post.value?.status
        return (status && status > 0) ? status : STATUS.NEW
    })

    const currentStatusMeta = computed(() => {
        return STATUS_META[currentStatus.value] ?? STATUS_META[STATUS.NEW]
    })

    const currentStatusLabel = computed(() => currentStatusMeta.value.label)
    const currentStatusColor = computed(() => currentStatusMeta.value.color)
    const currentStatusIcon = computed(() => currentStatusMeta.value.icon)

    // ============================================================
    // AVAILABLE OPTIONS
    // ============================================================

    /**
     * Get all status options with transition availability
     */
    const availableStatusOptions = computed<StatusOption[]>(() => {
        const current = currentStatus.value
        const available = permissions.availableTransitions.value

        return Object.entries(STATUS_META).map(([value, meta]) => {
            const statusValue = parseInt(value)
            return {
                value: statusValue,
                label: meta.label,
                color: meta.color,
                icon: meta.icon,
                description: meta.description,
                isCurrentStatus: statusValue === current,
                canTransition: available.includes(statusValue)
            }
        }).filter(opt => opt.canTransition || opt.isCurrentStatus)
    })

    /**
     * Get transition buttons for current status
     * These are the primary actions shown in UI
     */
    const transitionActions = computed(() => {
        const current = currentStatus.value
        const available = permissions.availableTransitions.value

        return available
            .filter(target => target !== STATUS.TRASH) // Trash is separate action
            .map(target => {
                const key = `${current}_${target}`
                const meta = STATUS_META[target]
                return {
                    value: target,
                    label: TRANSITION_LABELS[key] ?? `→ ${meta.label}`,
                    color: meta.color,
                    icon: meta.icon,
                    isPrimary: isPrimaryTransition(current, target)
                }
            })
    })

    /**
     * Can move to trash?
     */
    const canTrash = computed(() => {
        return permissions.availableTransitions.value.includes(STATUS.TRASH)
    })

    // ============================================================
    // TRANSITION HELPERS
    // ============================================================

    /**
     * Determine if this is the "primary" (recommended) next action
     */
    function isPrimaryTransition(from: number, to: number): boolean {
        // Natural workflow progression
        if (from === STATUS.NEW && to === STATUS.DRAFT) return true
        if (from === STATUS.DRAFT && to === STATUS.REVIEW) return true
        if (from === STATUS.REVIEW && to === STATUS.CONFIRMED) return true
        if (from === STATUS.CONFIRMED && to === STATUS.RELEASED) return true
        return false
    }

    /**
     * Get label for a specific transition
     */
    function getTransitionLabel(from: number, to: number): string {
        const key = `${from}_${to}`
        return TRANSITION_LABELS[key] ?? `→ ${STATUS_META[to]?.label ?? 'Unknown'}`
    }

    /**
     * Perform status transition (calls API)
     */
    async function transitionTo(targetStatus: number): Promise<boolean> {
        if (!post.value) return false
        if (!permissions.canTransitionTo(targetStatus)) {
            transitionError.value = 'Transition nicht erlaubt'
            return false
        }

        isTransitioning.value = true
        transitionError.value = null

        try {
            const response = await fetch(`/api/posts/${post.value.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: targetStatus })
            })
            if (!response.ok) {
                throw new Error('Failed to update status')
            }
            return true
        } catch (err: any) {
            transitionError.value = err.message ?? 'Fehler beim Statuswechsel'
            return false
        } finally {
            isTransitioning.value = false
        }
    }

    // ============================================================
    // WORKFLOW HELPERS
    // ============================================================

    /**
     * Is this post in a "work in progress" state?
     */
    const isWorkInProgress = computed(() => {
        const status = currentStatus.value
        return status === STATUS.NEW || status === STATUS.DRAFT
    })

    /**
     * Is this post awaiting approval?
     */
    const isAwaitingApproval = computed(() => {
        return currentStatus.value === STATUS.REVIEW
    })

    /**
     * Is this post published/visible to public?
     */
    const isPublished = computed(() => {
        return currentStatus.value >= STATUS.RELEASED
    })

    // ============================================================
    // SCOPE TOGGLES
    // ============================================================

    /**
     * Get current scope bits from the full status value
     * The full status contains both workflow status (bits 0-16) and scope (bits 17-21)
     */
    const currentScopeBits = computed(() => {
        const fullStatus = post.value?.status ?? 0
        // Extract only scope bits (mask with bits 17-21)
        const scopeMask = SCOPE.TEAM | SCOPE.LOGIN | SCOPE.PROJECT | SCOPE.REGIO | SCOPE.PUBLIC
        return fullStatus & scopeMask
    })

    /**
     * Check if a specific scope is active
     */
    const hasScope = (scopeBit: number): boolean => {
        return (currentScopeBits.value & scopeBit) !== 0
    }

    /**
     * Get scope options with current state
     */
    const scopeOptions = computed<ScopeOption[]>(() => {
        return Object.entries(SCOPE_META).map(([bitStr, meta]) => {
            const bit = parseInt(bitStr)
            return {
                bit,
                name: meta.name,
                label: meta.label,
                description: meta.description,
                icon: meta.icon,
                isActive: hasScope(bit)
            }
        })
    })

    /**
     * Toggle a scope bit
     */
    const toggleScope = async (scopeBit: number): Promise<boolean> => {
        if (!post.value || !permissions.canEdit.value) {
            return false
        }

        isTransitioning.value = true
        transitionError.value = null

        try {
            const currentFull = post.value.status ?? 0
            // Toggle the scope bit
            const newStatus = (currentFull & scopeBit) !== 0
                ? currentFull & ~scopeBit  // Remove bit
                : currentFull | scopeBit   // Add bit

            const response = await fetch(`/api/posts/${post.value.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.message || 'Scope-Änderung fehlgeschlagen')
            }

            // Update local state
            post.value.status = newStatus
            return true
        } catch (error) {
            transitionError.value = error instanceof Error ? error.message : 'Unbekannter Fehler'
            return false
        } finally {
            isTransitioning.value = false
        }
    }

    /**
     * Convenience computed for common scope checks
     */
    const isTeamVisible = computed(() => hasScope(SCOPE.TEAM))
    const isLoginVisible = computed(() => hasScope(SCOPE.LOGIN))
    const isProjectVisible = computed(() => hasScope(SCOPE.PROJECT))
    const isRegioVisible = computed(() => hasScope(SCOPE.REGIO))
    const isPublicVisible = computed(() => hasScope(SCOPE.PUBLIC))

    /**
     * Is this post in trash?
     */
    const isTrashed = computed(() => {
        return currentStatus.value === STATUS.TRASH
    })

    /**
     * Can this post be edited in current state?
     */
    const isEditable = computed(() => {
        return permissions.canEdit.value && !isTrashed.value
    })

    return {
        // Status info
        currentStatus,
        currentStatusLabel,
        currentStatusColor,
        currentStatusIcon,
        currentStatusMeta,

        // Options for UI
        availableStatusOptions,
        transitionActions,
        canTrash,

        // Transition
        isTransitioning,
        transitionError,
        transitionTo,
        getTransitionLabel,

        // Workflow state helpers
        isWorkInProgress,
        isAwaitingApproval,
        isPublished,
        isTrashed,
        isEditable,

        // Scope toggles
        currentScopeBits,
        scopeOptions,
        toggleScope,
        hasScope,
        isTeamVisible,
        isLoginVisible,
        isProjectVisible,
        isRegioVisible,
        isPublicVisible,

        // Re-export permissions for convenience
        permissions
    }
}

// Re-export STATUS and SCOPE for consumers
export { STATUS, SCOPE }
