/**
 * Composable: useEventTemplates
 * 
 * Manages event template selection, filtering, and instantiation.
 * Provides smart filtering by status, domains, topics, and CTags bit groups.
 * 
 * Use-case: Create new events from pre-configured templates with:
 * - Domain filtering (workshop, game, performance, etc.)
 * - Age group targeting (children, teens, adults)
 * - Topic filtering (democracy, environment, diversity, etc.)
 * - Template customization before creation
 */

import { ref, computed, watch, onMounted, type Ref } from 'vue'
import {
    parseByteaHex,
    hasBit,
    clearBit,
    buildCtagsByte,
    type CtagsBitGroups
} from './useSysregTags'
import { useGalleryFilters } from './useGalleryFilters'

export interface Event {
    id?: number
    name: string
    status: string | null
    config: string | null
    rtags: string | null  // bit 0 = is_template
    ctags: string | null
    ttags: string | null
    dtags: string | null
    date_begin?: string | null
    date_end?: string | null
    project_id?: number | null
    [key: string]: any
}

export interface TemplateCustomization {
    name?: string
    date_begin?: string
    date_end?: string
    project_id?: number
    // Allow overriding any field
    [key: string]: any
}

export function useEventTemplates(options?: {
    projectId?: Ref<number | null>
    showDrafts?: boolean
    autoLoad?: boolean
}) {
    const projectId = options?.projectId
    const showDrafts = options?.showDrafts ?? false
    const autoLoad = options?.autoLoad ?? true

    // Template list state
    const templates = ref<Event[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    // Selected template for customization
    const selectedTemplate = ref<Event | null>(null)

    // Initialize gallery filters for template filtering
    const {
        activeFilters,
        queryString,
        setStatusFilter,
        setCtagsAgeGroup,
        setCtagsSubjectType,
        setTopicTags,
        setDomainTags,
        clearAllFilters
    } = useGalleryFilters({
        entity: 'events',
        autoFetch: false
    })

    // Computed filtered templates (client-side if already loaded)
    const filteredTemplates = computed(() => {
        let filtered = templates.value

        // Filter by status
        if (activeFilters.value.status) {
            const statusValue = parseByteaHex(activeFilters.value.status)
            filtered = filtered.filter(t =>
                parseByteaHex(t.status) === statusValue
            )
        }

        // Filter by age group
        if (activeFilters.value.ctags_age_group !== null) {
            filtered = filtered.filter(t => {
                if (!t.ctags) return false
                const ctags = parseByteaHex(t.ctags)
                const ageGroup = (ctags >> 0) & 0x03 // bits 0-1
                return ageGroup === activeFilters.value.ctags_age_group
            })
        }

        // Filter by subject type
        if (activeFilters.value.ctags_subject_type !== null) {
            filtered = filtered.filter(t => {
                if (!t.ctags) return false
                const ctags = parseByteaHex(t.ctags)
                const subjectType = (ctags >> 2) & 0x03 // bits 2-3
                return subjectType === activeFilters.value.ctags_subject_type
            })
        }

        // Filter by topic tags (at least one must match)
        if (activeFilters.value.ttags.length > 0) {
            filtered = filtered.filter(t => {
                if (!t.ttags) return false
                const ttags = parseByteaHex(t.ttags)
                return activeFilters.value.ttags.some(bit =>
                    hasBit(t.ttags!, bit)
                )
            })
        }

        // Filter by domain tags (at least one must match)
        if (activeFilters.value.dtags.length > 0) {
            filtered = filtered.filter(t => {
                if (!t.dtags) return false
                const dtags = parseByteaHex(t.dtags)
                return activeFilters.value.dtags.some(bit =>
                    hasBit(t.dtags!, bit)
                )
            })
        }

        return filtered
    })

    // Template count by category
    const templateStats = computed(() => {
        const stats = {
            total: templates.value.length,
            byDomain: {} as Record<string, number>,
            byAgeGroup: {} as Record<number, number>,
            byStatus: {} as Record<number, number>
        }

        templates.value.forEach(t => {
            // Count by status
            const status = parseByteaHex(t.status)
            stats.byStatus[status] = (stats.byStatus[status] || 0) + 1

            // Count by age group
            if (t.ctags) {
                const ctags = parseByteaHex(t.ctags)
                const ageGroup = (ctags >> 0) & 0x03
                stats.byAgeGroup[ageGroup] = (stats.byAgeGroup[ageGroup] || 0) + 1
            }
        })

        return stats
    })

    // Fetch templates from API
    async function fetchTemplates(forceRefresh = false) {
        if (loading.value && !forceRefresh) return

        loading.value = true
        error.value = null

        try {
            // Build query params
            const params = new URLSearchParams()
            params.set('rtags_has_bit', '0') // bit 0 = is_template

            if (!showDrafts) {
                params.set('status_ne', '\\x01') // Exclude drafts
            }

            if (projectId?.value) {
                params.set('project_id', projectId.value.toString())
            }

            // Add filter params from gallery filters
            if (queryString.value) {
                const filterParams = new URLSearchParams(queryString.value)
                filterParams.forEach((value, key) => {
                    params.set(key, value)
                })
            }

            params.set('expand', 'status,tags')

            const response = await fetch(`/api/events?${params.toString()}`)

            if (!response.ok) {
                throw new Error(`Failed to fetch templates: ${response.statusText}`)
            }

            const data = await response.json()
            templates.value = Array.isArray(data) ? data : data.events || []

        } catch (err) {
            error.value = err instanceof Error ? err.message : 'Failed to fetch templates'
            console.error('Error fetching event templates:', err)
        } finally {
            loading.value = false
        }
    }

    // Select a template for customization
    function selectTemplate(template: Event) {
        selectedTemplate.value = { ...template }
    }

    // Clear template selection
    function clearSelection() {
        selectedTemplate.value = null
    }

    // Create event from template
    async function createFromTemplate(
        template: Event,
        customization: TemplateCustomization
    ): Promise<Event | null> {
        try {
            // Build new event from template
            const newEvent: Partial<Event> = {
                // Copy base fields
                name: customization.name || template.name,
                date_begin: customization.date_begin || null,
                date_end: customization.date_end || null,
                project_id: customization.project_id || projectId?.value || null,

                // Copy tag values
                ctags: template.ctags,
                ttags: template.ttags,
                dtags: template.dtags,

                // Set status to draft (0x01)
                status: '\\x01',

                // Copy config but remove template bit from rtags
                config: template.config,
                rtags: template.rtags ? clearBit(template.rtags, 0) : '\\x00',

                // Apply any additional customization
                ...customization
            }

            // Remove ID (new record)
            delete newEvent.id

            const response = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newEvent)
            })

            if (!response.ok) {
                throw new Error(`Failed to create event: ${response.statusText}`)
            }

            const created = await response.json()
            return created

        } catch (err) {
            console.error('Error creating event from template:', err)
            throw err
        }
    }

    // Create event from selected template
    async function createFromSelected(customization: TemplateCustomization) {
        if (!selectedTemplate.value) {
            throw new Error('No template selected')
        }

        const created = await createFromTemplate(selectedTemplate.value, customization)

        if (created) {
            clearSelection()
        }

        return created
    }

    // Clone template (create new template from existing)
    async function cloneTemplate(template: Event, newName?: string): Promise<Event | null> {
        try {
            const cloned: Partial<Event> = {
                ...template,
                name: newName || `${template.name} (Copy)`,
                status: '\\x01', // Draft
                id: undefined // New record
            }

            const response = await fetch('/api/events', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(cloned)
            })

            if (!response.ok) {
                throw new Error(`Failed to clone template: ${response.statusText}`)
            }

            const created = await response.json()

            // Add to templates list
            templates.value.push(created)

            return created

        } catch (err) {
            console.error('Error cloning template:', err)
            throw err
        }
    }

    // Update template
    async function updateTemplate(templateId: number, updates: Partial<Event>) {
        try {
            const response = await fetch(`/api/events/${templateId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates)
            })

            if (!response.ok) {
                throw new Error(`Failed to update template: ${response.statusText}`)
            }

            const updated = await response.json()

            // Update in local list
            const index = templates.value.findIndex(t => t.id === templateId)
            if (index > -1) {
                templates.value[index] = updated
            }

            return updated

        } catch (err) {
            console.error('Error updating template:', err)
            throw err
        }
    }

    // Delete template
    async function deleteTemplate(templateId: number) {
        const confirmed = confirm('Template löschen? Diese Aktion kann nicht rückgängig gemacht werden.')

        if (!confirmed) return false

        try {
            const response = await fetch(`/api/events/${templateId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error(`Failed to delete template: ${response.statusText}`)
            }

            // Remove from local list
            templates.value = templates.value.filter(t => t.id !== templateId)

            return true

        } catch (err) {
            console.error('Error deleting template:', err)
            throw err
        }
    }

    // Suggest templates based on project tags
    function suggestTemplatesForProject(project: { ttags?: string; dtags?: string }) {
        if (!project.ttags && !project.dtags) {
            return templates.value
        }

        // Score each template by tag overlap
        const scored = templates.value.map(template => {
            let score = 0

            // Compare TTags
            if (project.ttags && template.ttags) {
                const projectTtags = parseByteaHex(project.ttags)
                const templateTtags = parseByteaHex(template.ttags)
                // Count matching bits
                const matches = projectTtags & templateTtags
                score += countBits(matches)
            }

            // Compare DTags
            if (project.dtags && template.dtags) {
                const projectDtags = parseByteaHex(project.dtags)
                const templateDtags = parseByteaHex(template.dtags)
                // Count matching bits
                const matches = projectDtags & templateDtags
                score += countBits(matches) * 2 // Weight domain matches higher
            }

            return { template, score }
        })

        // Sort by score descending
        return scored
            .filter(s => s.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(s => s.template)
    }

    // Helper: count set bits in a number
    function countBits(n: number): number {
        let count = 0
        while (n) {
            count += n & 1
            n >>= 1
        }
        return count
    }

    // Watch for filter changes and refetch
    watch(
        () => queryString.value,
        () => {
            if (autoLoad) {
                fetchTemplates()
            }
        }
    )

    // Watch for project changes and refetch
    if (projectId) {
        watch(
            projectId,
            () => {
                if (autoLoad) {
                    fetchTemplates()
                }
            }
        )
    }

    // Auto-load on mount
    onMounted(() => {
        if (autoLoad) {
            fetchTemplates()
        }
    })

    return {
        // State
        templates,
        filteredTemplates,
        selectedTemplate,
        loading,
        error,
        templateStats,

        // Filters (from useGalleryFilters)
        activeFilters,
        queryString,
        setStatusFilter,
        setCtagsAgeGroup,
        setCtagsSubjectType,
        setTopicTags,
        setDomainTags,
        clearAllFilters,

        // Actions
        fetchTemplates,
        selectTemplate,
        clearSelection,
        createFromTemplate,
        createFromSelected,
        cloneTemplate,
        updateTemplate,
        deleteTemplate,
        suggestTemplatesForProject
    }
}
