/**
 * cQuadrant component-tests · the held 2×2 grid-stage family (2026-06_quadrant.md · HP-spec
 * 2026-06-16). Covers the line-geometry formula, the cell's reveal-gating + background/heading,
 * and the stage rendering 4 cells with per-row reveal wiring (q1/q2 top · q3/q4 bottom).
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import Quadrant from '../../src/components/cQuadrant/Quadrant.vue'
import QuadrantSeam from '../../src/components/cQuadrant/QuadrantSeam.vue'
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

    it('heading is ALWAYS rendered; only the sub-element is reveal-gated (change 1)', () => {
        const hidden = mount(Quadrant, {
            props: { theme: 'green', heading: '**Q**', revealed: false },
            slots: { default: '<a class="probe">postit</a>' },
        })
        expect(hidden.find('.quadrant-heading').exists()).toBe(true) // heading shown regardless
        expect(hidden.find('.quadrant-sub').classes()).not.toContain('quadrant-sub--revealed')
        expect(hidden.find('.quadrant').classes()).toContain('quadrant--green')

        const shown = mount(Quadrant, {
            props: { theme: 'green', heading: '**Q**', revealed: true },
            slots: { default: '<a class="probe">postit</a>' },
        })
        expect(shown.find('.quadrant-sub').classes()).toContain('quadrant-sub--revealed')
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

    it('applies the post-it size tier (change 2 · default small)', () => {
        const dft = mount(Quadrant, { props: { heading: '**Q**' }, slots: { default: '<a>x</a>' } })
        expect(dft.find('.quadrant-sub').classes()).toContain('quadrant-sub--small')
        const lg = mount(Quadrant, { props: { heading: '**Q**', postitSize: 'large' }, slots: { default: '<a>x</a>' } })
        expect(lg.find('.quadrant-sub').classes()).toContain('quadrant-sub--large')
    })
})

describe('cQuadrant · QuadrantSeam (the opaque curtain · split preset · change 3)', () => {
    it('split preset splits "left | right" by the vertical line', () => {
        const w = mount(QuadrantSeam, { props: { preset: 'split', text: 'context | ethnography' } })
        expect(w.find('.quadrant-seam-split').exists()).toBe(true)
        expect(w.find('.quadrant-seam-split-cell--left').text()).toBe('context')
        expect(w.find('.quadrant-seam-split-cell--right').text()).toBe('ethnography')
    })

    it('split with an empty left side renders the right label only (the q1 image cell)', () => {
        const w = mount(QuadrantSeam, { props: { preset: 'split', text: ' | discourse' } })
        expect(w.find('.quadrant-seam-split-cell--left').text()).toBe('')
        expect(w.find('.quadrant-seam-split-cell--right').text()).toBe('discourse')
    })

    it('no text → no split content', () => {
        const w = mount(QuadrantSeam, { props: { preset: 'split' } })
        expect(w.find('.quadrant-seam-split').exists()).toBe(false)
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

    it('text-inverted toggle (change 1) · default = inverted ink, false = ink-dark', () => {
        const dft = mount(QuadrantStage, { props: { quadrants: quads } })
        expect(dft.find('.quadrant-stage').classes()).not.toContain('quadrant-stage--ink-dark')
        const dark = mount(QuadrantStage, { props: { quadrants: quads, textInverted: false } })
        expect(dark.find('.quadrant-stage').classes()).toContain('quadrant-stage--ink-dark')
    })

    it('post-it size · stage default + per-cell override (change 2)', () => {
        const spec: QuadrantSpec[] = [
            { id: 'q1', image: 'p.jpg' },
            { id: 'q2', heading: '**Q2**', postitSize: 'large' }, // per-cell override
            { id: 'q3', heading: '**Q3**' }, // inherits the stage default
            { id: 'q4', heading: '**Q4**' },
        ]
        const w = mount(QuadrantStage, {
            props: { quadrants: spec, postitSize: 'medium' },
            slots: { 'q-2': '<a>x</a>', 'q-3': '<a>y</a>' },
        })
        // the stage passes a default slot to every cell → all 4 render a .quadrant-sub (DOM order q1..q4)
        const subs = w.findAll('.quadrant-sub')
        expect(subs).toHaveLength(4)
        expect(subs[1]!.classes()).toContain('quadrant-sub--large') // q2 per-cell override
        expect(subs[2]!.classes()).toContain('quadrant-sub--medium') // q3 ← stage default
        expect(subs[0]!.classes()).toContain('quadrant-sub--medium') // q1 ← stage default
    })
})
