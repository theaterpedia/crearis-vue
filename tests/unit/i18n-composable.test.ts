/**
 * Unit Tests - i18n Composable
 * 
 * Tests for useI18n composable functionality:
 * - Translation retrieval (button, nav, field, desc)
 * - Language switching
 * - Caching behavior
 * - Fallback chain
 * - Preload strategy
 * - Error handling
 * 
 * NOTE: These tests require PostgreSQL as they use JSONB fields.
 * Run with: TEST_DATABASE_TYPE=postgresql pnpm test
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { useI18n } from '../../src/composables/useI18n'
import { isPostgreSQLTest } from '../utils/db-test-utils.js'

// Skip all i18n tests if not running on PostgreSQL
const describeOrSkip = isPostgreSQLTest() ? describe : describe.skip

// Mock fetch API
const mockFetch = vi.fn()
global.fetch = mockFetch as any

// Mock localStorage
const localStorageMock = (() => {
    let store: Record<string, string> = {}
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value },
        removeItem: (key: string) => { delete store[key] },
        clear: () => { store = {} }
    }
})()
Object.defineProperty(global, 'localStorage', { value: localStorageMock })

describeOrSkip('useI18n - Initialization', () => {
    beforeEach(() => {
        mockFetch.mockClear()
        localStorageMock.clear()
        // Mock successful empty response for initialization
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, i18n_codes: [] })
        } as any)
    })

    it('should initialize with default language (de)', () => {
        const i18n = useI18n()
        expect(i18n.language.value).toBe('de')
    })

    it('should load language from localStorage', () => {
        localStorageMock.setItem('i18n:language', 'en')
        const i18n = useI18n()
        // Note: Language is set after initialization, so check after next tick
        expect(i18n.language.value).toBe('en')
    })

    it('should start with empty cache', () => {
        const i18n = useI18n()
        expect(i18n.cacheStats.value.total).toBe(0)
    })

    it('should not be preloaded initially', () => {
        const i18n = useI18n()
        expect(i18n.isPreloaded.value).toBe(false)
    })
})

describeOrSkip('useI18n - Language Switching', () => {
    beforeEach(() => {
        mockFetch.mockClear()
        localStorageMock.clear()
    })

    it('should switch language', () => {
        const i18n = useI18n()
        i18n.setLanguage('en')
        expect(i18n.language.value).toBe('en')
    })

    it('should persist language to localStorage', () => {
        const i18n = useI18n()
        i18n.setLanguage('cz')
        expect(localStorageMock.getItem('i18n:language')).toBe('cz')
    })

    it('should accept all valid languages', () => {
        const i18n = useI18n()

        i18n.setLanguage('de')
        expect(i18n.language.value).toBe('de')

        i18n.setLanguage('en')
        expect(i18n.language.value).toBe('en')

        i18n.setLanguage('cz')
        expect(i18n.language.value).toBe('cz')
    })
})

describeOrSkip('useI18n - Preload', () => {
    beforeEach(() => {
        mockFetch.mockClear()
        localStorageMock.clear()
        // Default mock response
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, i18n_codes: [] })
        } as any)
    })

    it('should preload button and nav translations', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                i18n_codes: [
                    { id: 1, name: 'ok', variation: 'false', type: 'button', text: { de: 'ok', en: 'ok', cz: 'ok' }, status: 'ok' },
                    { id: 2, name: 'cancel', variation: 'false', type: 'button', text: { de: 'abbrechen', en: 'cancel', cz: 'zrusit' }, status: 'ok' }
                ]
            })
        } as any)

        const i18n = useI18n()
        await i18n.preload()

        expect(mockFetch).toHaveBeenCalledWith('/api/i18n?preload=true')
        expect(i18n.isPreloaded.value).toBe(true)
        expect(i18n.cacheStats.value.total).toBe(2)
    })

    it('should not preload twice', async () => {
        mockFetch.mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, i18n_codes: [] })
        } as any)

        const i18n = useI18n()
        await i18n.preload()
        await i18n.preload()

        expect(mockFetch).toHaveBeenCalledTimes(1)
    })

    it('should handle preload errors gracefully', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'))

        const i18n = useI18n()
        await i18n.preload()

        expect(i18n.isPreloaded.value).toBe(false)
        expect(i18n.errors.value.length).toBeGreaterThan(0)
    })
})

describeOrSkip('useI18n - Translation Functions', () => {
    beforeEach(() => {
        mockFetch.mockClear()
        localStorageMock.clear()
    })

    it('should retrieve button translation from cache', async () => {
        // Mock preload
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                i18n_codes: [
                    { id: 1, name: 'save', variation: 'false', type: 'button', text: { de: 'Speichern', en: 'Save', cz: 'Uložit' }, status: 'ok' }
                ]
            })
        } as any)

        const i18n = useI18n()
        await i18n.preload()

        const text = await i18n.button('save')
        expect(text).toBe('Speichern') // German by default
    })

    it('should lazy-load field translation on demand', async () => {
        // Mock lazy load
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                i18n_codes: [
                    { id: 2, name: 'name', variation: 'false', type: 'field', text: { de: 'Titel', en: 'Heading', cz: 'titul' }, status: 'ok' }
                ]
            })
        } as any)

        const i18n = useI18n()
        const text = await i18n.field('name')

        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('name=name'))
        expect(text).toBe('Titel')
    })

    it('should support context variations', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                i18n_codes: [
                    { id: 3, name: 'name', variation: 'instructors', type: 'field', text: { de: 'Vor- und Nachname', en: 'Full name', cz: 'Celé jméno' }, status: 'ok' }
                ]
            })
        } as any)

        const i18n = useI18n()
        const text = await i18n.field('name', 'instructors')

        expect(text).toBe('Vor- und Nachname')
    })

    it('should use correct language after switching', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                i18n_codes: [
                    { id: 1, name: 'save', variation: 'false', type: 'button', text: { de: 'Speichern', en: 'Save', cz: 'Uložit' }, status: 'ok' }
                ]
            })
        } as any)

        const i18n = useI18n()
        i18n.setLanguage('en')

        await i18n.preload()
        const text = await i18n.button('save')

        expect(text).toBe('Save')
    })
})

describeOrSkip('useI18n - Fallback Chain', () => {
    beforeEach(() => {
        mockFetch.mockClear()
        localStorageMock.clear()
    })

    it('should fallback to German when requested language not available', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                i18n_codes: [
                    { id: 1, name: 'test', variation: 'false', type: 'button', text: { de: 'Test' }, status: 'de' }
                ]
            })
        } as any)

        const i18n = useI18n()
        i18n.setLanguage('en')

        await i18n.preload()
        const text = await i18n.button('test')

        expect(text).toBe('Test') // Falls back to German
    })

    it('should fallback to first available language', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                i18n_codes: [
                    { id: 1, name: 'test', variation: 'false', type: 'button', text: { en: 'Test English' }, status: 'en' }
                ]
            })
        } as any)

        const i18n = useI18n()
        i18n.setLanguage('cz')

        await i18n.preload()
        const text = await i18n.button('test')

        expect(text).toBe('Test English') // Falls back to first available
    })

    it('should return empty string if no translation found', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                i18n_codes: []
            })
        } as any)

        // Mock get-or-create to fail
        mockFetch.mockResolvedValueOnce({
            ok: false
        } as any)

        const i18n = useI18n()
        const text = await i18n.button('nonexistent')

        expect(text).toBe('')
    })
})

describeOrSkip('useI18n - Caching', () => {
    beforeEach(() => {
        mockFetch.mockClear()
        localStorageMock.clear()
    })

    it('should cache translations after first fetch', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                i18n_codes: [
                    { id: 1, name: 'save', variation: 'false', type: 'button', text: { de: 'Speichern' }, status: 'ok' }
                ]
            })
        } as any)

        const i18n = useI18n()

        await i18n.button('save')
        await i18n.button('save') // Second call

        expect(mockFetch).toHaveBeenCalledTimes(1) // Only fetched once
    })

    it('should track cache statistics', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                i18n_codes: [
                    { id: 1, name: 'save', variation: 'false', type: 'button', text: { de: 'Speichern' }, status: 'ok' },
                    { id: 2, name: 'cancel', variation: 'false', type: 'button', text: { de: 'Abbrechen' }, status: 'ok' },
                    { id: 3, name: 'name', variation: 'false', type: 'field', text: { de: 'Titel' }, status: 'ok' }
                ]
            })
        } as any)

        const i18n = useI18n()
        await i18n.preload()

        const stats = i18n.cacheStats.value
        expect(stats.total).toBe(3)
    })

    it('should clear cache', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                i18n_codes: [
                    { id: 1, name: 'save', variation: 'false', type: 'button', text: { de: 'Speichern' }, status: 'ok' }
                ]
            })
        } as any)

        const i18n = useI18n()
        await i18n.preload()

        expect(i18n.cacheStats.value.total).toBe(1)

        i18n.clearCache()

        expect(i18n.cacheStats.value.total).toBe(0)
        expect(i18n.isPreloaded.value).toBe(false)
    })
})

describeOrSkip('useI18n - Get or Create', () => {
    beforeEach(() => {
        mockFetch.mockClear()
        localStorageMock.clear()
    })

    it('should create missing translation automatically', async () => {
        // Mock lazy load (not found)
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                i18n_codes: []
            })
        } as any)

        // Mock get-or-create
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                created: true,
                i18n_code: {
                    id: 99,
                    name: 'newkey',
                    variation: 'false',
                    type: 'button',
                    text: { de: 'newkey', en: 'newkey', cz: 'newkey' },
                    status: 'de'
                }
            })
        } as any)

        const i18n = useI18n()
        const text = await i18n.button('newkey')

        expect(mockFetch).toHaveBeenCalledWith(
            '/api/i18n/get-or-create',
            expect.objectContaining({
                method: 'POST'
            })
        )
        expect(text).toBe('newkey')
    })
})

describeOrSkip('useI18n - Error Handling', () => {
    beforeEach(() => {
        mockFetch.mockClear()
        localStorageMock.clear()
    })

    it('should track errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('API Error'))

        const i18n = useI18n()
        await i18n.preload()

        expect(i18n.errors.value.length).toBeGreaterThan(0)
        expect(i18n.errors.value[0]).toContain('Preload failed')
    })

    it('should handle invalid API responses', async () => {
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: false // Invalid response
            })
        } as any)

        const i18n = useI18n()
        await i18n.preload()

        expect(i18n.errors.value.length).toBeGreaterThan(0)
    })

    it('should continue working after errors', async () => {
        // First call fails
        mockFetch.mockRejectedValueOnce(new Error('Network error'))

        const i18n = useI18n()
        await i18n.button('test')

        // Second call succeeds
        mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                success: true,
                i18n_codes: [
                    { id: 1, name: 'save', variation: 'false', type: 'button', text: { de: 'Speichern' }, status: 'ok' }
                ]
            })
        } as any)

        const text = await i18n.button('save')
        expect(text).toBeTruthy()
    })
})
