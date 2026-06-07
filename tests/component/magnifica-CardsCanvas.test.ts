/**
 * CardsCanvas component-tests · sticky-scroll blackboard (2026-06-07 · cardscanvas-scroll).
 *
 * CardsCanvas renders post-its as `position: sticky` siblings of the board (the 2022 /
 * howto-blackboard pattern), NOT absolute-positioned FloatingPostIts. Each card carries
 * its semantic .bb-{color} class + an inline top/left/marginTop/transform; the board
 * #board slot holds the persistent prose. Per-item `sticky: false` opts out (scrolls off).
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CardsCanvas from '../../src/components/magnifica/CardsCanvas.vue'

describe('CardsCanvas sticky-scroll blackboard', () => {
    it('renders the .bb-board with persistent board-slot content', () => {
        const w = mount(CardsCanvas, { slots: { board: '<p>Persistent text</p>' } })
        expect(w.find('.bb-canvas').exists()).toBe(true)
        expect(w.find('.bb-board').exists()).toBe(true)
        expect(w.find('.bb-board-prose').html()).toContain('Persistent text')
    })

    it('renders one .bb-postit per item, with mapped semantic color class + content', () => {
        const w = mount(CardsCanvas, {
            props: {
                items: [
                    { props: { overline: 'o1', headline: 'one', bodyText: 'a', themeColor: 'yellow' } },
                    { props: { headline: 'two', bodyText: 'b', themeColor: 'green' } },
                ],
            },
        })
        const cards = w.findAll('.bb-postit')
        expect(cards).toHaveLength(2)
        expect(cards[0]!.classes()).toContain('bb-primary') // yellow → primary
        expect(cards[1]!.classes()).toContain('bb-positive') // green → positive
        expect(cards[0]!.find('.bb-postit-headline').text()).toBe('one')
        expect(cards[0]!.find('.bb-postit-overline').text()).toBe('o1')
    })

    it('positions each card sticky with inline top/left/transform', () => {
        const w = mount(CardsCanvas, {
            props: { items: [{ props: { headline: 'x', themeColor: 'pink', top: '12%', left: '40%', rotate: '-2' } }] },
        })
        const card = w.find('.bb-postit')
        const style = card.attributes('style') || ''
        expect(style).toMatch(/top:\s*12%/)
        expect(style).toMatch(/left:\s*40%/)
        expect(style).toMatch(/rotate\(-2deg\)/)
        expect(card.classes()).toContain('bb-negative') // pink → negative
        // sticky comes from the .bb-postit class (not the opt-out modifier)
        expect(card.classes()).not.toContain('bb-postit--nosticky')
    })

    it('marks a card sticky:false with the opt-out modifier (scrolls off instantly)', () => {
        const w = mount(CardsCanvas, {
            props: { items: [{ props: { headline: 'instant', sticky: false } }] },
        })
        expect(w.find('.bb-postit').classes()).toContain('bb-postit--nosticky')
    })

    it('renders an empty canvas when items is undefined', () => {
        const w = mount(CardsCanvas)
        expect(w.find('.bb-canvas').exists()).toBe(true)
        expect(w.findAll('.bb-postit')).toHaveLength(0)
    })
})
