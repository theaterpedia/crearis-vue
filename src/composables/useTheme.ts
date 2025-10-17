/**
 * Theme Composable
 * 
 * Provides theme management functionality:
 * - setTheme(id): Set the current theme
 * - getThemeVars(id): Get CSS variables for a specific theme
 * - getThemes(): Get all available themes
 * - currentVars(): Get CSS variables for current theme
 * 
 * Singleton pattern ensures consistent theme state across the app
 */

import { ref, computed } from 'vue'

// Singleton state - shared across all composable instances
const currentThemeId = ref<number>(0)
const themesCache = ref<any[]>([])
const themeVarsCache = ref<Map<number, Record<string, string>>>(new Map())

export interface Theme {
    id: number
    name: string
    description: string
    cimg: string
}

export interface ThemeVars {
    [key: string]: string
}

export function useTheme() {
    /**
     * Set the active theme
     * @param id Theme ID (0-7)
     */
    const setTheme = async (id: number): Promise<void> => {
        if (id < 0 || id > 7) {
            throw new Error('Theme ID must be between 0 and 7')
        }

        // Load theme vars if not cached
        if (!themeVarsCache.value.has(id)) {
            await getThemeVars(id)
        }

        currentThemeId.value = id

        // Apply theme to document root
        const vars = themeVarsCache.value.get(id)
        if (vars) {
            applyVarsToDocument(vars)
        }
    }

    /**
     * Get CSS variables for a specific theme
     * @param id Theme ID
     * @returns Promise resolving to CSS variables object
     */
    const getThemeVars = async (id: number): Promise<ThemeVars> => {
        // Check cache first
        if (themeVarsCache.value.has(id)) {
            return themeVarsCache.value.get(id)!
        }

        try {
            const response = await fetch(`/api/themes/${id}`)
            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error || 'Failed to load theme')
            }

            // Cache the vars
            themeVarsCache.value.set(id, data.vars)

            return data.vars
        } catch (error) {
            console.error(`Failed to load theme ${id}:`, error)
            throw error
        }
    }

    /**
     * Get all available themes
     * @returns Promise resolving to array of themes
     */
    const getThemes = async (): Promise<Theme[]> => {
        // Return cached if available
        if (themesCache.value.length > 0) {
            return themesCache.value
        }

        try {
            const response = await fetch('/api/themes')
            const data = await response.json()

            if (!data.success) {
                throw new Error(data.error || 'Failed to load themes')
            }

            // Cache themes
            themesCache.value = data.themes

            return data.themes
        } catch (error) {
            console.error('Failed to load themes:', error)
            throw error
        }
    }

    /**
     * Get CSS variables for the current active theme
     * @returns CSS variables object or null if no theme set
     */
    const currentVars = computed((): ThemeVars | null => {
        return themeVarsCache.value.get(currentThemeId.value) || null
    })

    /**
     * Get current theme ID
     */
    const currentTheme = computed(() => currentThemeId.value)

    /**
     * Helper: Apply CSS variables to document root
     */
    const applyVarsToDocument = (vars: ThemeVars) => {
        if (typeof document === 'undefined') return

        const root = document.documentElement
        for (const [key, value] of Object.entries(vars)) {
            root.style.setProperty(key, value)
        }
    }

    /**
     * Helper: Get CSS variable string for style attribute
     * Useful for SSR or component-level styling
     */
    const getVarsAsStyleString = (vars: ThemeVars): string => {
        return Object.entries(vars)
            .map(([key, value]) => `${key}: ${value}`)
            .join('; ')
    }

    /**
     * Initialize theme system
     * Loads themes and sets default theme if none is set
     */
    const init = async () => {
        await getThemes()

        // Set default theme if not already set
        if (currentThemeId.value === 0 && !themeVarsCache.value.has(0)) {
            await setTheme(0)
        }
    }

    return {
        // Core functions
        setTheme,
        getThemeVars,
        getThemes,

        // Computed state
        currentVars,
        currentTheme,

        // Helpers
        getVarsAsStyleString,
        applyVarsToDocument,
        init
    }
}
