/**
 * useTemplateCode — flag-gate scaffold for shortcode rendering (SFR-76 / CV-BRIEF §2.4).
 */

import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import {
    useTemplateCode,
    readTemplateCode,
    TEMPLATE_CODE_DEFAULT,
} from '@/composables/useTemplateCode'

describe('TEMPLATE_CODE_DEFAULT', () => {
    it('defaults to false (no shortcode unless explicitly enabled)', () => {
        expect(TEMPLATE_CODE_DEFAULT).toBe(false)
    })
})

describe('readTemplateCode (pure)', () => {
    it('returns false for null / undefined / missing config', () => {
        expect(readTemplateCode(null)).toBe(false)
        expect(readTemplateCode(undefined)).toBe(false)
        expect(readTemplateCode({})).toBe(false)
        expect(readTemplateCode({ config: null })).toBe(false)
        expect(readTemplateCode({ config: {} })).toBe(false)
    })

    it('returns false when explicitly false', () => {
        expect(readTemplateCode({ config: { useTemplateCode: false } })).toBe(false)
    })

    it('returns true when explicitly true', () => {
        expect(readTemplateCode({ config: { useTemplateCode: true } })).toBe(true)
    })

    it('returns default for non-boolean config value', () => {
        expect(readTemplateCode({ config: { useTemplateCode: 'yes' as unknown as boolean } })).toBe(false)
        expect(readTemplateCode({ config: { useTemplateCode: 1 as unknown as boolean } })).toBe(false)
        expect(readTemplateCode({ config: { useTemplateCode: null as unknown as boolean } })).toBe(false)
    })

    it('coexists with other config keys', () => {
        expect(
            readTemplateCode({
                config: {
                    useTemplateCode: true,
                    pageBottom: { consulting: { call: '15-mins' } },
                    seo_title: 'whatever',
                },
            }),
        ).toBe(true)
    })
})

describe('useTemplateCode (composable)', () => {
    it('reactivity: recomputes when project ref mutates', () => {
        const project = ref<{ config: { useTemplateCode?: boolean } } | null>({
            config: { useTemplateCode: false },
        })
        const { useTemplateCode: flag } = useTemplateCode(project)

        expect(flag.value).toBe(false)

        project.value = { config: { useTemplateCode: true } }
        expect(flag.value).toBe(true)

        project.value = null
        expect(flag.value).toBe(false)
    })

    it('respects the default when config is absent', () => {
        const project = ref<{ config?: undefined } | null>({})
        const { useTemplateCode: flag } = useTemplateCode(project)
        expect(flag.value).toBe(TEMPLATE_CODE_DEFAULT)
    })
})
