/**
 * Post Status Composable
 * 
 * Vue composable for post status workflow UI (StatusEditor).
 * Provides status options, labels, colors, and transition logic.
 * 
 * Uses usePostPermissions for authorization checks.
 * 
 * Usage:
 * ```vue
 * const { currentStatusLabel, availableStatusOptions, transitionTo } = usePostStatus(post, project)
 * ```
 */

import { computed, ref, type Ref, type ComputedRef } from 'vue'
import { usePostPermissions, STATUS, type PostData, type ProjectData, type MembershipData } from './usePostPermissions'

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
        return post.value?.status ?? STATUS.NEW
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
            await $fetch(`/api/posts/${post.value.id}`, {
                method: 'PATCH',
                body: { status: targetStatus }
            })
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

        // Re-export permissions for convenience
        permissions
    }
}

// Re-export STATUS for consumers
export { STATUS }
