import { db } from '../database/init'
import type { I18nCodesTableFields } from '../types/database'

/**
 * i18n Helper Utilities
 * 
 * Backend utilities for i18n text resolution and database operations
 */

/**
 * Extract text for specific language with fallback chain
 * 
 * Fallback order: requested lang → 'de' (default) → first available
 * 
 * @param entry - i18n code entry with text JSONB
 * @param lang - Language code (de, en, cz)
 * @returns Resolved text string
 */
export function resolveI18nText(entry: I18nCodesTableFields, lang: 'de' | 'en' | 'cz'): string {
    if (!entry || !entry.text) {
        return ''
    }

    // Parse JSONB if it's a string
    const textObj = typeof entry.text === 'string' ? JSON.parse(entry.text) : entry.text

    // Try requested language
    if (textObj[lang]) {
        return textObj[lang]
    }

    // Fallback to German (default)
    if (textObj.de) {
        return textObj.de
    }

    // Fallback to first available language
    const firstKey = Object.keys(textObj)[0]
    if (firstKey) {
        return textObj[firstKey]
    }

    return ''
}

/**
 * Lookup i18n code by name, variation, and type
 * 
 * @param name - Translation key name
 * @param variation - Context variation (default: 'false')
 * @param type - Type of translation (button, nav, field, desc)
 * @returns i18n code entry or null if not found
 */
export async function lookupI18nCode(
    name: string,
    variation: string = 'false',
    type: 'button' | 'nav' | 'field' | 'desc'
): Promise<I18nCodesTableFields | null> {
    try {
        const entry = db.prepare(`
            SELECT * FROM i18n_codes 
            WHERE name = ? AND variation = ? AND type = ?
        `).get(name, variation, type) as I18nCodesTableFields | undefined

        return entry || null
    } catch (error) {
        console.error('Error looking up i18n code:', error)
        return null
    }
}

/**
 * Create default i18n code entry
 * 
 * Creates entry with German text and status 'de' (needs translation)
 * 
 * @param name - Translation key name
 * @param variation - Context variation (default: 'false')
 * @param type - Type of translation
 * @param deText - German text (default: name)
 * @returns Created i18n code entry
 */
export async function createDefaultI18nCode(
    name: string,
    variation: string = 'false',
    type: 'button' | 'nav' | 'field' | 'desc',
    deText?: string
): Promise<I18nCodesTableFields> {
    try {
        const text = {
            de: deText || name,
            en: deText || name,
            cz: deText || name
        }

        const result = db.prepare(`
            INSERT INTO i18n_codes (name, variation, type, text, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, 'de', ?, ?)
        `).run(
            name,
            variation,
            type,
            JSON.stringify(text),
            new Date().toISOString(),
            new Date().toISOString()
        )

        const created = db.prepare('SELECT * FROM i18n_codes WHERE id = (SELECT last_insert_rowid())').get() as I18nCodesTableFields

        return created
    } catch (error) {
        console.error('Error creating default i18n code:', error)
        throw error
    }
}

/**
 * Preload i18n codes for initial page load
 * 
 * Fetches button and nav types without variations (root entries only)
 * Used for composable preload logic
 * 
 * @returns Array of i18n code entries for preload
 */
export async function preloadI18nCodes(): Promise<I18nCodesTableFields[]> {
    try {
        const entries = db.prepare(`
            SELECT * FROM i18n_codes 
            WHERE type IN ('button', 'nav') AND variation = 'false'
            ORDER BY type, name
        `).all() as I18nCodesTableFields[]

        return entries
    } catch (error) {
        console.error('Error preloading i18n codes:', error)
        return []
    }
}

/**
 * Get i18n code by ID
 * 
 * @param id - i18n code ID
 * @returns i18n code entry or null if not found
 */
export async function getI18nCodeById(id: number): Promise<I18nCodesTableFields | null> {
    try {
        const entry = db.prepare('SELECT * FROM i18n_codes WHERE id = ?').get(id) as I18nCodesTableFields | undefined

        return entry || null
    } catch (error) {
        console.error('Error getting i18n code by ID:', error)
        return null
    }
}

/**
 * Get all i18n codes by type
 * 
 * @param type - Type of translation (button, nav, field, desc)
 * @param includeVariations - Include context variations (default: false)
 * @returns Array of i18n code entries
 */
export async function getI18nCodesByType(
    type: 'button' | 'nav' | 'field' | 'desc',
    includeVariations: boolean = false
): Promise<I18nCodesTableFields[]> {
    try {
        let sql = 'SELECT * FROM i18n_codes WHERE type = ?'
        const params: any[] = [type]

        if (!includeVariations) {
            sql += ' AND variation = ?'
            params.push('false')
        }

        sql += ' ORDER BY name'

        const entries = db.prepare(sql).all(...params) as I18nCodesTableFields[]

        return entries
    } catch (error) {
        console.error('Error getting i18n codes by type:', error)
        return []
    }
}

/**
 * Search i18n codes by name pattern
 * 
 * @param namePattern - Name pattern (SQL LIKE syntax)
 * @returns Array of matching i18n code entries
 */
export async function searchI18nCodes(namePattern: string): Promise<I18nCodesTableFields[]> {
    try {
        const entries = db.prepare(`
            SELECT * FROM i18n_codes 
            WHERE name LIKE ?
            ORDER BY name, type
        `).all(`%${namePattern}%`) as I18nCodesTableFields[]

        return entries
    } catch (error) {
        console.error('Error searching i18n codes:', error)
        return []
    }
}
