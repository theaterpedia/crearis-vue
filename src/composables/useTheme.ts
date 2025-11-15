/**
 * Theme Composable
 * 
 * Provides theme management functionality:
 * - setTheme(id, scope, param): Set theme with optional scope
 * - getThemeVars(id): Get CSS variables for a specific theme
 * - getThemes(): Get all available themes
 * - currentVars(): Get CSS variables for current theme
 * - resetContext(): Clear temporary theme context
 * - setupLocalScopeWatcher(): Auto-reset on route changes (call in components)
 * 
 * Supports two types of themes:
 * - Initial theme: User's saved preference, persists across routes
 * - Context theme: Temporary theme with scope-based auto-reset
 *   - local: Auto-resets when route changes
 *   - timer: Auto-resets after specified seconds
 *   - site: Domain-based (not yet implemented)
 * 
 * Singleton pattern ensures consistent theme state across the app
 */

import { ref, computed, watch } from 'vue'
import type { Router } from 'vue-router'

// Singleton state - shared across all composable instances
const debug = false
const initialThemeId = ref<number | null>(null)
const contextThemeId = ref<number | null>(null)
const contextScope = ref<'local' | 'timer' | 'site' | null>(null)
const contextParam = ref<string | null>(null)
const contextTimerId = ref<number | null>(null)
const themesCache = ref<any[]>([])
const themeVarsCache = ref<Map<number, { vars: Record<string, string>, inverted: boolean }>>(new Map())
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

// Mobile width constants (26rem = 416px at 16px base)
export const MOBILE_WIDTH_REM = 26
export const MOBILE_WIDTH_PX = 416

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
        themeVarsCache.value.forEach((cached: { vars: Record<string, string>, inverted: boolean }) => {
            for (const key of Object.keys(cached.vars)) {
                root.style.removeProperty(key)
            }
        })
    }

    /**
     * Reset context theme and restore initial theme
     * Called automatically by timer or route watchers
     * Can also be called manually
     */
    const resetContext = (): void => {
        // Clear context state
        contextThemeId.value = null
        contextScope.value = null
        contextParam.value = null

        // Clear timer if exists
        if (contextTimerId.value) {
            clearTimeout(contextTimerId.value)
            contextTimerId.value = null
        }

        // Reapply initial theme or remove vars
        if (initialThemeId.value !== null) {
            const cached = themeVarsCache.value.get(initialThemeId.value)
            if (cached) {
                applyVarsToDocument(cached.vars)
                setInverted(cached.inverted)
            }
        } else {
            removeVarsFromDocument()
            setInverted(false)
        }
    }

    /**
     * Set the active theme
     * @param id Theme ID (0-7) or null to use site CSS
     * @param scope Scope of theme change (default: 'initial')
     *   - 'initial': Sets user's base theme preference
     *   - 'local': Temporary theme for current route (auto-resets on navigation)
     *   - 'timer': Temporary theme with timeout (auto-resets after param seconds)
     *   - 'site': Project-specific theme (not yet implemented)
     * @param param Additional parameter based on scope:
     *   - 'local': route path (auto-detected if not provided)
     *   - 'timer': seconds until auto-reset (required)
     *   - 'site': domaincode (not yet implemented)
     */
    const setTheme = async (
        id: number | null,
        scope: 'initial' | 'local' | 'timer' | 'site' = 'initial',
        param?: string | number
    ): Promise<void> => {
        // Validate site scope is not yet implemented
        if (scope === 'site') {
            throw new Error('Site scope not yet implemented')
        }

        // Clear theme
        if (id === null) {
            if (scope === 'initial') {
                initialThemeId.value = null
                // If no context theme, remove vars
                if (contextThemeId.value === null) {
                    removeVarsFromDocument()
                }
            } else {
                resetContext()
            }
            return
        }

        // Validate theme ID
        if (id < 0 || id > 7) {
            throw new Error('Theme ID must be between 0 and 7')
        }

        // Load theme vars if not cached
        if (!themeVarsCache.value.has(id)) {
            await getThemeVars(id)
        }

        // Set theme based on scope
        if (scope === 'initial') {
            initialThemeId.value = id
            // Apply vars if no context theme is active
            if (contextThemeId.value === null) {
                const cached = themeVarsCache.value.get(id)
                if (cached) {
                    applyVarsToDocument(cached.vars)
                    setInverted(cached.inverted)
                }
            }
        } else if (scope === 'local') {
            // Clear any existing timer
            if (contextTimerId.value) {
                clearTimeout(contextTimerId.value)
                contextTimerId.value = null
            }

            contextThemeId.value = id
            contextScope.value = 'local'
            // param is route path (will be set by watcher in component)
            contextParam.value = param as string || null

            // Apply theme vars and inverted state immediately
            const cached = themeVarsCache.value.get(id)
            if (cached) {
                applyVarsToDocument(cached.vars)
                setInverted(cached.inverted)
            }
        } else if (scope === 'timer') {
            // Clear any existing timer
            if (contextTimerId.value) {
                clearTimeout(contextTimerId.value)
                contextTimerId.value = null
            }

            if (!param || typeof param !== 'number') {
                throw new Error('Timer scope requires param (seconds) as number')
            }

            contextThemeId.value = id
            contextScope.value = 'timer'
            contextParam.value = String(param)

            // Apply theme vars and inverted state immediately
            const cached = themeVarsCache.value.get(id)
            if (cached) {
                applyVarsToDocument(cached.vars)
                setInverted(cached.inverted)
            }

            // Set timeout to reset context
            contextTimerId.value = window.setTimeout(() => {
                resetContext()
            }, param * 1000)
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

            // Cache the vars and inverted flag together
            themeVarsCache.value.set(id, {
                vars: data.vars,
                inverted: data.inverted || false
            })

            // Set inverted state for this theme
            setInverted(data.inverted || false)

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
     * Context theme takes precedence over initial theme
     * @returns CSS variables object or null if no theme set
     */
    const currentVars = computed((): ThemeVars | null => {
        const activeThemeId = contextThemeId.value ?? initialThemeId.value
        const cached = themeVarsCache.value.get(activeThemeId)
        return cached?.vars || null
    })

    /**
     * Get current active theme ID
     * Context theme takes precedence over initial theme
     */
    const currentTheme = computed(() => contextThemeId.value ?? initialThemeId.value)

    /**
     * Check if inverted mode is available
     * Only available when a custom theme is active (not default CSS)
     */
    const isInvertedAvailable = computed(() => {
        const activeThemeId = contextThemeId.value ?? initialThemeId.value
        return activeThemeId !== null
    })

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
            if (debug) console.log('✅ Image dimensions extracted:', {
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

    /**
     * Calculate mobile-responsive dimensions
     * Scales image to fit within mobile width while preserving aspect ratio
     */
    const calculateMobileDimensions = (width: number, height: number): { width: number; height: number } => {
        if (width <= MOBILE_WIDTH_PX) {
            // Already fits mobile width
            return { width, height }
        }

        // Scale down to mobile width
        const scale = MOBILE_WIDTH_PX / width
        return {
            width: MOBILE_WIDTH_PX,
            height: Math.round(height * scale)
        }
    }

    /**
     * Setup route watcher for local scope auto-reset
     * Call this in components that use router (e.g., in App.vue or layout)
     * @param router Vue Router instance
     */
    const setupLocalScopeWatcher = (router: Router): void => {
        watch(
            () => router.currentRoute.value.path,
            (newPath: string, oldPath: string) => {
                // Only reset if scope is local and route changed
                if (contextScope.value === 'local' && newPath !== oldPath) {
                    // Check if context was set for specific route
                    if (contextParam.value && contextParam.value !== newPath) {
                        resetContext()
                    } else if (!contextParam.value) {
                        // No specific route set, reset on any route change
                        resetContext()
                    }
                }
            }
        )
    }

    return {
        // Core functions
        setTheme,
        getThemeVars,
        getThemes,
        resetContext,
        setupLocalScopeWatcher,

        // Inverted mode
        setInverted,
        getInverted,
        toggleInverted,
        isInverted: computed(() => isInverted.value),
        isInvertedAvailable,

        // Computed state
        currentVars,
        currentTheme,

        // Context state (for debugging/advanced use)
        contextTheme: computed(() => contextThemeId.value),
        contextScope: computed(() => contextScope.value),
        initialTheme: computed(() => initialThemeId.value),

        // Image dimensions
        extractImageDimensions,
        getImageDimensions,
        cardWidth,
        cardHeight,
        tileWidth,
        tileHeight,
        avatarWidth,
        dimensionsCorrupted,
        calculateMobileDimensions,

        // Constants
        MOBILE_WIDTH_REM,
        MOBILE_WIDTH_PX,

        // Helpers
        getVarsAsStyleString,
        applyVarsToDocument,
        init
    }
}
