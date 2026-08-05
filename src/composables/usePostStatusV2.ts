/**
 * Post Status Composable v2 (Config-Driven)
 * 
 * Vue composable for post status workflow UI (StatusEditor).
 * Uses useCapabilities for CONFIG-DRIVEN authorization.
 * 
 * Dec 5, 2025 - Sunrise Talk implementation
 * Single source of truth: sysreg_config table
 */

import { computed, ref, type Ref } from 'vue'
import { useCapabilities, STATUS, type EntityData, type ProjectData, type MembershipData } from './useCapabilities'
import { lifecycleStatus } from '@/utils/status-constants'

// Re-export for compatibility
export { STATUS }
export type { EntityData as PostData, ProjectData, MembershipData }

/**
 * Scope toggle bits (17-21)
 * These control visibility independent of workflow status
 */
export const SCOPE = {
    TEAM: 1 << 17,
    LOGIN: 1 << 18,
    PROJECT: 1 << 19,
    REGIO: 1 << 20,
    PUBLIC: 1 << 21,
} as const

export interface ScopeOption {
    bit: number
    name: string
    label: string
    description: string
    icon: string
    isActive: boolean
}

const SCOPE_META: Record<number, { name: string; label: string; description: string; icon: string }> = {
    [SCOPE.TEAM]: { name: 'team', label: 'Team', description: 'Sichtbar für Teammitglieder', icon: '👥' },
    [SCOPE.LOGIN]: { name: 'login', label: 'Angemeldete', description: 'Sichtbar für angemeldete Nutzer', icon: '🔑' },
    [SCOPE.PROJECT]: { name: 'project', label: 'Projekt', description: 'Sichtbar innerhalb des Projekts', icon: '📁' },
    [SCOPE.REGIO]: { name: 'regio', label: 'Region', description: 'Sichtbar in der Region', icon: '🗺️' },
    [SCOPE.PUBLIC]: { name: 'public', label: 'Öffentlich', description: 'Öffentlich sichtbar', icon: '🌐' }
}

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
 * Transition action for StatusEditor
 */
export interface TransitionAction {
    value: number
    label: string
    color: string
    icon: string
    isPrimary: boolean
}

const STATUS_META: Record<number, { label: string; color: string; icon: string; description: string }> = {
    [STATUS.NEW]: { label: 'Neu', color: 'muted', icon: '📝', description: 'Gerade erstellt, nur für Ersteller sichtbar' },
    [STATUS.DEMO]: { label: 'Demo', color: 'secondary', icon: '👁️', description: 'Vorschau-Modus' },
    [STATUS.DRAFT]: { label: 'Entwurf', color: 'warning', icon: '✏️', description: 'In Bearbeitung, für Team sichtbar' },
    [STATUS.REVIEW]: { label: 'Review', color: 'accent', icon: '🔍', description: 'Bereit zur Prüfung' },
    [STATUS.RELEASED]: { label: 'Veröffentlicht', color: 'primary', icon: '🚀', description: 'Öffentlich sichtbar' },
    [STATUS.ARCHIVED]: { label: 'Archiviert', color: 'dimmed', icon: '📦', description: 'Nicht mehr aktiv' },
    [STATUS.TRASH]: { label: 'Papierkorb', color: 'negative', icon: '🗑️', description: 'Zum Löschen markiert' }
}

const TRANSITION_LABELS: Record<string, string> = {
    [`${STATUS.NEW}_${STATUS.DRAFT}`]: 'Als Entwurf speichern',
    [`${STATUS.DRAFT}_${STATUS.REVIEW}`]: 'Zur Prüfung einreichen',
    [`${STATUS.REVIEW}_${STATUS.RELEASED}`]: 'Freigeben',
    [`${STATUS.REVIEW}_${STATUS.DRAFT}`]: 'Zurück an Autor',
    [`${STATUS.RELEASED}_${STATUS.ARCHIVED}`]: 'Archivieren',
    [`${STATUS.DRAFT}_${STATUS.TRASH}`]: 'In Papierkorb',
    [`${STATUS.REVIEW}_${STATUS.TRASH}`]: 'In Papierkorb',
    [`${STATUS.TRASH}_${STATUS.DRAFT}`]: 'Wiederherstellen',
}

/**
 * Post status composable v2 (config-driven)
 */
export function usePostStatusV2(
    post: Ref<EntityData | null>,
    project: Ref<ProjectData>,
    membership?: Ref<MembershipData | null>
) {
    // Use config-driven capabilities
    const caps = useCapabilities('post', post, project, membership)

    // Loading/error state
    const isTransitioning = ref(false)
    const transitionError = ref<string | null>(null)

    // ============================================================
    // STATUS INFO
    // ============================================================

    // WORKFLOW_MASK was defined here as a non-exported local, which meant server code
    // could not import it and the same constant existed twice. It now comes from
    // `@/utils/status-constants` — the cv↔odoo thread's D4 makes this predicate a
    // cross-tier invariant (below 512 CV owns, at/above 512 CV caches), so it cannot
    // live inside one composable. `lifecycleStatus()` is the same masking, named.

    const currentStatus = computed(() => {
        const status = post.value?.status
        if (!status || status <= 0) return STATUS.NEW
        // Extract only workflow bits, ignore scope bits
        const workflowStatus = lifecycleStatus(status)
        return workflowStatus > 0 ? workflowStatus : STATUS.NEW
    })

    const currentStatusMeta = computed(() => {
        return STATUS_META[currentStatus.value] ?? STATUS_META[STATUS.NEW]
    })

    const currentStatusLabel = computed(() => currentStatusMeta.value.label)
    const currentStatusColor = computed(() => currentStatusMeta.value.color)
    const currentStatusIcon = computed(() => currentStatusMeta.value.icon)

    // ============================================================
    // AVAILABLE OPTIONS (config-driven)
    // ============================================================

    const availableStatusOptions = computed<StatusOption[]>(() => {
        const current = currentStatus.value
        const available = caps.availableTransitions.value

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

    const transitionActions = computed((): TransitionAction[] => {
        const current = currentStatus.value
        const available = caps.availableTransitions.value

        return available
            .filter((target: number) => target !== STATUS.TRASH)
            .map((target: number) => {
                const key = `${current}_${target}`
                const meta = STATUS_META[target] ?? { label: 'Unknown', color: 'muted', icon: '?' }
                return {
                    value: target,
                    label: TRANSITION_LABELS[key] ?? `→ ${meta.label}`,
                    color: meta.color,
                    icon: meta.icon,
                    isPrimary: caps.isPrimaryTransition(target)
                }
            })
    })

    // Separate primary and alternative transitions for UI
    const primaryTransitionActions = computed((): TransitionAction[] =>
        transitionActions.value.filter((a: TransitionAction) => a.isPrimary)
    )

    const alternativeTransitionActions = computed((): TransitionAction[] =>
        transitionActions.value.filter((a: TransitionAction) => !a.isPrimary)
    )

    const canTrash = computed(() => {
        return caps.availableTransitions.value.includes(STATUS.TRASH)
    })

    // ============================================================
    // TRANSITION HELPERS
    // ============================================================

    function getTransitionLabel(from: number, to: number): string {
        const key = `${from}_${to}`
        return TRANSITION_LABELS[key] ?? `→ ${STATUS_META[to]?.label ?? 'Unknown'}`
    }

    async function transitionTo(targetStatus: number): Promise<number | null> {
        if (!post.value) return null
        if (!caps.canTransitionTo(targetStatus)) {
            transitionError.value = 'Transition nicht erlaubt'
            return null
        }

        isTransitioning.value = true
        transitionError.value = null

        try {
            // Preserve scope bits (17-21) while changing workflow status
            const currentFull = post.value.status ?? 0
            const scopeMask = SCOPE.TEAM | SCOPE.LOGIN | SCOPE.PROJECT | SCOPE.REGIO | SCOPE.PUBLIC
            const existingScope = currentFull & scopeMask
            const newStatus = targetStatus | existingScope

            const response = await fetch(`/api/posts/${post.value.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
            if (!response.ok) {
                throw new Error('Failed to update status')
            }
            // Update local state
            post.value.status = newStatus
            // Refresh capabilities after status change
            await caps.refresh()
            return newStatus
        } catch (err: any) {
            transitionError.value = err.message ?? 'Fehler beim Statuswechsel'
            return null
        } finally {
            isTransitioning.value = false
        }
    }

    // ============================================================
    // WORKFLOW HELPERS
    // ============================================================

    const isWorkInProgress = computed(() => {
        const status = currentStatus.value
        return status === STATUS.NEW || status === STATUS.DRAFT
    })

    const isAwaitingApproval = computed(() => currentStatus.value === STATUS.REVIEW)
    const isPublished = computed(() => currentStatus.value >= STATUS.RELEASED)
    const isTrashed = computed(() => currentStatus.value === STATUS.TRASH)
    const isEditable = computed(() => caps.canEdit.value && !isTrashed.value)

    // ============================================================
    // SCOPE TOGGLES
    // ============================================================

    const currentScopeBits = computed(() => {
        const fullStatus = post.value?.status ?? 0
        const scopeMask = SCOPE.TEAM | SCOPE.LOGIN | SCOPE.PROJECT | SCOPE.REGIO | SCOPE.PUBLIC
        return fullStatus & scopeMask
    })

    const hasScope = (scopeBit: number): boolean => {
        return (currentScopeBits.value & scopeBit) !== 0
    }

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

    const toggleScope = async (scopeBit: number): Promise<number | null> => {
        if (!post.value || !caps.canEdit.value) return null

        isTransitioning.value = true
        transitionError.value = null

        try {
            const currentFull = post.value.status ?? 0
            const newStatus = (currentFull & scopeBit) !== 0
                ? currentFull & ~scopeBit
                : currentFull | scopeBit

            const response = await fetch(`/api/posts/${post.value.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })

            if (!response.ok) {
                throw new Error('Scope-Änderung fehlgeschlagen')
            }

            post.value.status = newStatus
            return newStatus
        } catch (error) {
            transitionError.value = error instanceof Error ? error.message : 'Unbekannter Fehler'
            return null
        } finally {
            isTransitioning.value = false
        }
    }

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
        primaryTransitionActions,
        alternativeTransitionActions,
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

        // Config-driven permissions (from useCapabilities)
        permissions: caps
    }
}
