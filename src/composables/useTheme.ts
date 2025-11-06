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

// Image dimension state (extracted from CSS variables)
const imageDimensions = ref<{
    cardWidth: number | null
    cardHeight: number | null
    tileWidth: number | null
    tileHeight: number | null
    avatarWidth: number | null
    isCorrupted: boolean
}>({
    cardWidth: null,
    cardHeight: null,
    tileWidth: null,
    tileHeight: null,
    avatarWidth: null,
    isCorrupted: false
})

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
        // Extract image dimensions from CSS variables
        extractImageDimensions()
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

    /**
     * Extract image dimension CSS variables and convert to pixels
     * Validates that all values are in rem units
     */
    const extractImageDimensions = (): void => {
        if (typeof document === 'undefined') {
            console.warn('Cannot extract image dimensions: document not available')
            return
        }

        const root = document.documentElement
        const computedStyle = getComputedStyle(root)

        // Helper to convert rem to pixels
        const remToPx = (remValue: string): number | null => {
            const match = remValue.trim().match(/^([\d.]+)rem$/)
            if (!match || !match[1]) return null

            const remNum = parseFloat(match[1])
            const fontSize = parseFloat(computedStyle.fontSize) || 16
            return remNum * fontSize
        }

        // Helper to extract and validate CSS variable
        const extractVar = (varName: string): number | null => {
            const value = computedStyle.getPropertyValue(varName).trim()
            if (!value) {
                console.error(`CSS variable ${varName} not found`)
                return null
            }

            const pxValue = remToPx(value)
            if (pxValue === null) {
                console.error(`⚠️ CORRUPTED STYLESHEET: ${varName} has value "${value}" - must be in rem units only!`)
                imageDimensions.value.isCorrupted = true
                return null
            }

            return pxValue
        }

        // Extract dimensions
        const cardWidth = extractVar('--card-width')
        const cardHeight = extractVar('--card-height')
        const tileWidth = extractVar('--tile-width')

        // Calculate tile height as 0.5 * card-height
        const tileHeight = cardHeight ? cardHeight * 0.5 : extractVar('--tile-height')

        const avatarWidth = extractVar('--avatar')

        // Update state
        imageDimensions.value = {
            cardWidth,
            cardHeight,
            tileWidth,
            tileHeight,
            avatarWidth,
            isCorrupted: imageDimensions.value.isCorrupted
        }

        // Log heavy warning if corrupted
        if (imageDimensions.value.isCorrupted) {
            console.error('🔴 CORRUPTED STYLESHEET: Always provide CSS vars for card, tile, avatar in rem only!')
        } else {
            console.log('✅ Image dimensions extracted:', {
                cardWidth: `${cardWidth}px`,
                cardHeight: `${cardHeight}px`,
                tileWidth: `${tileWidth}px`,
                tileHeight: `${tileHeight}px`,
                avatarWidth: `${avatarWidth}px`
            })
        }
    }

    /**
     * Get current image dimensions in pixels
     * Returns null values if not yet extracted or if stylesheet is corrupted
     */
    const getImageDimensions = () => {
        return {
            cardWidth: imageDimensions.value.cardWidth,
            cardHeight: imageDimensions.value.cardHeight,
            tileWidth: imageDimensions.value.tileWidth,
            tileHeight: imageDimensions.value.tileHeight,
            avatarWidth: imageDimensions.value.avatarWidth,
            isCorrupted: imageDimensions.value.isCorrupted
        }
    }

    /**
     * Computed properties for easy access to dimensions
     */
    const cardWidth = computed(() => imageDimensions.value.cardWidth)
    const cardHeight = computed(() => imageDimensions.value.cardHeight)
    const tileWidth = computed(() => imageDimensions.value.tileWidth)
    const tileHeight = computed(() => imageDimensions.value.tileHeight)
    const avatarWidth = computed(() => imageDimensions.value.avatarWidth)
    const dimensionsCorrupted = computed(() => imageDimensions.value.isCorrupted)

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

        // Image dimensions
        extractImageDimensions,
        getImageDimensions,
        cardWidth,
        cardHeight,
        tileWidth,
        tileHeight,
        avatarWidth,
        dimensionsCorrupted,

        // Helpers
        getVarsAsStyleString,
        applyVarsToDocument,
        init
    }
}
