/**
 * Config-driven Capabilities Composable
 * 
 * Fetches capabilities from sysreg_config via API.
 * This is the CONFIG-DRIVEN replacement for hardcoded usePostPermissions.
 * 
 * Dec 5, 2025 - Sunrise Talk implementation
 */

import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'
import { useAuth } from './useAuth'

/**
 * Status values (from sysreg bit allocation)
 */
export const STATUS = {
    NEW: 1,
    DEMO: 8,
    DRAFT: 64,
    REVIEW: 256,
    CONFIRMED: 512,
    RELEASED: 4096,
    ARCHIVED: 32768,
    TRASH: 65536
} as const

/**
 * Status value to name mapping
 */
const STATUS_TO_NAME: Record<number, string> = {
    [STATUS.NEW]: 'new',
    [STATUS.DEMO]: 'demo',
    [STATUS.DRAFT]: 'draft',
    [STATUS.REVIEW]: 'review',
    [STATUS.CONFIRMED]: 'released',  // CONFIRMED maps to released in our simplified model
    [STATUS.RELEASED]: 'released',
    [STATUS.ARCHIVED]: 'archived',
    [STATUS.TRASH]: 'trash',
}

/**
 * Status name to value mapping
 */
const NAME_TO_STATUS: Record<string, number> = {
    'new': STATUS.NEW,
    'demo': STATUS.DEMO,
    'draft': STATUS.DRAFT,
    'review': STATUS.REVIEW,
    'released': STATUS.RELEASED,
    'archived': STATUS.ARCHIVED,
    'trash': STATUS.TRASH,
}

/**
 * Entity data interface
 */
export interface EntityData {
    id: number
    creator_id?: number
    owner_id?: number  // Deprecated, use creator_id
    owner_sysmail?: string
    creator_sysmail?: string
    status: number
    project_id: number
}

/**
 * Project data interface
 */
export interface ProjectData {
    id: number
    owner_id?: number
    owner_sysmail?: string
    status: number
}

/**
 * Membership data interface
 */
export interface MembershipData {
    configrole: number
}

/**
 * Configrole values
 */
export const CONFIGROLE = {
    PARTNER: 2,
    PARTICIPANT: 4,
    MEMBER: 8
} as const

/**
 * API response type
 */
interface CapabilitiesResponse {
    entity: string
    status: string
    relation: string
    capabilities: {
        read: boolean
        update: boolean
        manage: boolean
        list: boolean
        share: boolean
    }
    transitions: string[]
}

/**
 * Determine user's relation to an entity
 */
function getRelation(
    entity: EntityData | null,
    project: ProjectData,
    membership: MembershipData | null,
    userSysmail: string | null
): string {
    if (!userSysmail) return 'anonym'

    // Check if user is record creator
    if (entity) {
        const creatorMail = entity.creator_sysmail || entity.owner_sysmail
        if (creatorMail === userSysmail) return 'creator'
    }

    // Check project ownership (treated as member with elevated perms)
    if (project.owner_sysmail === userSysmail) return 'member'

    // Check membership
    if (membership) {
        if (membership.configrole === CONFIGROLE.MEMBER) return 'member'
        if (membership.configrole === CONFIGROLE.PARTICIPANT) return 'participant'
        if (membership.configrole === CONFIGROLE.PARTNER) return 'partner'
    }

    return 'anonym'
}

/**
 * Cache for API responses
 */
const capabilitiesCache = new Map<string, CapabilitiesResponse>()

/**
 * Fetch capabilities from API with caching
 */
async function fetchCapabilities(
    entityType: string,
    status: string,
    relation: string
): Promise<CapabilitiesResponse | null> {
    const cacheKey = `${entityType}:${status}:${relation}`
    
    if (capabilitiesCache.has(cacheKey)) {
        return capabilitiesCache.get(cacheKey)!
    }

    try {
        const response = await fetch(
            `/api/sysreg/capabilities?entity=${entityType}&status=${status}&relation=${relation}`
        )
        if (!response.ok) {
            console.error('[useCapabilities] API error:', response.status)
            return null
        }
        const data = await response.json()
        capabilitiesCache.set(cacheKey, data)
        return data
    } catch (err) {
        console.error('[useCapabilities] Fetch error:', err)
        return null
    }
}

/**
 * Clear capabilities cache (call when user changes or on logout)
 */
export function clearCapabilitiesCache() {
    capabilitiesCache.clear()
}

/**
 * Config-driven capabilities composable
 * 
 * @param entityType - 'post', 'image', 'project', 'event'
 * @param entity - Reactive entity data
 * @param project - Reactive project data
 * @param membership - Optional membership data
 */
export function useCapabilities(
    entityType: 'post' | 'image' | 'project' | 'event',
    entity: Ref<EntityData | null>,
    project: Ref<ProjectData>,
    membership?: Ref<MembershipData | null>
) {
    const { user } = useAuth()

    // Reactive state
    const isLoading = ref(false)
    const error = ref<string | null>(null)
    const capabilities = ref<CapabilitiesResponse['capabilities']>({
        read: false,
        update: false,
        manage: false,
        list: false,
        share: false,
    })
    const transitions = ref<string[]>([])

    // Computed relation
    const userSysmail = computed(() => user.value?.sysmail || null)
    
    const relation = computed(() => {
        return getRelation(
            entity.value,
            project.value,
            membership?.value ?? null,
            userSysmail.value
        )
    })

    // Computed status name
    const statusName = computed(() => {
        const status = entity.value?.status ?? STATUS.NEW
        return STATUS_TO_NAME[status] ?? 'new'
    })

    // Fetch capabilities when inputs change
    async function refresh() {
        if (!entity.value && entityType !== 'project') {
            // No entity yet (create mode)
            capabilities.value = { read: false, update: false, manage: false, list: true, share: false }
            transitions.value = []
            return
        }

        isLoading.value = true
        error.value = null

        try {
            const result = await fetchCapabilities(entityType, statusName.value, relation.value)
            if (result) {
                capabilities.value = result.capabilities
                transitions.value = result.transitions
            }
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Unknown error'
        } finally {
            isLoading.value = false
        }
    }

    // Watch for changes and refresh
    watch(
        [() => entity.value?.status, relation],
        () => refresh(),
        { immediate: true }
    )

    // Computed permission checks
    const canRead = computed(() => capabilities.value.read)
    const canEdit = computed(() => capabilities.value.update)
    const canManage = computed(() => capabilities.value.manage)
    const canList = computed(() => capabilities.value.list)
    const canShare = computed(() => capabilities.value.share)

    // Available transitions as status values
    const availableTransitions = computed(() => {
        return transitions.value
            .map(name => NAME_TO_STATUS[name])
            .filter((v): v is number => v !== undefined)
    })

    // Can transition to specific status?
    function canTransitionTo(targetStatus: number): boolean {
        const targetName = STATUS_TO_NAME[targetStatus]
        return targetName ? transitions.value.includes(targetName) : false
    }

    // Check if user is record creator
    const isCreator = computed(() => relation.value === 'creator')

    // Check if user is project owner (member relation + project owner check)
    const isProjectOwner = computed(() => {
        if (!userSysmail.value) return false
        return project.value.owner_sysmail === userSysmail.value
    })

    return {
        // State
        isLoading,
        error,
        capabilities,
        transitions,
        relation,

        // Permission checks
        canRead,
        canEdit,
        canManage,
        canList,
        canShare,
        availableTransitions,
        canTransitionTo,

        // Role checks
        isCreator,
        isProjectOwner,

        // Actions
        refresh,
    }
}

/**
 * Re-export STATUS for convenience
 */
export { STATUS }
