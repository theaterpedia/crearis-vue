/**
 * pageStructure — the resolver for page-structural modes (uia thread §18–§20).
 *
 * Decision-encoding: absence = the view default (never written) · unknown
 * values warn and resolve to undefined (a typo must never restructure a page
 * silently) · dia-show gates the body to the cDia family · the SiteLayout
 * values are THE LIFTED ENUM, not coined words (§19·4 lift-don't-coin).
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import {
    resolvePageStructure,
    availableBodyFamilies,
    DIA_SHOW_MOUNT,
} from '@/utils/pageStructure'
import { SITE_LAYOUTS } from '@/layoutsettings'

afterEach(() => vi.restoreAllMocks())

describe('resolvePageStructure · absence declares the default', () => {
    it('resolves nothing from an empty/absent options object', () => {
        expect(resolvePageStructure({})).toEqual({})
        expect(resolvePageStructure(null)).toEqual({})
        expect(resolvePageStructure(undefined)).toEqual({})
    })

    it('lifts a valid site_layout — the enum as it stands, centered included', () => {
        expect(resolvePageStructure({ site_layout: 'fullTwo' }).siteLayout).toBe('fullTwo')
        expect(resolvePageStructure({ site_layout: 'centered' }).siteLayout).toBe('centered')
        expect(SITE_LAYOUTS).toContain('centered') // the G-1 single-sourcing holds
    })

    it('resolves body_type dia-show; fluent is never a written value', () => {
        expect(resolvePageStructure({ body_type: 'dia-show' }).bodyType).toBe('dia-show')
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        expect(resolvePageStructure({ body_type: 'fluent' }).bodyType).toBeUndefined()
        expect(warn).toHaveBeenCalled()
    })

    it('warns on unknown values and falls back to the view default', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
        const structure = resolvePageStructure({ site_layout: '2-mains', body_type: 'slideshow' })
        expect(structure.siteLayout).toBeUndefined()
        expect(structure.bodyType).toBeUndefined()
        expect(warn).toHaveBeenCalledTimes(2)
    })
})

describe('the gate · modes decide the option-space (§18·1·3)', () => {
    it('dia-show composes from the cDia family, fluent from sections', () => {
        expect(availableBodyFamilies({ bodyType: 'dia-show' })).toEqual(['cDia'])
        expect(availableBodyFamilies({})).toEqual(['sections'])
    })

    it('the dia-show mount carries its two silent traps as importable facts', () => {
        expect(DIA_SHOW_MOUNT.reducedMotionProp).toBe(false)
        expect(DIA_SHOW_MOUNT.ancestorPurity).toContain('transform')
    })
})
