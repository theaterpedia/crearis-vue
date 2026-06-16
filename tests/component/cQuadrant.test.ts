/**
 * cQuadrant component-tests · the held 2×2 grid-stage family (2026-06_quadrant.md · HP-spec
 * 2026-06-16). Covers the line-geometry formula, the cell's reveal-gating + background/heading,
 * and the stage rendering 4 cells with per-row reveal wiring (q1/q2 top · q3/q4 bottom).
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Quadrant from '../../src/components/cQuadrant/Quadrant.vue'
import QuadrantStage from '../../src/components/cQuadrant/QuadrantStage.vue'
import { crossGeometry } from '../../src/components/cQuadrant/types'
import type { QuadrantSpec } from '../../src/components/cQuadrant/types'

describe('cQuadrant · crossGeometry (the cross-hair formula · ported from cDia/Shutter §Außenkreis-r2)', () => {
    it('none → every arm 0 (invisible)', () => {
        expect(crossGeometry('none', 'none', 'full')).toEqual({ vLen: '0', vWt: '0', hLen: '0', hWt: '0' })
    })
    it('full/full on a full shutter · v-arm = 4/5 (cap), h-arm width-based 100%', () => {
        expect(crossGeometry('full', 'full', 'full')).toEqual({ vLen: '80%', vWt: '2px', hLen: '100%', hWt: '2px' })
    })
    it('the v-arm is HEIGHT-CLAMPED · a full v-line on a small shutter runs 100% (the cap)', () => {
        expect(crossGeometry('full', 'none', 'small')).toEqual({ vLen: '100%', vWt: '2px', hLen: '0', hWt: '0' })
    })
    it('weight tokens run full-length at their weight', () => {
        expect(crossGeometry('hairline', 'thinline', 'full')).toEqual({ vLen: '80%', vWt: '0.5px', hLen: '100%', hWt: '1px' })
    })
})

describe('cQuadrant · Quadrant (the cell)', () => {
    it('paints an image background as the cell role=img with the focal, content hidden until revealed', () => {
        const w = mount(Quadrant, {
            props: { image: 'x.jpg', imageAlt: 'alt', imgTmpAlignY: 'top', heading: '**Held**' },
        })
        const el = w.find('.quadrant')
        expect(el.attributes('role')).toBe('img')
        const style = el.attributes('style') || ''
        expect(style).toMatch(/background-position:\s*center top/)
        expect(style).toMatch(/background-size:\s*cover/) // always-fill (cut-off)
        // not revealed by default → no reveal modifier
        expect(el.classes()).not.toContain('quadrant--revealed')
    })

    it('flips the reveal modifier when :revealed', () => {
        const w = mount(Quadrant, { props: { theme: 'green', heading: '**Q**', revealed: true } })
        expect(w.find('.quadrant').classes()).toContain('quadrant--revealed')
        expect(w.find('.quadrant').classes()).toContain('quadrant--green')
    })

    it('image-only cell (no heading, no slot) renders no content layer (q1 · "nothing appears")', () => {
        const w = mount(Quadrant, { props: { image: 'x.jpg' } })
        expect(w.find('.quadrant-content').exists()).toBe(false)
    })

    it('renders an in-place sub-element slot (the post-it · A3)', () => {
        const w = mount(Quadrant, {
            props: { theme: 'dim', heading: '**Q4**' },
            slots: { default: '<a class="probe">postit</a>' },
        })
        expect(w.find('.quadrant-sub .probe').exists()).toBe(true)
    })
})

describe('cQuadrant · QuadrantStage (the assembler)', () => {
    const quads: QuadrantSpec[] = [
        { id: 'q1', image: 'pope.jpg' },
        { id: 'q2', theme: 'yellow', heading: '**Q2**' },
        { id: 'q3', theme: 'green', heading: '**Q3**' },
        { id: 'q4', theme: 'dim', heading: '**Q4**' },
    ]

    it('renders exactly 4 cells from the spec and passes the per-cell slot', () => {
        const w = mount(QuadrantStage, {
            props: { quadrants: quads },
            slots: { 'q-2': '<span class="p2">discourse</span>' },
        })
        expect(w.find('.quadrant-stage').exists()).toBe(true)
        expect(w.findAll('.quadrant')).toHaveLength(4)
        expect(w.find('.quadrant-stage-seam').exists()).toBe(true)
        expect(w.find('.p2').exists()).toBe(true)
    })

    it('caps at 4 cells even if more are supplied', () => {
        const w = mount(QuadrantStage, { props: { quadrants: [...quads, { id: 'q5' }] } })
        expect(w.findAll('.quadrant')).toHaveLength(4)
    })

    it('reducedMotion reveals every row immediately (the no-trap floor)', async () => {
        const w = mount(QuadrantStage, { props: { quadrants: quads, reducedMotion: true } })
        await w.vm.$nextTick() // onMounted sets the reveal refs → flush the render
        // all four cells carry the reveal modifier (q1 has no content but the modifier still applies)
        expect(w.findAll('.quadrant--revealed')).toHaveLength(4)
    })
})
