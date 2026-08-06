/**
 * Project Access Composable
 * 
 * Determines user access to a project based on:
 * - Alpha mode: projects.status_old + user relation (owner/member)
 * - Beta mode: projects.status (sysreg) + user relation + role visibility
 * 
 * Used by site routes (/sites/:domaincode/*) to control access.
 * 
 * December 2025
 */

import { ref, computed, type Ref, type ComputedRef } from 'vue'
import { useAuth } from './useAuth'
import { STATUS, lifecycleStatus } from '@/utils/status-constants'

/**
 * Project access result
 */
export interface ProjectAccessResult {
    /** Whether user can access the project */
    canAccess: ComputedRef<boolean>
    /** Whether user can edit the project */
    canEdit: ComputedRef<boolean>
    /** Whether user is project owner */
    isOwner: ComputedRef<boolean>
    /** Whether user is project member (including owner) */
    isMember: ComputedRef<boolean>
    /** Reason for access denial (if any) */
    denyReason: ComputedRef<string | null>
    /** Whether project is publicly accessible (status_old = 'public') */
    isPublic: ComputedRef<boolean>
    /** Project status_old value */
    statusOld: ComputedRef<string | null>
    /** Loading state */
    isLoading: Ref<boolean>
    /** Load project access info */
    load: (domaincode: string) => Promise<void>
}

/**
 * Project data from API (minimal fields needed for access check)
 */
interface ProjectAccessData {
    id: number
    domaincode: string
    name?: string
    heading?: string
    owner_id?: string
    owner_sysmail?: string
    status?: number
    status_old?: string | null
    _userRole?: 'owner' | 'member' | string | null
}

/**
 * Check if user is a member of the project (via project_members or owner)
 */
async function checkProjectMembership(
    projectId: number,
    userId: string | number | null
): Promise<{ isOwner: boolean; isMember: boolean }> {
    if (!userId) {
        return { isOwner: false, isMember: false }
    }

    try {
        // The project API returns _userRole if user has access
        // We already have this from the project fetch, so this is a backup
        const response = await fetch(`/api/users?project_id=${projectId}`)
        if (!response.ok) {
            return { isOwner: false, isMember: false }
        }

        const members = await response.json()
        const userIdStr = String(userId)

        // Check if user is in members list
        const userMembership = members.find((m: any) => String(m.id) === userIdStr)
        return {
            isOwner: userMembership?.role === 'owner',
            isMember: !!userMembership
        }
    } catch (error) {
        console.error('[useProjectAccess] Error checking membership:', error)
        return { isOwner: false, isMember: false }
    }
}

/**
 * Project Access Composable
 * 
 * Usage:
 * ```ts
 * const { canAccess, isOwner, load } = useProjectAccess()
 * await load('opus1')
 * if (!canAccess.value) {
 *   // Show not published view
 * }
 * ```
 */
export function useProjectAccess(): ProjectAccessResult {
    const { user, isAuthenticated } = useAuth()

    // State
    const projectData = ref<ProjectAccessData | null>(null)
    const isLoading = ref(false)
    const membershipChecked = ref(false)
    const membershipResult = ref<{ isOwner: boolean; isMember: boolean }>({ isOwner: false, isMember: false })

    // Computed: project status_old
    const statusOld = computed(() => projectData.value?.status_old || null)

    // Computed: is project publicly accessible.
    // Sysreg decides (HD 2026-08-06: project.status, NOT status_old): lifecycle
    // (masked low 17 bits) at/above RELEASED and below ARCHIVED — a raw `>= 4096`
    // would admit archived/trash and scope-toggle-inflated values.
    const isPublic = computed(() => {
        const lifecycle = lifecycleStatus(projectData.value?.status || 0)
        return lifecycle >= STATUS.RELEASED && lifecycle < STATUS.ARCHIVED
    })

    // Computed: is user owner
    const isOwner = computed(() => {
        if (!user.value || !projectData.value) return false

        // Check _userRole from API
        if (projectData.value._userRole === 'owner') return true

        // Check owner_id match
        const ownerId = projectData.value.owner_id
        if (ownerId && String(ownerId) === String(user.value.id)) return true

        // Check owner_sysmail match
        if (projectData.value.owner_sysmail && user.value.sysmail) {
            if (projectData.value.owner_sysmail === user.value.sysmail) return true
        }

        // Check from membership lookup
        return membershipResult.value.isOwner
    })

    // Computed: is user member (owner counts as member)
    const isMember = computed(() => {
        if (!user.value || !projectData.value) return false

        // Owner is also member
        if (isOwner.value) return true

        // Check _userRole from API
        if (projectData.value._userRole) return true

        // Check from membership lookup
        return membershipResult.value.isMember
    })

    // Computed: can access project.
    // The status_old alpha fork is OFF (HD 2026-08-06) — sysreg is the one road.
    const canAccess = computed(() => {
        if (!projectData.value) return false

        // Admin always has access
        if (user.value?.activeRole === 'admin') return true

        // Published projects for everyone, unpublished for members
        return isPublic.value || isMember.value
    })

    // Computed: can edit project
    const canEdit = computed(() => {
        if (!projectData.value) return false

        // Admin always can edit
        if (user.value?.activeRole === 'admin') return true

        // Owner can edit
        return isOwner.value
    })

    // Computed: deny reason — from sysreg lifecycle, not status_old
    const denyReason = computed(() => {
        if (canAccess.value) return null
        if (!projectData.value) return 'Projekt nicht gefunden'

        const lifecycle = lifecycleStatus(projectData.value.status || 0)
        if (lifecycle >= STATUS.ARCHIVED) {
            return 'Projekt ist archiviert'
        }
        if (lifecycle < STATUS.RELEASED) {
            return 'Projekt ist noch nicht veröffentlicht'
        }
        return 'Kein Zugriff auf dieses Projekt'
    })

    /**
     * Load project access information
     */
    async function load(domaincode: string): Promise<void> {
        isLoading.value = true
        membershipChecked.value = false

        try {
            // Fetch project data
            const response = await fetch(`/api/projects/${encodeURIComponent(domaincode)}`)
            if (!response.ok) {
                projectData.value = null
                return
            }

            projectData.value = await response.json()

            // If user is authenticated, check membership
            if (isAuthenticated.value && user.value && projectData.value) {
                membershipResult.value = await checkProjectMembership(
                    projectData.value.id,
                    user.value.id
                )
                membershipChecked.value = true
            }
        } catch (error) {
            console.error('[useProjectAccess] Error loading project:', error)
            projectData.value = null
        } finally {
            isLoading.value = false
        }
    }

    return {
        canAccess,
        canEdit,
        isOwner,
        isMember,
        denyReason,
        isPublic,
        statusOld,
        isLoading,
        load
    }
}
