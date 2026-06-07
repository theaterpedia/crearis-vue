/**
 * BackSlide component-tests · image + theme-color + responsive shape.
 */

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BackSlide from '../../src/components/magnifica/BackSlide.vue'

describe('BackSlide component', () => {
    it('renders .panel-slide root with image-window + colored panel', () => {
        const w = mount(BackSlide, {
            props: { image: '/img/x.jpg' },
            slots: { default: '<h2>title</h2><p>body</p>' },
        })
        expect(w.find('.panel-slide').exists()).toBe(true)
        expect(w.find('.panel-image').exists()).toBe(true)
        expect(w.find('.panel-side').exists()).toBe(true)
        expect(w.find('.panel-text').exists()).toBe(true)
    })

    it('sets --panel-image inline CSS custom-property on the section', () => {
        const w = mount(BackSlide, {
            props: { image: '/img/spiegelkugel.jpg' },
        })
        const style = w.find('.panel-slide').attributes('style') ?? ''
        expect(style).toMatch(/--panel-image:\s*url\(['"]?\/img\/spiegelkugel\.jpg['"]?\)/)
    })

    it("maps themeColor 'yellow' to .panel-side--yellow", () => {
        const w = mount(BackSlide, { props: { image: '/x.jpg', themeColor: 'yellow' } })
        expect(w.find('.panel-side').classes()).toContain('panel-side--yellow')
    })

    it("maps 2022 alias 'secondary' to .panel-side--green (back-compat)", () => {
        const w = mount(BackSlide, { props: { image: '/x.jpg', themeColor: 'secondary' } })
        expect(w.find('.panel-side').classes()).toContain('panel-side--green')
    })

    it("maps 2022 alias 'warn' to .panel-side--dim", () => {
        const w = mount(BackSlide, { props: { image: '/x.jpg', themeColor: 'warn' } })
        expect(w.find('.panel-side').classes()).toContain('panel-side--dim')
    })

    it('renders default slot content inside .panel-text', () => {
        const w = mount(BackSlide, {
            props: { image: '/x.jpg' },
            slots: { default: '<h2>Closing arc</h2><p>Body text.</p>' },
        })
        const html = w.find('.panel-text').html()
        expect(html).toContain('Closing arc')
        expect(html).toContain('Body text.')
    })

    it('applies image-right variant class when imageRight=true (per howto §5.1)', () => {
        const w = mount(BackSlide, {
            props: { image: '/x.jpg', imageRight: true },
        })
        expect(w.find('.panel-slide').classes()).toContain('panel-slide--image-right')
    })

    it('does NOT apply image-right class when imageRight=false (default · image-left)', () => {
        const w = mount(BackSlide, { props: { image: '/x.jpg' } })
        expect(w.find('.panel-slide').classes()).not.toContain('panel-slide--image-right')
    })

    it('exposes the image-window as role=img with the provided aria-label for accessibility', () => {
        const w = mount(BackSlide, {
            props: { image: '/x.jpg', imageAlt: 'Spiegelkugel · Theater-Performance' },
        })
        const imageDiv = w.find('.panel-image')
        expect(imageDiv.attributes('role')).toBe('img')
        expect(imageDiv.attributes('aria-label')).toBe('Spiegelkugel · Theater-Performance')
    })

    it('defaults aria-label to empty string when imageAlt omitted (decorative)', () => {
        const w = mount(BackSlide, { props: { image: '/x.jpg' } })
        const imageDiv = w.find('.panel-image')
        expect(imageDiv.attributes('aria-label')).toBe('')
    })
})
