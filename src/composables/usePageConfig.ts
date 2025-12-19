/**
 * usePageConfig - Composable for page configuration management
 * 
 * Handles loading/saving page options from either:
 * - 'project' mode: Flattened fields in projects table (site-wide defaults)
 * - 'pages' mode: JSONB fields in pages table (page_type templates)
 * 
 * Preview Toggles (session-only, not persisted):
 * - previewEntities: Shows draft/confirmed entities (status < 4096)
 * - previewProjects: Shows entities from draft/confirmed projects
 * 
 * Usage:
 *   const config = usePageConfig(projectId, 'project')
 *   // or
 *   const config = usePageConfig(projectId, 'pages', 'post-demo')
 *   
 *   await config.load()
 *   config.pageOptions.value.page_background = '#fff'
 *   await config.save()
 */

import { ref, computed } from 'vue'

// ============================================================================
// Types
// ============================================================================

export interface PageOptionsData {
    page_background?: string
    page_cssvars?: string
    page_navigation?: string
    page_options_ext?: Record<string, any>
}

export interface HeaderOptionsData {
    header_alert?: string
    header_postit?: Record<string, any>
    header_options_ext?: Record<string, any>
}

export interface AsideOptionsData {
    aside_toc?: string
    aside_list?: string
    aside_context?: string
    aside_postit?: Record<string, any>
    aside_options_ext?: Record<string, any>
}

export interface FooterOptionsData {
    footer_gallery?: string
    footer_slider?: string
    footer_sitemap?: string
    footer_postit?: Record<string, any>
    footer_repeat?: Record<string, any>
    footer_options_ext?: Record<string, any>
}

export interface HasContentFlags {
    page: boolean
    header: boolean
    aside: boolean
    footer: boolean
}

export type ConfigMode = 'project' | 'pages'

// ============================================================================
// Status Constants (from sysreg)
// ============================================================================

export const STATUS = {
    DRAFT: 64,
    CONFIRMED: 512,
    RELEASED: 4096,
    ARCHIVED: 32768,
    TRASH: 65536
} as const

/**
 * Get status filter for preview mode
 * - If preview=true: show draft (64) and above (excludes trash/archived)
 * - If preview=false: show only released (4096) and above
 */
export function getStatusFilter(previewEnabled: boolean): { statusGt?: number; statusLt?: number } {
    if (previewEnabled) {
        // Show draft, confirmed, released (64 <= status < 32768)
        return { statusGt: 63, statusLt: 32768 }
    }
    // Show only released (4096 <= status < 32768)
    return { statusGt: 4095, statusLt: 32768 }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Safely parse JSON field - handles string, object, null, undefined
 */
export function parseJsonField<T = Record<string, any>>(value: any, fallback: T = {} as T): T {
    if (value === null || value === undefined) return fallback
    if (typeof value === 'string') {
        try {
            return JSON.parse(value) || fallback
        } catch {
            return fallback
        }
    }
    return value as T
}

/**
 * Deep clone an object (simple JSON-based)
 */
function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj))
}

// ============================================================================
// Composable
// ============================================================================

export function usePageConfig(
    project: number | string,
    mode: ConfigMode = 'project',
    pageType?: string
) {
    // Reactive state
    const pageOptions = ref<PageOptionsData>({})
    const headerOptions = ref<HeaderOptionsData>({})
    const asideOptions = ref<AsideOptionsData>({})
    const footerOptions = ref<FooterOptionsData>({})

    const hasContent = ref<HasContentFlags>({
        page: false,
        header: false,
        aside: false,
        footer: false
    })

    const isLoading = ref(false)
    const isSaving = ref(false)
    const error = ref<string | null>(null)

    // Original snapshot for dirty checking
    const originalSnapshot = ref<string | null>(null)

    // Computed
    const isDirty = computed(() => {
        if (!originalSnapshot.value) return false
        const current = JSON.stringify({
            page: pageOptions.value,
            header: headerOptions.value,
            aside: asideOptions.value,
            footer: footerOptions.value
        })
        return current !== originalSnapshot.value
    })

    // ========================================================================
    // Load Logic
    // ========================================================================

    async function load(): Promise<void> {
        isLoading.value = true
        error.value = null

        try {
            if (mode === 'project') {
                await loadFromProject()
            } else {
                await loadFromPages()
            }

            // Store snapshot for dirty checking
            originalSnapshot.value = JSON.stringify({
                page: pageOptions.value,
                header: headerOptions.value,
                aside: asideOptions.value,
                footer: footerOptions.value
            })
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to load configuration'
            console.error('[usePageConfig] Load error:', err)
        } finally {
            isLoading.value = false
        }
    }

    async function loadFromProject(): Promise<void> {
        const response = await fetch(`/api/projects/${project}`)
        if (!response.ok) throw new Error('Failed to load project')

        const data = await response.json()

        // Map flattened project fields to panel data
        pageOptions.value = {
            page_background: data.page_background || '',
            page_cssvars: data.page_cssvars || '',
            page_navigation: data.page_navigation || '',
            page_options_ext: parseJsonField(data.page_options_ext)
        }

        headerOptions.value = {
            header_alert: data.header_alert || '',
            header_postit: parseJsonField(data.header_postit),
            header_options_ext: parseJsonField(data.header_options_ext)
        }

        asideOptions.value = {
            aside_toc: data.aside_toc || '',
            aside_list: data.aside_list || '',
            aside_context: data.aside_context || '',
            aside_postit: parseJsonField(data.aside_postit),
            aside_options_ext: parseJsonField(data.aside_options_ext)
        }

        footerOptions.value = {
            footer_gallery: data.footer_gallery || '',
            footer_slider: data.footer_slider || '',
            footer_sitemap: data.footer_sitemap || '',
            footer_postit: parseJsonField(data.footer_postit),
            footer_repeat: parseJsonField(data.footer_repeat),
            footer_options_ext: parseJsonField(data.footer_options_ext)
        }

        hasContent.value = {
            page: !!data.page_has_content,
            header: !!data.header_has_content,
            aside: !!data.aside_has_content,
            footer: !!data.footer_has_content
        }
    }

    async function loadFromPages(): Promise<void> {
        const response = await fetch(`/api/pages/by-type?project_id=${project}&page_type=${pageType}`)

        let page: any

        if (!response.ok) {
            // Page doesn't exist - create it
            const createResponse = await fetch('/api/pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    project_id: project,
                    page_type: pageType
                })
            })
            if (!createResponse.ok) throw new Error('Failed to create page')
            const createData = await createResponse.json()
            page = createData.page
        } else {
            const data = await response.json()
            page = data.page
        }

        // Unpack JSONB fields
        pageOptions.value = parseJsonField(page.page_options)
        headerOptions.value = parseJsonField(page.header_options)
        asideOptions.value = parseJsonField(page.aside_options)
        footerOptions.value = parseJsonField(page.footer_options)

        hasContent.value = {
            page: !!page.page_has_content,
            header: !!page.header_has_content,
            aside: !!page.aside_has_content,
            footer: !!page.footer_has_content
        }
    }

    // ========================================================================
    // Save Logic
    // ========================================================================

    async function save(): Promise<boolean> {
        isSaving.value = true
        error.value = null

        try {
            if (mode === 'project') {
                await saveToProject()
            } else {
                await saveToPages()
            }

            // Update snapshot
            originalSnapshot.value = JSON.stringify({
                page: pageOptions.value,
                header: headerOptions.value,
                aside: asideOptions.value,
                footer: footerOptions.value
            })

            return true
        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to save configuration'
            console.error('[usePageConfig] Save error:', err)
            return false
        } finally {
            isSaving.value = false
        }
    }

    async function saveToProject(): Promise<void> {
        const response = await fetch(`/api/projects/${project}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                // Page options (flattened)
                page_background: pageOptions.value.page_background,
                page_cssvars: pageOptions.value.page_cssvars,
                page_navigation: pageOptions.value.page_navigation,
                page_options_ext: pageOptions.value.page_options_ext,
                // Header options (flattened)
                header_alert: headerOptions.value.header_alert,
                header_postit: headerOptions.value.header_postit,
                header_options_ext: headerOptions.value.header_options_ext,
                // Aside options (flattened)
                aside_toc: asideOptions.value.aside_toc,
                aside_list: asideOptions.value.aside_list,
                aside_context: asideOptions.value.aside_context,
                aside_postit: asideOptions.value.aside_postit,
                aside_options_ext: asideOptions.value.aside_options_ext,
                // Footer options (flattened)
                footer_gallery: footerOptions.value.footer_gallery,
                footer_slider: footerOptions.value.footer_slider,
                footer_sitemap: footerOptions.value.footer_sitemap,
                footer_postit: footerOptions.value.footer_postit,
                footer_repeat: footerOptions.value.footer_repeat,
                footer_options_ext: footerOptions.value.footer_options_ext
            })
        })

        if (!response.ok) throw new Error('Failed to save project configuration')
    }

    async function saveToPages(): Promise<void> {
        // Get page ID first
        const getResponse = await fetch(`/api/pages/by-type?project_id=${project}&page_type=${pageType}`)
        if (!getResponse.ok) throw new Error('Page not found')

        const getData = await getResponse.json()
        const pageId = getData.page.id

        const response = await fetch(`/api/pages/${pageId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                page_options: pageOptions.value,
                header_options: headerOptions.value,
                aside_options: asideOptions.value,
                footer_options: footerOptions.value
            })
        })

        if (!response.ok) throw new Error('Failed to save page configuration')
    }

    // ========================================================================
    // Cancel / Reset
    // ========================================================================

    function cancel(): void {
        if (!originalSnapshot.value) return

        const original = JSON.parse(originalSnapshot.value)
        pageOptions.value = deepClone(original.page)
        headerOptions.value = deepClone(original.header)
        asideOptions.value = deepClone(original.aside)
        footerOptions.value = deepClone(original.footer)
    }

    // ========================================================================
    // Return API
    // ========================================================================

    return {
        // Reactive data
        pageOptions,
        headerOptions,
        asideOptions,
        footerOptions,
        hasContent,

        // State
        isLoading,
        isSaving,
        isDirty,
        error,

        // Actions
        load,
        save,
        cancel
    }
}
