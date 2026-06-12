/**
 * MagnificaScreen + MagnificaRise — the declarative sticky-screen container
 * (the §4 Cutter-Spec as props · emits the Doc B §4 recipe). The sticky CSS lives
 * in @media(≥768) so jsdom can't compute it; we assert the class + inline CSS-var
 * contract the recipe is keyed to.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import MagnificaScreen from '../../src/components/magnifica/MagnificaScreen.vue'
import MagnificaRise from '../../src/components/magnifica/MagnificaRise.vue'

describe('MagnificaScreen', () => {
    it('renders the #anchor slot inside .mag-screen-anchor (pinned by default)', () => {
        const w = mount(MagnificaScreen, {
            slots: { anchor: '<p class="x">2026-05-14</p>', default: '<div>body</div>' },
        })
        expect(w.find('.mag-screen').exists()).toBe(true)
        const anchor = w.find('.mag-screen-anchor')
        expect(anchor.exists()).toBe(true)
        expect(anchor.find('.x').exists()).toBe(true)
        expect(anchor.classes()).not.toContain('mag-screen-anchor--run-below')
    })

    it('applies the run-below header-option modifier', () => {
        const w = mount(MagnificaScreen, {
            props: { anchorPin: 'run-below' },
            slots: { anchor: '<p>h</p>' },
        })
        expect(w.find('.mag-screen-anchor').classes()).toContain('mag-screen-anchor--run-below')
    })

    it('omits the anchor wrapper when no #anchor slot is passed', () => {
        const w = mount(MagnificaScreen, { slots: { default: '<div>body</div>' } })
        expect(w.find('.mag-screen-anchor').exists()).toBe(false)
    })
})

describe('MagnificaRise', () => {
    it('defaults to the right lane with the pin CSS-var', () => {
        const w = mount(MagnificaRise, { props: { pin: 3 } })
        const el = w.find('.mag-rise')
        expect(el.classes()).toContain('mag-rise--right')
        expect(el.attributes('style')).toContain('--rise-pin: 3rem')
    })

    it('maps lane="left" to the left modifier', () => {
        const w = mount(MagnificaRise, { props: { lane: 'left' } })
        expect(w.find('.mag-rise').classes()).toContain('mag-rise--left')
    })

    it('sets --rise-pause (vh) only when pause is given (the gap-in-time stagger)', () => {
        const withPause = mount(MagnificaRise, { props: { pin: 8, pause: 50 } })
        expect(withPause.find('.mag-rise').attributes('style')).toContain('--rise-pause: 50vh')
        const noPause = mount(MagnificaRise, { props: { pin: 3 } })
        expect(noPause.find('.mag-rise').attributes('style') ?? '').not.toContain('--rise-pause')
    })

    it('marks a scrollable rise + sets --rise-scroll (tall content · gotcha #4)', () => {
        const w = mount(MagnificaRise, { props: { lane: 'right', pin: 3, pause: 50, scrollable: 80 } })
        expect(w.find('.mag-rise').classes()).toContain('mag-rise--scroll')
        expect(w.find('.mag-rise').attributes('style')).toContain('--rise-scroll: 80vh')
    })

    it('sets --rise-cover (z-index) only when cover is given', () => {
        const w = mount(MagnificaRise, { props: { cover: 3 } })
        expect(w.find('.mag-rise').attributes('style')).toContain('--rise-cover: 3')
    })
})
