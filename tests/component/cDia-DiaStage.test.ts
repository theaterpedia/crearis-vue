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
})

describe('Shutter (the cover/blade)', () => {
    it('renders the cover with a flat colour', () => {
        // hex (jsdom drops oklch() as unparseable · the component takes any CSS colour)
        const w = mount(Shutter, { props: { color: '#101010' } })
        expect(w.find('.shutter').exists()).toBe(true)
        expect(w.find('.shutter').attributes('style') ?? '').toContain('background')
    })

    it('shows the separator modifier when separator=true (the gap-line)', () => {
        const w = mount(Shutter, { props: { separator: true } })
        expect(w.find('.shutter').classes()).toContain('shutter--separator')
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
