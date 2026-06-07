/**
 * CardsCanvas component-tests · items-array rendering + lane-distribution
 * fill-in for items missing position/rotation props.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CardsCanvas from '../../src/components/magnifica/CardsCanvas.vue'

describe('CardsCanvas component', () => {
    it('renders the .bb-board with persistent board-slot content', () => {
        const w = mount(CardsCanvas, {
            slots: { board: '<p>Persistent text</p>' },
        })
        expect(w.find('.bb-canvas').exists()).toBe(true)
        expect(w.find('.bb-board').exists()).toBe(true)
        expect(w.find('.bb-board-prose').html()).toContain('Persistent text')
    })

    it('renders post-its from the items prop', () => {
        const w = mount(CardsCanvas, {
            props: {
                items: [
                    { props: { headline: 'one', top: '8%', left: '5%' } },
                    { props: { headline: 'two', top: '32%', left: '62%' } },
                ],
            },
        })
        const postits = w.findAll('.bb-postit')
        expect(postits).toHaveLength(2)
        expect(postits[0]!.find('.bb-postit-headline').text()).toBe('one')
        expect(postits[1]!.find('.bb-postit-headline').text()).toBe('two')
    })

    it('passes authored position/rotation through unchanged', () => {
        const w = mount(CardsCanvas, {
            props: {
                items: [
                    { props: { headline: 'authored', top: '7%', left: '5%', rotate: '-2' } },
                ],
                rng: () => 0,
            },
        })
        const style = w.find('.bb-postit').attributes('style') ?? ''
        expect(style).toContain('--bb-top: 7%')
        expect(style).toContain('--bb-left: 5%')
        expect(style).toContain('--bb-rotate: -2deg')
    })

    it('fills in top/left/rotate for items that omit them (lane-distribution)', () => {
        // Inject deterministic rng=0.5 so randomInRange yields zero jitter
        // and pickRandom returns the middle element (rotateDeg=0)
        const w = mount(CardsCanvas, {
            props: {
                items: [
                    { props: { headline: 'a' } },
                    { props: { headline: 'b' } },
                    { props: { headline: 'c' } },
                    { props: { headline: 'd' } },
                    { props: { headline: 'e' } },
                ],
                rng: () => 0.5,
            },
        })
        const postits = w.findAll('.bb-postit')
        expect(postits).toHaveLength(5)
        // Round-robin lane assignment over DEFAULT_LANES = [5,25,45,62,85]
        const expectedLefts = ['5%', '25%', '45%', '62%', '85%']
        for (let i = 0; i < 5; i++) {
            const style = postits[i]!.attributes('style') ?? ''
            expect(style).toContain(`--bb-left: ${expectedLefts[i]}`)
            expect(style).toContain('--bb-rotate: 0deg')
        }
    })

    it('mixes authored + auto-filled items (authored values win)', () => {
        const w = mount(CardsCanvas, {
            props: {
                items: [
                    { props: { headline: 'authored', top: '8%', left: '5%', rotate: '-2' } },
                    { props: { headline: 'auto' } },
                ],
                rng: () => 0.5,
            },
        })
        const styles = w.findAll('.bb-postit').map((p) => p.attributes('style') ?? '')
        // Item 0: authored
        expect(styles[0]).toContain('--bb-top: 8%')
        expect(styles[0]).toContain('--bb-left: 5%')
        expect(styles[0]).toContain('--bb-rotate: -2deg')
        // Item 1: auto-filled · lane[1] = 25%
        expect(styles[1]).toContain('--bb-left: 25%')
    })

    it('renders an empty canvas when items is undefined and no slot', () => {
        const w = mount(CardsCanvas)
        expect(w.find('.bb-canvas').exists()).toBe(true)
        expect(w.findAll('.bb-postit')).toHaveLength(0)
    })

    it('renders default-slot post-its alongside items-array (both contracts honored)', () => {
        const w = mount(CardsCanvas, {
            props: {
                items: [{ props: { headline: 'from-items' } }],
            },
            slots: { default: '<article class="bb-postit"><h3 class="bb-postit-headline">from-slot</h3></article>' },
            rng: () => 0.5,
        })
        const headlines = w.findAll('.bb-postit-headline').map((h) => h.text())
        expect(headlines).toContain('from-items')
        expect(headlines).toContain('from-slot')
    })

    it('supports lane-override (more than 5 lanes)', () => {
        const w = mount(CardsCanvas, {
            props: {
                items: [
                    { props: { headline: 'a' } },
                    { props: { headline: 'b' } },
                    { props: { headline: 'c' } },
                    { props: { headline: 'd' } },
                    { props: { headline: 'e' } },
                    { props: { headline: 'f' } },
                ],
                lanes: [10, 30, 50, 70, 90, 95],
                rng: () => 0.5,
            },
        })
        const lefts = w.findAll('.bb-postit').map((p) => {
            const style = p.attributes('style') ?? ''
            const match = /--bb-left:\s*([^;]+);/.exec(style)
            return match ? match[1]!.trim() : null
        })
        expect(lefts).toEqual(['10%', '30%', '50%', '70%', '90%', '95%'])
    })
})
