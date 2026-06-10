/**
 * BackSlideStack assembler-tests · ordered slide-list + stack-default merge
 * (backslide-thread §2/§3 · §9.5 step 4).
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BackSlideStack from '../../src/components/magnifica/BackSlideStack.vue'
import type { BackSlideSpec } from '../../src/components/magnifica/types'

const slides: BackSlideSpec[] = [
    { image: '/a.jpg', panel: 'one **FIRST**' },
    { image: '/b.jpg', panel: 'two **SECOND**', theme: 'pink' },
]

describe('BackSlideStack assembler', () => {
    it('renders one slide per spec, in order', () => {
        const w = mount(BackSlideStack, { props: { slides } })
        const sl = w.findAll('.panel-slide')
        expect(sl).toHaveLength(2)
        expect(sl[0].attributes('style')).toContain('/a.jpg')
        expect(sl[1].attributes('style')).toContain('/b.jpg')
    })

    it('renders each slide panel heading from its md', () => {
        const w = mount(BackSlideStack, { props: { slides } })
        const texts = w.findAll('.panel-text').map((n) => n.html())
        expect(texts[0]).toContain('FIRST')
        expect(texts[1]).toContain('SECOND')
    })

    it('applies a stack-default theme, with the per-slide override winning', () => {
        const w = mount(BackSlideStack, { props: { slides, theme: 'green' } })
        const sides = w.findAll('.panel-side')
        expect(sides[0].classes()).toContain('panel-side--green') // stack default
        expect(sides[1].classes()).toContain('panel-side--pink') // per-slide override
    })

    it('passes stack-level bounded down to every slide', () => {
        const w = mount(BackSlideStack, { props: { slides, bounded: true } })
        w.findAll('.panel-slide').forEach((s) =>
            expect(s.classes()).toContain('panel-slide--bounded'),
        )
    })

    it('applies the stack-default focal to a slide that declares none', () => {
        const w = mount(BackSlideStack, {
            props: { slides: [{ image: '/c.jpg' }], imgTmpAlignX: 'left', imgTmpAlignY: 'top' },
        })
        const style = w.find('.panel-image').attributes('style') ?? ''
        expect(style).toMatch(/background-position:\s*left top/)
    })

    it('lets a per-slide focal override beat the stack default', () => {
        const w = mount(BackSlideStack, {
            props: {
                slides: [{ image: '/d.jpg', imgTmpAlignX: 'right', imgTmpAlignY: 'center' }],
                imgTmpAlignX: 'left',
                imgTmpAlignY: 'top',
            },
        })
        const style = w.find('.panel-image').attributes('style') ?? ''
        expect(style).toMatch(/background-position:\s*right center/)
    })

    it('wraps the slides as direct children of a plain block (ancestor-purity)', () => {
        const w = mount(BackSlideStack, { props: { slides } })
        const root = w.find('.backslide-stack')
        expect(root.element.tagName).toBe('DIV')
        expect(root.element.children.length).toBe(2)
    })

    it('propagates a stack-default scroll-over with ascending z-index per slide', () => {
        const w = mount(BackSlideStack, { props: { slides, transition: 'scroll-over' } })
        const sl = w.findAll('.panel-slide')
        sl.forEach((s) => expect(s.classes()).toContain('panel-slide--scroll-over'))
        expect(sl[0].attributes('style')).toContain('--slide-z: 0')
        expect(sl[1].attributes('style')).toContain('--slide-z: 1')
    })

    it('lets a per-slide transition override the stack default', () => {
        const w = mount(BackSlideStack, {
            props: {
                slides: [
                    { image: '/a.jpg' },
                    { image: '/b.jpg', transition: 'uncover' },
                ],
                transition: 'scroll-over',
            },
        })
        const sl = w.findAll('.panel-slide')
        expect(sl[0].classes()).toContain('panel-slide--scroll-over')
        expect(sl[1].classes()).not.toContain('panel-slide--scroll-over')
    })
})
