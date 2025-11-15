/**
 * Centralized debug logging utility
 * 
 * In alpha/beta: Keeps logs available in production for troubleshooting
 * In stable: Can be disabled via environment variable
 * 
 * Usage:
 *   import { debug } from '@/utils/debug'
 *   debug.log('ComponentName', 'Message', data)
 *   debug.warn('ComponentName', 'Warning', data)
 *   debug.error('ComponentName', 'Error', error)
 */

// Check if we're in production and if debugging is explicitly disabled
const isProduction = import.meta.env.PROD
const debugDisabled = import.meta.env.VITE_DISABLE_DEBUG === 'true'

// In alpha state: keep logs enabled even in production unless explicitly disabled
const shouldLog = !debugDisabled

export const debug = {
    /**
     * Standard log - shows in both dev and production (alpha state)
     */
    log(component: string, message: string, ...args: any[]) {
        if (shouldLog) {
            console.log(`[${component}] ${message}`, ...args)
        }
    },

    /**
     * Warning - always shown
     */
    warn(component: string, message: string, ...args: any[]) {
        console.warn(`[${component}] ${message}`, ...args)
    },

    /**
     * Error - always shown
     */
    error(component: string, message: string, ...args: any[]) {
        console.error(`[${component}] ${message}`, ...args)
    },

    /**
     * Development only - only shows in dev mode
     */
    dev(component: string, message: string, ...args: any[]) {
        if (!isProduction) {
            console.log(`[${component}][DEV] ${message}`, ...args)
        }
    },

    /**
     * Check if component-specific debugging is enabled
     * Can be used for expensive debug operations
     */
    isEnabled(component?: string): boolean {
        if (!shouldLog) return false

        // Check for component-specific debug flags
        if (component && import.meta.env[`VITE_DEBUG_${component.toUpperCase()}`]) {
            return true
        }

        return shouldLog
    }
}

/**
 * Component-specific debug helper factory
 * 
 * Usage in component:
 *   const debug = createDebugger('ItemList')
 *   debug.log('Fetching items', { count: 10 })
 */
export function createDebugger(componentName: string) {
    return {
        log: (message: string, ...args: any[]) => debug.log(componentName, message, ...args),
        warn: (message: string, ...args: any[]) => debug.warn(componentName, message, ...args),
        error: (message: string, ...args: any[]) => debug.error(componentName, message, ...args),
        dev: (message: string, ...args: any[]) => debug.dev(componentName, message, ...args),
        isEnabled: () => debug.isEnabled(componentName)
    }
}
