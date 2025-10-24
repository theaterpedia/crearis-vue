import type { App } from 'vue'
import { useI18n } from '../composables/useI18n'

/**
 * i18n Plugin for Vue
 * 
 * Initializes the i18n system on app startup:
 * - Preloads button and nav translations
 * - Sets up language from localStorage or user preferences
 * - Makes i18n available globally via $i18n
 */

export interface I18nPluginOptions {
    /** Skip preload on startup (useful for testing) */
    skipPreload?: boolean
    /** Default language */
    defaultLanguage?: 'de' | 'en' | 'cz'
}

export default {
    install(app: App, options: I18nPluginOptions = {}) {
        const i18n = useI18n()

        // Set default language if provided
        if (options.defaultLanguage) {
            i18n.setLanguage(options.defaultLanguage)
        }

        // Preload translations unless explicitly skipped
        if (!options.skipPreload) {
            console.log('🌍 Initializing i18n system...')
            i18n.preload().then(() => {
                console.log('✅ i18n system ready')
            }).catch((error) => {
                console.error('❌ Failed to initialize i18n:', error)
            })
        }

        // Make i18n available globally
        app.config.globalProperties.$i18n = i18n

        // Provide i18n for injection
        app.provide('i18n', i18n)
    }
}

// Type augmentation for global properties
declare module '@vue/runtime-core' {
    export interface ComponentCustomProperties {
        $i18n: ReturnType<typeof useI18n>
    }
}
