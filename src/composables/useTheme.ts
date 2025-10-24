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
const currentThemeId = ref<number | null>(null)
const themesCache = ref<any[]>([])
const themeVarsCache = ref<Map<number, Record<string, string>>>(new Map())
const isInverted = ref<boolean>(false)

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
     * Helper: Remove theme CSS variables from document root
     */
    const removeVarsFromDocument = () => {
        if (typeof document === 'undefined') return

        const root = document.documentElement
        // Get all theme vars from cache and remove them
        themeVarsCache.value.forEach((vars: ThemeVars) => {
            for (const key of Object.keys(vars)) {
                root.style.removeProperty(key)
            }
        })
    }

    /**
     * Set the active theme
     * @param id Theme ID (0-7) or null to remove theme (revert to site CSS)
     */
    const setTheme = async (id: number | null): Promise<void> => {
        // If null, remove all theme vars
        if (id === null) {
            currentThemeId.value = null
            removeVarsFromDocument()
            return
        }

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

            // If theme has inverted flag, set it
            if (data.inverted === true) {
                setInverted(true)
            } else {
                setInverted(false)
            }

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
     * Check if inverted mode is available
     * Only available when a custom theme is active (not default CSS)
     */
    const isInvertedAvailable = computed(() => currentThemeId.value !== null)

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
     * Loads themes but doesn't set any by default (uses site CSS)
     */
    const init = async () => {
        await getThemes()
        // By default, no theme is active (null = site CSS)
        // Apply initial inverted state
        applyInvertedToDocument()
    }

    /**
     * Set inverted color mode
     * @param inverted Boolean indicating if colors should be inverted
     */
    const setInverted = (inverted: boolean): void => {
        isInverted.value = inverted
        applyInvertedToDocument()
    }

    /**
     * Get current inverted state
     * @returns Boolean indicating if colors are inverted
     */
    const getInverted = (): boolean => {
        return isInverted.value
    }

    /**
     * Toggle inverted color mode
     */
    const toggleInverted = (): void => {
        isInverted.value = !isInverted.value
        applyInvertedToDocument()
    }

    /**
     * Helper: Apply --color-inverted CSS variable to document root
     */
    const applyInvertedToDocument = (): void => {
        if (typeof document === 'undefined') return

        const root = document.documentElement
        root.style.setProperty('--color-inverted', isInverted.value ? '1' : '0')
    }

    return {
        // Core functions
        setTheme,
        getThemeVars,
        getThemes,

        // Inverted mode
        setInverted,
        getInverted,
        toggleInverted,
        isInverted: computed(() => isInverted.value),
        isInvertedAvailable,

        // Computed state
        currentVars,
        currentTheme,

        // Helpers
        getVarsAsStyleString,
        applyVarsToDocument,
        init
    }
}
