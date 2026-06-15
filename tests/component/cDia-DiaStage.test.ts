/**
 * DiaStage + Dia + Shutter — the shadow-theater stage primitive (HM 2026-06-12).
 * The pin/scroll CSS lives in @media(≥768)/sticky; jsdom can't compute it — assert the
 * class + inline-var + a11y contract the z-stack (Dia z1 · Figure z2 · Shutter z3) is keyed to.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import DiaStage from '../../src/components/cDia/DiaStage.vue'
import Dia from '../../src/components/cDia/Dia.vue'
import Shutter from '../../src/components/cDia/Shutter.vue'
import type { DiaBildSpec } from '../../src/components/cDia/types'

describe('DiaStage', () => {
    it('renders one held Dia + Figure per Bild + a seam between, with the Gasse vars (§34/§38·1)', () => {
        const bilder: DiaBildSpec[] = [
            { dia: { image: '/a.jpg', imageAlt: 'a' }, figure: 'over **HEAD-A**', lane: 'left' },
            { dia: {}, figure: 'two **HEAD-B**', lane: 'left' },
        ]
        const w = mount(DiaStage, { props: { bilder, leftWidth: 40 } })
        const stage = w.find('.dia-stage')
        expect(stage.exists()).toBe(true)
        expect(stage.classes()).toContain('dia-stage--shutter-lift') // the default transition (§35)
        const style = stage.attributes('style') ?? ''
        expect(style).toContain('--dia-left-w: 40%')
        expect(style).toContain('--dia-right-w: 60%')
        expect(w.findAll('.dia').length).toBe(2) // one held Dia per Bild
        expect(w.findAll('.shutter--seam').length).toBe(1) // one seam between two scenes
        expect(w.html()).toContain('HEAD-A') // figure md → HeadingParser
        expect(w.html()).toContain('HEAD-B')
    })

    it('switches the transition (z-strategy + seam-CSS keyed to the prop · §34.4)', () => {
        const bilder: DiaBildSpec[] = [{ dia: {} }, { dia: {} }]
        const w = mount(DiaStage, { props: { bilder, transition: 'rise-over' } })
        expect(w.find('.dia-stage').classes()).toContain('dia-stage--rise-over')
    })
})

describe('Dia (the held plate)', () => {
    it('renders an image plate as role=img with the focal background-position', () => {
        const w = mount(Dia, {
            props: { image: '/i.jpg', imageAlt: 'a held plate', imgTmpAlignY: 'top', lane: 'left' },
        })
        const el = w.find('.dia')
        expect(el.classes()).toContain('dia--left')
        expect(el.attributes('role')).toBe('img')
        expect(el.attributes('aria-label')).toBe('a held plate')
        // §34.3 · the Dia is a SINGLE held element (the over-tall transform-cover is DROPPED) — the
        // focal background lives on the `.dia` root itself; held via sticky-to-stage + --dia-h.
        const style = el.attributes('style') ?? ''
        expect(style).toContain('/i.jpg')
        expect(style).toContain('background-position: center top')
    })

    it('is a text-Dia (no role=img · .dia--text) when no image is given', () => {
        const w = mount(Dia, { props: { lane: 'full' }, slots: { default: '<p>held text</p>' } })
        const el = w.find('.dia')
        expect(el.classes()).toContain('dia--text')
        expect(el.classes()).toContain('dia--full')
        expect(el.attributes('role')).toBeUndefined()
        // §34.3 · the held text lives directly in the single `.dia` element (no inner plate)
        expect(el.find('p').text()).toBe('held text')
    })

    it('uses background-size:contain for fit="contain" (1:1 · bg shows through · Außenkreis-r1)', () => {
        const w = mount(Dia, { props: { image: '/i.jpg', fit: 'contain', imgTmpAlignY: 'top' } })
        const style = w.find('.dia').attributes('style') ?? ''
        expect(style).toContain('background-size: contain')
        expect(style).toContain('background-position: center top')
    })

    it('defaults to background-size:cover (fill + crop)', () => {
        const w = mount(Dia, { props: { image: '/i.jpg' } })
        expect(w.find('.dia').attributes('style') ?? '').toContain('background-size: cover')
    })
})

describe('Shutter (the cover/blade)', () => {
    it('maps the bg colour-token to its var (default = the page bg)', () => {
        expect(mount(Shutter, { props: { bg: 'primary' } }).find('.shutter').attributes('style') ?? '')
            .toContain('var(--color-primary-bg)')
        expect(mount(Shutter).find('.shutter').attributes('style') ?? '').toContain('var(--color-bg)')
    })

    it('sizes the line via vSize/hSize (length×weight vars) + maps the line colour', () => {
        const w = mount(Shutter, { props: { vSize: 'medium', hSize: 'thinline', lineColor: 'primary' } })
        const style = w.find('.shutter').attributes('style') ?? ''
        expect(style).toContain('--line-v-len: 60%') // medium = 60% length
        expect(style).toContain('--line-h-wt: 1px') // thinline = 1px weight
        expect(style).toContain('--line-color: var(--color-primary-bg)')
    })

    it('parses the text md into headings (HeadingParser) + prose, per preset', () => {
        const w = mount(Shutter, { props: { preset: 'timeline', text: '## 10:30 **OPENING**\nThe room holds.' } })
        const el = w.find('.shutter')
        expect(el.classes()).toContain('shutter--timeline')
        const html = el.html()
        expect(html).toContain('OPENING') // ## → HeadingParser
        expect(html).toContain('The room holds.') // prose
    })

    it('renders a full-bleed blade image', () => {
        const w = mount(Shutter, { props: { image: '/blade.jpg' } })
        const style = w.find('.shutter').attributes('style') ?? ''
        expect(style).toContain('/blade.jpg')
        expect(style).toContain('background-size: cover')
    })

    it('writes a brief seam-blade height via heightVh (--shutter-h · keeps the cadence slight)', () => {
        const w = mount(Shutter, { props: { heightVh: 36 } })
        expect(w.find('.shutter').attributes('style') ?? '').toContain('--shutter-h: 36vh')
    })

    it('marks a between-scenes seam with the transition-keyed class (shutter-lift default · §34.4)', () => {
        const w = mount(Shutter, { props: { seam: true } })
        const el = w.find('.shutter')
        expect(el.classes()).toContain('shutter--seam')
        expect(el.classes()).toContain('shutter--shutter-lift')
    })
})
