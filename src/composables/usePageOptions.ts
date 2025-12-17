/**
 * usePageOptions - Composable for managing page layout options
 * 
 * Features:
 * - Singleton cache per domaincode for optimal performance
 * - Loads ALL page entries for a project on first access
 * - Merges: hardcoded defaults → project fields → pages table entry
 * - Fallback: variant (e.g., 'post-demo') → base type (e.g., 'post')
 * 
 * Usage:
 *   const { loadForProject, getOptions, isLoaded, hasPageEntry } = usePageOptions()
 *   await loadForProject('opus1')
 *   const { aside, footer, page } = getOptions('post', 'demo')
 */

import { ref, computed } from 'vue'

// ============================================================================
// Types
// ============================================================================

export type EntityType = 'post' | 'event' | 'project' | 'landing'

export interface AsideOptions {
    postit?: {
        enabled?: boolean
        title?: string
        content?: string
        color?: string
    }
    toc?: {
        enabled?: boolean
        title?: string
    }
    list?: {
        type?: 'posts' | 'events' | 'partners' | 'projects' | 'images' | 'none'
        header?: string
    }
    context?: {
        content?: string
    }
}

export interface FooterOptions {
    gallery?: {
        type?: 'posts' | 'events' | 'partners' | 'projects' | 'images' | 'none'
        header?: string
    }
    postit?: {
        enabled?: boolean
        title?: string
        content?: string
        color?: string
    }
    slider?: {
        type?: 'posts' | 'events' | 'partners' | 'projects' | 'images' | 'none'
        header?: string
    }
    repeat?: {
        enabled?: boolean
        title?: string
        sections?: any[]
        columns?: number
    }
    sitemap?: {
        enabled?: boolean
    }
}

export interface PageOptions {
    background?: string
    cssvars?: string
    navigation?: string
    options_ext?: Record<string, any>
}

export interface PageEntry {
    id: string
    project: number
    page_type: string
    header_type?: string
    header_size?: string
    page_options?: PageOptions
    aside_options?: AsideOptions
    footer_options?: FooterOptions
    header_options?: Record<string, any>
    page_has_content?: boolean
    aside_has_content?: boolean
    header_has_content?: boolean
    footer_has_content?: boolean
}

export interface ProjectDefaults {
    // Aside fields
    aside_toc?: string
    aside_list?: string
    aside_context?: string
    aside_postit?: any
    aside_options_ext?: any
    // Footer fields
    footer_gallery?: string
    footer_slider?: string
    footer_sitemap?: string
    footer_postit?: any
    footer_repeat?: any
    footer_options_ext?: any
    // Page fields
    page_background?: string
    page_cssvars?: string
    page_navigation?: string
    page_options_ext?: any
}

export interface ResolvedOptions {
    aside: AsideOptions
    footer: FooterOptions
    page: PageOptions
    header?: {
        type?: string
        size?: string
    }
    source: 'defaults' | 'project' | 'page-variant' | 'page-base'
}

// ============================================================================
// Singleton Cache (module-level)
// ============================================================================

interface CacheEntry {
    pages: Map<string, PageEntry>  // keyed by page_type
    projectDefaults: ProjectDefaults
    projectId: number
    loadedAt: number
}

const cache = new Map<string, CacheEntry>()
const loadingPromises = new Map<string, Promise<void>>()

// ============================================================================
// Entity-specific Defaults
// ============================================================================

const ENTITY_DEFAULTS: Record<EntityType, { aside: AsideOptions; footer: FooterOptions; page: PageOptions }> = {
    post: {
        aside: {
            toc: { enabled: true, title: 'Inhalt' },
            list: { type: 'posts', header: 'Weitere Beiträge' }
        },
        footer: {
            slider: { type: 'posts', header: 'Mehr entdecken' }
        },
        page: {}
    },
    event: {
        aside: {
            toc: { enabled: false },
            context: { content: '' }
        },
        footer: {
            gallery: { type: 'events', header: 'Weitere Veranstaltungen' }
        },
        page: {}
    },
    project: {
        aside: {
            list: { type: 'posts', header: 'Aktuelles' }
        },
        footer: {
            slider: { type: 'events', header: 'Nächste Termine' }
        },
        page: {}
    },
    landing: {
        aside: {},
        footer: {
            gallery: { type: 'events', header: 'Highlights' }
        },
        page: {}
    }
}

// ============================================================================
// Parsing Utilities
// ============================================================================

/**
 * Parse aside options from flat project fields
 */
export function parseAsideFromProject(data: ProjectDefaults): AsideOptions {
    const options: AsideOptions = {}

    // Handle postit
    if (data.aside_postit) {
        try {
            options.postit = typeof data.aside_postit === 'string'
                ? JSON.parse(data.aside_postit)
                : data.aside_postit
        } catch (e) {
            console.error('Error parsing aside_postit:', e)
        }
    }

    // Handle TOC - "none" disables it
    if (data.aside_toc !== undefined) {
        options.toc = {
            enabled: data.aside_toc !== 'none' && data.aside_toc !== '',
            title: 'Inhalt'
        }
    }

    // Handle list - "none" disables it
    if (data.aside_list !== undefined) {
        if (data.aside_list === 'none' || data.aside_list === '') {
            options.list = { type: 'none' }
        } else {
            options.list = {
                type: data.aside_list as any,
                header: `Weitere ${data.aside_list}`
            }
        }
    }

    // Handle context
    if (data.aside_context) {
        try {
            const contextData = typeof data.aside_context === 'string'
                ? JSON.parse(data.aside_context)
                : data.aside_context

            const contentString = typeof contextData === 'object' && contextData !== null
                ? contextData.content
                : contextData

            if (contentString && typeof contentString === 'string') {
                options.context = { content: contentString }
            }
        } catch (e) {
            if (typeof data.aside_context === 'string' && data.aside_context.trim()) {
                options.context = { content: data.aside_context }
            }
        }
    }

    return options
}

/**
 * Parse footer options from flat project fields
 */
export function parseFooterFromProject(data: ProjectDefaults): FooterOptions {
    const options: FooterOptions = {}

    // Handle gallery - "none" disables it
    if (data.footer_gallery !== undefined) {
        if (data.footer_gallery === 'none' || data.footer_gallery === '') {
            options.gallery = { type: 'none' }
        } else {
            options.gallery = {
                type: data.footer_gallery as any,
                header: `${data.footer_gallery} Galerie`
            }
        }
    }

    // Handle postit
    if (data.footer_postit) {
        try {
            options.postit = typeof data.footer_postit === 'string'
                ? JSON.parse(data.footer_postit)
                : data.footer_postit
        } catch (e) {
            console.error('Error parsing footer_postit:', e)
        }
    }

    // Handle slider - "none" disables it
    if (data.footer_slider !== undefined) {
        if (data.footer_slider === 'none' || data.footer_slider === '') {
            options.slider = { type: 'none' }
        } else {
            options.slider = {
                type: data.footer_slider as any,
                header: `${data.footer_slider} Slider`
            }
        }
    }

    // Handle repeat
    if (data.footer_repeat) {
        try {
            options.repeat = typeof data.footer_repeat === 'string'
                ? JSON.parse(data.footer_repeat)
                : data.footer_repeat
        } catch (e) {
            console.error('Error parsing footer_repeat:', e)
        }
    }

    // Handle sitemap
    if (data.footer_sitemap !== undefined) {
        options.sitemap = {
            enabled: data.footer_sitemap !== 'none' && data.footer_sitemap !== ''
        }
    }

    return options
}

/**
 * Parse page options from flat project fields
 */
export function parsePageFromProject(data: ProjectDefaults): PageOptions {
    const options: PageOptions = {}

    if (data.page_background) options.background = data.page_background
    if (data.page_cssvars) options.cssvars = data.page_cssvars
    if (data.page_navigation) options.navigation = data.page_navigation

    if (data.page_options_ext) {
        try {
            options.options_ext = typeof data.page_options_ext === 'string'
                ? JSON.parse(data.page_options_ext)
                : data.page_options_ext
        } catch (e) {
            console.error('Error parsing page_options_ext:', e)
        }
    }

    return options
}

/**
 * Parse xmlid to extract entity type and variant
 * Format: {domaincode}.{entity}-{variant}.{slug} or {domaincode}.{entity}.{slug}
 * Returns: { entityType: 'post', variant: 'demo' } or { entityType: 'event', variant: undefined }
 */
export function parseXmlid(xmlid: string): { entityType: EntityType; variant?: string } {
    if (!xmlid) return { entityType: 'post' }

    const parts = xmlid.split('.')
    if (parts.length < 2) return { entityType: 'post' }

    const secondSlug = parts[1] // e.g., 'post-demo' or 'post' or 'event-conference'

    // Split by hyphen to get entity and variant
    const [entity, ...variantParts] = secondSlug.split('-')
    const variant = variantParts.length > 0 ? variantParts.join('-') : undefined

    // Map entity string to EntityType
    const entityMap: Record<string, EntityType> = {
        'post': 'post',
        'event': 'event',
        'project': 'project',
        'landing': 'landing'
    }

    const entityType = entityMap[entity] || 'post'

    return { entityType, variant }
}

/**
 * Deep merge options, with later values taking precedence
 * Handles "none" as explicit disable
 */
function mergeOptions<T extends Record<string, any>>(base: T, override: Partial<T>): T {
    const result = { ...base }

    for (const key of Object.keys(override) as (keyof T)[]) {
        const overrideValue = override[key]

        if (overrideValue === undefined) continue

        // Check for "none" disable pattern
        if (typeof overrideValue === 'object' && overrideValue !== null) {
            if ('type' in overrideValue && overrideValue.type === 'none') {
                // Explicitly disabled - remove from result
                delete result[key]
                continue
            }
            if ('enabled' in overrideValue && overrideValue.enabled === false) {
                delete result[key]
                continue
            }
        }

        // Merge objects, replace primitives
        if (typeof overrideValue === 'object' && overrideValue !== null && typeof result[key] === 'object') {
            result[key] = { ...result[key], ...overrideValue }
        } else {
            result[key] = overrideValue as T[keyof T]
        }
    }

    return result
}

// ============================================================================
// Composable
// ============================================================================

export function usePageOptions() {
    const currentDomaincode = ref<string | null>(null)
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    /**
     * Check if data is loaded for a domaincode
     */
    const isLoaded = computed(() => {
        return currentDomaincode.value ? cache.has(currentDomaincode.value) : false
    })

    /**
     * Load all page entries for a project (call once on route entry)
     */
    async function loadForProject(domaincode: string): Promise<void> {
        currentDomaincode.value = domaincode

        // Already cached?
        if (cache.has(domaincode)) {
            return
        }

        // Already loading?
        if (loadingPromises.has(domaincode)) {
            return loadingPromises.get(domaincode)
        }

        // Start loading
        const loadPromise = (async () => {
            isLoading.value = true
            error.value = null

            try {
                // Load project defaults
                const projectRes = await fetch(`/api/projects/by-domaincode/${domaincode}`)
                if (!projectRes.ok) {
                    throw new Error(`Project not found: ${domaincode}`)
                }
                const project = await projectRes.json()

                // Load all pages for project
                const pagesRes = await fetch(`/api/pages/by-project?project_id=${domaincode}`)
                const pagesData = await pagesRes.json()

                // Build cache entry
                const pagesMap = new Map<string, PageEntry>()
                if (pagesData.success && pagesData.pages) {
                    for (const page of pagesData.pages) {
                        pagesMap.set(page.page_type, page)
                    }
                }

                const projectDefaults: ProjectDefaults = {
                    aside_toc: project.aside_toc,
                    aside_list: project.aside_list,
                    aside_context: project.aside_context,
                    aside_postit: project.aside_postit,
                    aside_options_ext: project.aside_options_ext,
                    footer_gallery: project.footer_gallery,
                    footer_slider: project.footer_slider,
                    footer_sitemap: project.footer_sitemap,
                    footer_postit: project.footer_postit,
                    footer_repeat: project.footer_repeat,
                    footer_options_ext: project.footer_options_ext,
                    page_background: project.page_background,
                    page_cssvars: project.page_cssvars,
                    page_navigation: project.page_navigation,
                    page_options_ext: project.page_options_ext
                }

                cache.set(domaincode, {
                    pages: pagesMap,
                    projectDefaults,
                    projectId: project.id,
                    loadedAt: Date.now()
                })

            } catch (e) {
                error.value = e instanceof Error ? e.message : 'Failed to load page options'
                console.error('usePageOptions loadForProject error:', e)
            } finally {
                isLoading.value = false
                loadingPromises.delete(domaincode)
            }
        })()

        loadingPromises.set(domaincode, loadPromise)
        return loadPromise
    }

    /**
     * Get resolved options for an entity type with optional variant
     * Falls back: variant page → base page → project defaults → hardcoded defaults
     */
    function getOptions(entityType: EntityType, variant?: string): ResolvedOptions {
        const domaincode = currentDomaincode.value
        if (!domaincode || !cache.has(domaincode)) {
            // Return hardcoded defaults if not loaded
            return {
                ...ENTITY_DEFAULTS[entityType],
                source: 'defaults'
            }
        }

        const cacheEntry = cache.get(domaincode)!
        const { pages, projectDefaults } = cacheEntry

        // Start with hardcoded defaults for entity type
        let aside = { ...ENTITY_DEFAULTS[entityType].aside }
        let footer = { ...ENTITY_DEFAULTS[entityType].footer }
        let page = { ...ENTITY_DEFAULTS[entityType].page }
        let source: ResolvedOptions['source'] = 'defaults'
        let header: { type?: string; size?: string } | undefined

        // Merge project defaults
        const projectAside = parseAsideFromProject(projectDefaults)
        const projectFooter = parseFooterFromProject(projectDefaults)
        const projectPage = parsePageFromProject(projectDefaults)

        if (Object.keys(projectAside).length > 0 || Object.keys(projectFooter).length > 0) {
            aside = mergeOptions(aside, projectAside)
            footer = mergeOptions(footer, projectFooter)
            page = mergeOptions(page, projectPage)
            source = 'project'
        }

        // Build page_type to look for
        const basePageType = entityType // 'post', 'event', 'landing', 'project'
        const variantPageType = variant ? `${entityType}-${variant}` : null

        // Try variant page first (e.g., 'post-demo')
        if (variantPageType && pages.has(variantPageType)) {
            const pageEntry = pages.get(variantPageType)!
            if (pageEntry.aside_options) {
                aside = mergeOptions(aside, pageEntry.aside_options)
            }
            if (pageEntry.footer_options) {
                footer = mergeOptions(footer, pageEntry.footer_options)
            }
            if (pageEntry.page_options) {
                page = mergeOptions(page, pageEntry.page_options)
            }
            if (pageEntry.header_type || pageEntry.header_size) {
                header = {
                    type: pageEntry.header_type,
                    size: pageEntry.header_size
                }
            }
            source = 'page-variant'
        }
        // Fall back to base page (e.g., 'post')
        else if (pages.has(basePageType)) {
            const pageEntry = pages.get(basePageType)!
            if (pageEntry.aside_options) {
                aside = mergeOptions(aside, pageEntry.aside_options)
            }
            if (pageEntry.footer_options) {
                footer = mergeOptions(footer, pageEntry.footer_options)
            }
            if (pageEntry.page_options) {
                page = mergeOptions(page, pageEntry.page_options)
            }
            if (pageEntry.header_type || pageEntry.header_size) {
                header = {
                    type: pageEntry.header_type,
                    size: pageEntry.header_size
                }
            }
            source = 'page-base'
        }

        return { aside, footer, page, header, source }
    }

    /**
     * Get options by parsing xmlid directly
     */
    function getOptionsByXmlid(xmlid: string): ResolvedOptions {
        const { entityType, variant } = parseXmlid(xmlid)
        return getOptions(entityType, variant)
    }

    /**
     * Check if a page entry exists for the given type
     */
    function hasPageEntry(pageType: string): boolean {
        const domaincode = currentDomaincode.value
        if (!domaincode || !cache.has(domaincode)) return false
        return cache.get(domaincode)!.pages.has(pageType)
    }

    /**
     * Get all page entries for current project
     */
    function getAllPageEntries(): PageEntry[] {
        const domaincode = currentDomaincode.value
        if (!domaincode || !cache.has(domaincode)) return []
        return Array.from(cache.get(domaincode)!.pages.values())
    }

    /**
     * Get project ID for current domaincode
     */
    function getProjectId(): number | null {
        const domaincode = currentDomaincode.value
        if (!domaincode || !cache.has(domaincode)) return null
        return cache.get(domaincode)!.projectId
    }

    /**
     * Invalidate cache for a domaincode (call after edits)
     */
    function invalidateCache(domaincode?: string) {
        const target = domaincode || currentDomaincode.value
        if (target) {
            cache.delete(target)
        }
    }

    /**
     * Clear entire cache
     */
    function clearCache() {
        cache.clear()
    }

    return {
        // State
        currentDomaincode,
        isLoading,
        isLoaded,
        error,

        // Actions
        loadForProject,
        getOptions,
        getOptionsByXmlid,
        hasPageEntry,
        getAllPageEntries,
        getProjectId,
        invalidateCache,
        clearCache,

        // Utilities (exported for direct use)
        parseXmlid,
        parseAsideFromProject,
        parseFooterFromProject,
        parsePageFromProject
    }
}

// ============================================================================
// Legacy exports for backward compatibility
// ============================================================================

export { parseAsideFromProject as parseAsideOptions }
export { parseFooterFromProject as parseFooterOptions }

export function hasAsideContent(options: AsideOptions): boolean {
    return !!(
        (options.postit?.enabled) ||
        (options.toc?.enabled) ||
        (options.list?.type && options.list.type !== 'none') ||
        (options.context?.content)
    )
}

export function hasFooterContent(options: FooterOptions): boolean {
    return !!(
        (options.gallery?.type && options.gallery.type !== 'none') ||
        (options.postit?.enabled) ||
        (options.slider?.type && options.slider.type !== 'none') ||
        (options.repeat?.enabled) ||
        (options.sitemap?.enabled)
    )
}
