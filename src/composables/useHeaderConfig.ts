/**
 * useHeaderConfig composable
 * 
 * Resolves header configurations for entities, with optional project-level overrides.
 * Designed for use on /sites/:domaincode/* routes where project context is available.
 * 
 * Three-layer resolution:
 * 1. Base config (Odoo type: simple, columns, banner, cover, bauchbinde)
 * 2. Subcategory (e.g., cover.dramatic, banner.compact)
 * 3. Project override (per-project customization)
 * 
 * @example
 * ```vue
 * const { resolvedConfig, isLoading } = useHeaderConfig({
 *   headerType: post.header_type,
 *   headerSubtype: post.header_subtype,
 *   projectId: route.params.projectId
 * })
 * ```
 */

import { ref, computed, watch, type Ref, type ComputedRef } from 'vue'
import { useRoute } from 'vue-router'

// Base configs matching PageHeading.vue headerTypes[] array
// These are the fallback when API is not available
const BASE_CONFIGS: Record<string, any> = {
    simple: {
        id: 0,
        name: 'simple',
        headerSize: 'mini',
        allowedSizes: [],
        isFullWidth: false,
        contentAlignY: 'center',
        imgTmpAlignX: 'center',
        imgTmpAlignY: 'center',
        backgroundCorrection: 'none',
        phoneBanner: false,
        contentInBanner: false,
        gradientType: 'none',
        gradientDepth: 1.0
    },
    columns: {
        id: 1,
        name: 'columns',
        headerSize: 'prominent',
        allowedSizes: [],
        isFullWidth: false,
        contentAlignY: 'center',
        imgTmpAlignX: 'center',
        imgTmpAlignY: 'center',
        backgroundCorrection: 'none',
        phoneBanner: false,
        contentInBanner: false,
        gradientType: 'none',
        gradientDepth: 1.0
    },
    banner: {
        id: 2,
        name: 'banner',
        headerSize: 'medium',
        allowedSizes: ['prominent', 'medium', 'mini'],
        isFullWidth: false,
        contentAlignY: 'top',
        imgTmpAlignX: 'center',
        imgTmpAlignY: 'top',
        backgroundCorrection: 1,
        phoneBanner: false,
        contentInBanner: false,
        gradientType: 'left-bottom',
        gradientDepth: 0.6
    },
    cover: {
        id: 3,
        name: 'cover',
        headerSize: 'prominent',
        allowedSizes: ['prominent', 'full'],
        isFullWidth: false,
        contentAlignY: 'bottom',
        imgTmpAlignX: 'cover',
        imgTmpAlignY: 'center',
        backgroundCorrection: 1,
        phoneBanner: true,
        contentInBanner: false,
        gradientType: 'left-bottom',
        gradientDepth: 0.6
    },
    bauchbinde: {
        id: 4,
        name: 'bauchbinde',
        headerSize: 'prominent',
        allowedSizes: ['prominent', 'full'],
        isFullWidth: true,
        contentAlignY: 'bottom',
        imgTmpAlignX: 'cover',
        imgTmpAlignY: 'center',
        backgroundCorrection: 'none',
        phoneBanner: false,
        contentType: 'left',
        contentWidth: 'fixed',
        contentInBanner: true,
        gradientType: 'none',
        gradientDepth: 1.0
    }
}

export interface HeaderConfigOptions {
    /** Base Odoo type (required) */
    headerType: Ref<string> | ComputedRef<string> | string
    /** Subcategory name e.g., 'cover.dramatic' (optional) */
    headerSubtype?: Ref<string | undefined> | ComputedRef<string | undefined> | string
    /** Project ID for overrides (optional, auto-detected from route if on /sites) */
    projectId?: Ref<number | string | undefined> | ComputedRef<number | string | undefined> | number | string
    /** Enable API resolution (default: true) */
    useApi?: boolean
}

export interface HeaderConfigResult {
    /** Fully resolved config (base → subcat → project merged) */
    resolvedConfig: ComputedRef<Record<string, any>>
    /** Whether API resolution is in progress */
    isLoading: Ref<boolean>
    /** Error message if API call failed */
    error: Ref<string | null>
    /** Metadata about resolution layers */
    meta: Ref<{
        headerType: string
        headerSubtype: string | null
        projectId: number | string | null
        layers: {
            base: boolean
            subcategory: boolean
            projectOverride: boolean
        }
    } | null>
    /** Force re-fetch from API */
    refresh: () => Promise<void>
}

// Cache for resolved configs
const configCache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

export function useHeaderConfig(options: HeaderConfigOptions): HeaderConfigResult {
    const route = useRoute()

    // Normalize reactive inputs
    const headerType = computed(() =>
        typeof options.headerType === 'string'
            ? options.headerType
            : options.headerType.value
    )

    const headerSubtype = computed(() => {
        if (!options.headerSubtype) return undefined
        return typeof options.headerSubtype === 'string'
            ? options.headerSubtype
            : options.headerSubtype.value
    })

    const projectId = computed(() => {
        // If explicitly provided, use it
        if (options.projectId !== undefined) {
            return typeof options.projectId === 'string' || typeof options.projectId === 'number'
                ? options.projectId
                : options.projectId.value
        }
        // Auto-detect from route on /sites/:domaincode/* routes
        // Note: We'd need to look up project by domaincode, so for now return undefined
        return undefined
    })

    const useApi = options.useApi ?? true

    // State
    const isLoading = ref(false)
    const error = ref<string | null>(null)
    const apiConfig = ref<Record<string, any> | null>(null)
    const meta = ref<HeaderConfigResult['meta']['value']>(null)

    // Resolved config (fallback to base if API not available)
    const resolvedConfig = computed(() => {
        // If we have API-resolved config, use it
        if (apiConfig.value) {
            return apiConfig.value
        }

        // Fallback to base config
        const baseType = headerType.value || 'simple'
        return BASE_CONFIGS[baseType] || BASE_CONFIGS.simple
    })

    // Cache key for this config combination
    const cacheKey = computed(() => {
        const type = headerType.value || 'simple'
        const subtype = headerSubtype.value || `${type}.default`
        const project = projectId.value || 'none'
        return `${type}:${subtype}:${project}`
    })

    // Fetch config from API
    async function fetchConfig() {
        const type = headerType.value
        if (!type) return

        // Check cache first
        const cached = configCache.get(cacheKey.value)
        if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
            apiConfig.value = cached.data.data
            meta.value = cached.data.meta
            return
        }

        isLoading.value = true
        error.value = null

        try {
            const params = new URLSearchParams({
                header_type: type
            })

            if (headerSubtype.value) {
                params.set('header_subtype', headerSubtype.value)
            }

            if (projectId.value) {
                params.set('project_id', String(projectId.value))
            }

            const response = await fetch(`/api/header-configs/resolve?${params}`)
            const data = await response.json()

            if (data.success) {
                apiConfig.value = data.data
                meta.value = data.meta

                // Cache the result
                configCache.set(cacheKey.value, {
                    data: { data: data.data, meta: data.meta },
                    timestamp: Date.now()
                })
            } else {
                error.value = data.error || 'Failed to resolve header config'
            }
        } catch (err) {
            console.error('[useHeaderConfig] API error:', err)
            error.value = 'Failed to fetch header config'
        } finally {
            isLoading.value = false
        }
    }

    // Watch for changes and re-fetch
    if (useApi) {
        watch(
            [headerType, headerSubtype, projectId],
            () => {
                fetchConfig()
            },
            { immediate: true }
        )
    }

    // Manual refresh
    async function refresh() {
        // Clear cache for this key
        configCache.delete(cacheKey.value)
        await fetchConfig()
    }

    return {
        resolvedConfig,
        isLoading,
        error,
        meta,
        refresh
    }
}

/**
 * Check if current route is a /sites/:domaincode/* route
 */
export function useIsSitesRoute(): ComputedRef<boolean> {
    const route = useRoute()
    return computed(() => route.path.startsWith('/sites/'))
}

/**
 * Get project context from /sites/:domaincode route
 * Returns domaincode which can be used to look up project
 */
export function useSitesProjectContext(): ComputedRef<string | null> {
    const route = useRoute()
    return computed(() => {
        if (!route.path.startsWith('/sites/')) return null
        return (route.params.domaincode as string) || null
    })
}

/**
 * Clear the config cache (useful after admin edits)
 */
export function clearHeaderConfigCache() {
    configCache.clear()
}

export default useHeaderConfig
