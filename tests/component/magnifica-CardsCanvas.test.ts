/**
 * CardsCanvas component-tests · fpostit board-mode (2026-06-06).
 *
 * CardsCanvas is now a thin wrapper over the shared fpostit board-mode: items map to
 * pinned <FloatingPostIt hlogic="static-board"> via buildBoardItems(), with OKLCH theme
 * colors. The board cards are teleport-disabled (render in-place inside .bb-canvas).
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CardsCanvas from '../../src/components/magnifica/CardsCanvas.vue'

describe('CardsCanvas board-mode', () => {
    it('renders the .bb-board with persistent board-slot content', () => {
        const w = mount(CardsCanvas, { slots: { board: '<p>Persistent text</p>' } })
        expect(w.find('.bb-canvas').exists()).toBe(true)
        expect(w.find('.bb-board').exists()).toBe(true)
        expect(w.find('.bb-board-prose').html()).toContain('Persistent text')
    })

    it('renders one pinned FloatingPostIt per item, with mapped OKLCH color + title', () => {
        const w = mount(CardsCanvas, {
            props: {
                items: [
                    { props: { headline: 'one', bodyText: 'a', themeColor: 'yellow' } },
                    { props: { headline: 'two', bodyText: 'b', themeColor: 'green' } },
                ],
                rng: () => 0.5,
            },
        })
        const cards = w.findAll('.floating-postit')
        expect(cards).toHaveLength(2)
        expect(cards[0]!.classes()).toContain('floating-postit--board')
        expect(cards[0]!.classes()).toContain('bg-primary') // yellow → primary
        expect(cards[1]!.classes()).toContain('bg-positive') // green → positive
        expect(cards[0]!.find('.fpostit-title').text()).toBe('one')
    })

    it('pins each card with absolute top/left from lane-distribution', () => {
        const w = mount(CardsCanvas, {
            props: {
                items: [{ props: { headline: 'x', themeColor: 'pink' } }],
                rng: () => 0.5,
            },
        })
        const style = w.find('.floating-postit').attributes('style') || ''
        expect(style).toMatch(/position:\s*absolute/)
        expect(style).toMatch(/top:/)
        expect(style).toMatch(/left:/)
        expect(w.find('.floating-postit').classes()).toContain('bg-negative') // pink → negative
    })

    it('renders an empty canvas when items is undefined', () => {
        const w = mount(CardsCanvas)
        expect(w.find('.bb-canvas').exists()).toBe(true)
        expect(w.findAll('.floating-postit')).toHaveLength(0)
    })
})
